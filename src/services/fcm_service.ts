import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging, type MulticastMessage } from 'firebase-admin/messaging';
import type { Types } from 'mongoose';
import { FCMTokenModel, type IFCMToken } from '../models/fcm_token_model.js';

let firebaseApp: App | undefined = undefined;
let messagingInstance: Messaging | null = null;

const FIREBASE_SERVICE_ACCOUNT = {
    type: 'service_account',
    project_id: 'smart-icpl',
    private_key_id: '61f17ffb791e65b85e27d52238cc7ef7b8150385',
    private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC33VrQajLcv7ak\nKWXajNdhkcq1qvdDMWYs4RWYR+Sh1zGAL7wBGELpmoN2dC3IQsS2PBVcV/0sBgSz\ncWK5dAm0FQpwz2OCEPSqs6uN6YZaD9Q4MqNYfcmpbE84/ylQ9AZD+DF1x8tmDGXS\n1Pj5NqNCkRP3TNkZR4fevCJBtHrL5P+WVl8Ikuvx921B/J39Wj+fPTHWC8xzdXdF\niRJY2oVcOsY4CiaNYUal6sGETYYfwEMrlfOYeJg9XR7GEeb/8bSkm3iiAp2/NAo+\nHCoTPHblpH3AW/5/egtmE20trEyhL1dfdcN6N2gtmIH7k/ljAiPmpV4ZulsxxiSH\nLU10Oj+pAgMBAAECggEAIE6NQ/y9Fiu7kGnTw0ynFbZT24sAanaWIQGl1T2gr01M\nHd2FV93m9/wV6GzulHci8HBrQnAVhLREBDHCqpp4kAN4c60FK5gGHa53UPa9DDsm\ny38eU5C6rAHjg7zWCirupOfJ7Qufsj0wcRTJ8KRImIw8aWI/7WCzv4/oJwpq30N/\nkNFquvVJafzDpN5QrFweX95DFUMXVduNPzKdASN3hijqpWfklx/bcrFvZd2NVOaC\nepgydPR9ZEeS6UYkF5+bFXLN9vRTsA6brStWJ9IJnfER3hwPjywf5boMJ22Tflbo\n3oPzSOjx47B+sJdlulBWRg+bEzBA8XfUy7MDCIOVhwKBgQDuFHz0/stYsVvj2W2S\n+fAvyHcH6bN7Y37PWTTC04FFTeWEVNzV7kNd3owIdoH1dw02OcDb7E8EVMtY5msT\nGEsLukdDdXGsVDBXb95T3QOL1IX8Bg7NBhRH4A/+BkcvAaFjtgI2oN9Jx2GdGVnU\n/Of98ZEAZVbxVMNF2ES1mANhXwKBgQDFtDPhvkh2M5wRP1f0M1ZwGV0c2dV5d9nd\nVqbZeBxbLMS6Oi1CamW8WWV08Vzq34CLbNIq/7fs+Hn1m1W+VcR0q+gzZqYoxosr\nHPX9iOfpAs82ndvSsAPHjPNgAQqjPnaSRR2+SywmhY0sxsrQVs5LYqWyk2EWZHgZ\nQtCoDgrT9wKBgDjbNbhAfQlyWbKBQ1S9Uannot2F5zIJYchc0mfQoOePIcfHiHGi\nk/3/3stKmeCoDMStaCxdM8WiBmn1pQ6LV6i2VLx8eKgh9uV6tsqqVmV3XIQCYlh+\nIivEC62rjCZiqksotUCcjJaPAfXFjxl5SGHx5aIFkYzSpEuyyT3gzrXbAoGBALuj\n6a3yxKFzIEf6X8cFRp/EYux0DzlnOB7sFBXI+tjKJ7k8aCJmC0L1cebJAdBl6oHp\n+ZsX83/04QPrtzib/IZjdlH6te9zaTi1Fv/YBYvQv8xtjOptZljp/T98HZWMPktb\nT/yBKlkxXilGT83m5YsFCJDxci8nkhkfohwun7ZHAoGAAmAJxhnZ5HxeVS18dhT4\nHX3q7n/+qBSCCES6b9IT5SezXhmYeltdwyNZB/lfqTSgKGaXRLyd/K8cKEPzT9jk\nQWCqae310vNOjGigjB889ALvm0kR9v2xE/isT3wkKsp+/zeQK4DdyvpT4MGJTJ9i\nAmHS2Qnv2PqnwC0g0ICndCQ=\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-fbsvc@smart-icpl.iam.gserviceaccount.com',
    client_id: '117710578588209225312',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40smart-icpl.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com',
};

/**
 * Initializes and returns the Firebase Messaging instance.
 * Uses hardcoded service account credentials for smart-icpl.
 */
export const getFirebaseMessaging = (): Messaging | null => {
    if (messagingInstance) return messagingInstance;

    try {
        if (getApps().length > 0) {
            firebaseApp = getApps()[0];
        } else {
            firebaseApp = initializeApp({
                credential: cert(FIREBASE_SERVICE_ACCOUNT as any),
            });
            console.log(`[Firebase] Initialized with credentials for project: ${FIREBASE_SERVICE_ACCOUNT.project_id}`);
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
