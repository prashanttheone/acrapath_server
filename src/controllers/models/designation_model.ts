import mongoose, { Schema, Document } from 'mongoose';

export interface IDesignation extends Document {
    name: string;
    aliases: string[];
    category: string;
    isActive: boolean;
}

const designationSchema = new Schema<IDesignation>({
    name: { type: String, required: true },
    aliases: { type: [String], default: [] },
    category: { type: String },
    isActive: { type: Boolean, default: true }
});

export const DesignationModel = mongoose.model<IDesignation>('Designation', designationSchema);
