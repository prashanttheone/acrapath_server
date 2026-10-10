import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
    name: string;
    aliases: string[];
    category: string;
    isActive: boolean;
}

const skillSchema = new Schema<ISkill>({
    name: { type: String, required: true },
    aliases: { type: [String], default: [] },
    category: { type: String },
    isActive: { type: Boolean, default: true }
});

export const SkillModel = mongoose.model<ISkill>('Skill', skillSchema);
