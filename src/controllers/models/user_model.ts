import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    is_recruiter: boolean;
    created?: Date;
    updated?: Date;
}

const userSchema = new Schema<IUser>({
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_recruiter: { type: Boolean, default: false }
}, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' }
});

export const UserModel = mongoose.model<IUser>('User', userSchema);
