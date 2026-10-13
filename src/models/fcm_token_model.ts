import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFCMToken extends Document {
    user_id: Types.ObjectId;
    fcm_token: string;
    platform: string;
    device_info: Record<string, any>;
    last_used: Date;
    created?: Date;
    updated?: Date;
}

const fcmTokenSchema = new Schema<IFCMToken>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fcm_token: { type: String, required: true, unique: true, index: true, trim: true },
    platform: { type: String, default: 'android', lowercase: true, trim: true },
    device_info: { type: Schema.Types.Mixed, default: {} },
    last_used: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' }
});

export const FCMTokenModel = mongoose.model<IFCMToken>('FCMToken', fcmTokenSchema);
export const FcmTokenModel = FCMTokenModel;
