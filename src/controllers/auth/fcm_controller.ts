import type { Request, Response } from 'express';
import { saveOrUpdateFcmToken, removeFcmToken } from '../../services/fcm_service.js';

export const updateFcmToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const { fcm_token, fcmToken, platform, device_info, deviceInfo } = req.body;
        const targetFcmToken = fcm_token || fcmToken;

        if (!targetFcmToken) {
            return res.status(400).json({ error: 'fcm_token is required' });
        }

        const userId = req.user?.userId || req.body.userId || req.body.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'User ID is required or invalid authentication' });
        }

        const record = await saveOrUpdateFcmToken({
            userId,
            fcmToken: targetFcmToken,
            platform,
            deviceInfo: device_info ?? deviceInfo,
        });

        return res.status(200).json({
            message: 'FCM token registered successfully',
            data: record,
        });
    } catch (error) {
        console.error('Update FCM token error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteFcmToken = async (req: Request, res: Response): Promise<any> => {
    try {
        const { fcm_token, fcmToken } = req.body;
        const targetFcmToken = fcm_token || fcmToken;

        if (!targetFcmToken) {
            return res.status(400).json({ error: 'fcm_token is required' });
        }

        const removed = await removeFcmToken(targetFcmToken);
        return res.status(200).json({
            message: removed ? 'FCM token removed successfully' : 'FCM token not found',
            success: removed,
        });
    } catch (error) {
        console.error('Delete FCM token error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
