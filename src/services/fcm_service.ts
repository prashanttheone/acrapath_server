import { FCMTokenModel, type IFCMToken } from '../models/fcm_token_model.js';
import type { Types } from 'mongoose';

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
