import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging, type MulticastMessage } from 'firebase-admin/messaging';
import type { Types } from 'mongoose';
import { FCMTokenModel, type IFCMToken } from '../models/fcm_token_model.js';

let firebaseApp: App | undefined = undefined;
let messagingInstance: Messaging | null = null;

/**
 * Initializes and returns the Firebase Messaging instance.
 * Locates the service account credential file from FIREBASE_SERVICE_ACCOUNT_PATH
 * or automatically looks for matching JSON files in the project root.
 */
export const getFirebaseMessaging = (): Messaging | null => {
    if (messagingInstance) return messagingInstance;

    try {
        if (getApps().length > 0) {
            firebaseApp = getApps()[0];
        } else {
            const rootDir = process.cwd();
            const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
            let serviceAccountPath = envPath ? path.resolve(rootDir, envPath) : '';

            if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
                const files = fs.readdirSync(rootDir);
                const discovered = files.find(
                    (f) => f.includes('firebase-adminsdk') && f.endsWith('.json')
                );
                if (discovered) {
                    serviceAccountPath = path.resolve(rootDir, discovered);
                }
            }

            if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                firebaseApp = initializeApp({
                    credential: cert(serviceAccount),
                });
                console.log(`[Firebase] Initialized with credentials from: ${path.basename(serviceAccountPath)}`);
            } else {
                console.warn('[Firebase] Warning: No Firebase service account file found. Push notifications will be skipped.');
                return null;
            }
        }

        if (firebaseApp) {
            messagingInstance = getMessaging(firebaseApp);
        }
        return messagingInstance;
    } catch (err) {
        console.error('[Firebase] Failed to initialize Firebase Admin SDK:', err);
        return null;
    }
};

export interface SaveFcmTokenParams {
    userId: Types.ObjectId | string;
    fcmToken: string;
    platform?: string;
    deviceInfo?: any;
}

/**
 * Saves or updates an FCM token for a given user.
 * If the FCM token already exists (e.g. device token reused or user switched),
 * it updates the token with the new user_id, latest device_info, and last_used date.
 */
export const saveOrUpdateFcmToken = async ({
    userId,
    fcmToken,
    platform,
    deviceInfo,
}: SaveFcmTokenParams): Promise<IFCMToken | null> => {
    if (!fcmToken || typeof fcmToken !== 'string' || !fcmToken.trim() || !userId) {
        return null;
    }

    const trimmedToken = fcmToken.trim();
    const normalizedPlatform = (platform && typeof platform === 'string' ? platform.trim().toLowerCase() : 'android') || 'android';
    const parsedDeviceInfo = deviceInfo && typeof deviceInfo === 'object' ? deviceInfo : (deviceInfo ? { raw: deviceInfo } : {});

    const updatedToken = await FCMTokenModel.findOneAndUpdate(
        { fcm_token: trimmedToken },
        {
            $set: {
                user_id: userId,
                fcm_token: trimmedToken,
                platform: normalizedPlatform,
                device_info: parsedDeviceInfo,
                last_used: new Date(),
            },
        },
        {
            upsert: true,
            returnDocument: 'after',
            setDefaultsOnInsert: true,
        }
    );

    return updatedToken;
};

/**
 * Retrieves all active FCM tokens for a user ID.
 */
export const getTokensByUserId = async (userId: Types.ObjectId | string): Promise<string[]> => {
    if (!userId) return [];
    const tokens = await FCMTokenModel.find({ user_id: userId }).select('fcm_token').lean();
    return tokens.map((t) => t.fcm_token);
};

/**
 * Removes an FCM token, useful on user logout.
 */
export const removeFcmToken = async (fcmToken: string): Promise<boolean> => {
    if (!fcmToken || typeof fcmToken !== 'string') return false;
    const result = await FCMTokenModel.deleteOne({ fcm_token: fcmToken.trim() });
    return (result.deletedCount ?? 0) > 0;
};

export interface SendPushNotificationParams {
    userId: Types.ObjectId | string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

/**
 * Sends a push notification to all active devices registered for a user.
 * Stale or invalid tokens are automatically cleaned up from the database.
 */
export const sendPushNotificationToUser = async ({
    userId,
    title,
    body,
    data = {},
}: SendPushNotificationParams): Promise<{ success: boolean; sentCount: number; failureCount: number }> => {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
        console.warn('[FCM] Firebase messaging not initialized. Skipping notification.');
        return { success: false, sentCount: 0, failureCount: 0 };
    }

    const tokens = await getTokensByUserId(userId);
    if (!tokens || tokens.length === 0) {
        console.log(`[FCM] No FCM tokens found for user: ${userId}`);
        return { success: false, sentCount: 0, failureCount: 0 };
    }

    const message: MulticastMessage = {
        tokens,
        notification: {
            title,
            body,
        },
        data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                priority: 'high',
                channelId: 'orders_channel',
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                },
            },
        },
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`[FCM] Sent notification to user ${userId}: ${response.successCount} succeeded, ${response.failureCount} failed.`);

        // Clean up invalid or unregistered tokens from database
        if (response.failureCount > 0) {
            response.responses.forEach(async (resp, idx) => {
                if (!resp.success && resp.error) {
                    const errorCode = resp.error.code;
                    if (
                        errorCode === 'messaging/registration-token-not-registered' ||
                        errorCode === 'messaging/invalid-registration-token'
                    ) {
                        const expiredToken = tokens[idx];
                        if (expiredToken) {
                            console.log(`[FCM] Removing stale/invalid token from DB: ${expiredToken}`);
                            await removeFcmToken(expiredToken);
                        }
                    }
                }
            });
        }

        return {
            success: response.successCount > 0,
            sentCount: response.successCount,
            failureCount: response.failureCount,
        };
    } catch (err) {
        console.error(`[FCM] Error sending multicast push notification to user ${userId}:`, err);
        return { success: false, sentCount: 0, failureCount: tokens.length };
    }
};

export interface OrderNotificationParams {
    userId: Types.ObjectId | string;
    orderId: string;
    totalAmount: number;
    customTitle?: string;
    customBody?: string;
    itemCount?: number;
    status?: string;
}

/**
 * Triggers an order created push notification for the given user and order details.
 */
export const sendOrderCreatedNotification = async ({
    userId,
    orderId,
    totalAmount,
    customTitle,
    customBody,
    itemCount,
    status = 'pending',
}: OrderNotificationParams) => {
    const title = customTitle || 'Order Placed Successfully! 🎉';
    const body = customBody || (
        itemCount && itemCount > 1
            ? `Your order #${orderId} with ${itemCount} items for ₹${totalAmount} has been placed.`
            : `Your order #${orderId} for ₹${totalAmount} has been placed successfully.`
    );

    return await sendPushNotificationToUser({
        userId,
        title,
        body,
        data: {
            type: 'ORDER_CREATED',
            order_id: orderId,
            total_amount: String(totalAmount),
            status: String(status),
        },
    });
};
