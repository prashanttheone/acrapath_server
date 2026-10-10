import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
    name: string;
    aliases: string[];
    type: string;
    state: string;
    countryCode: string;
}

const locationSchema = new Schema<ILocation>({
    name: { type: String, required: true },
    aliases: { type: [String], default: [] },
    type: { type: String },
    state: { type: String },
    countryCode: { type: String }
});

// We can specify a text index here as a fallback, 
// though Atlas Search creates indexes differently (via Atlas UI/API)
// locationSchema.index({ name: 'text', aliases: 'text' });

export const LocationModel = mongoose.model<ILocation>('Location', locationSchema);
