import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobPost extends Document {
    posted_by: Types.ObjectId; // References the User who posted this
    company_name: string;
    job_title: string;
    job_role: string;
    job_type: string[];
    location: string;
    work_mode: string[];
    min_salary: string;
    max_salary: string;
    is_not_disclose: boolean;
    is_night_shift: boolean;
    perks: string[];
    qualification: string;
    min_experience: string;
    max_experience: string;
    skills: string[];
    job_description: string;
    created?: Date;
    updated?: Date;
}

const jobPostSchema = new Schema<IJobPost>({
    posted_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Step 1 Data
    company_name: { type: String, required: true },
    job_title: { type: String, required: true },
    job_role: { type: String, required: true },
    job_type: { type: [String], default: [] },
    location: { type: String, default: '' },
    work_mode: { type: [String], default: [] },
    min_salary: { type: String, default: '' },
    max_salary: { type: String, default: '' },
    is_not_disclose: { type: Boolean, default: false },
    is_night_shift: { type: Boolean, default: false },
    perks: { type: [String], default: [] },
    
    // Step 2 Data
    qualification: { type: String, required: true },
    min_experience: { type: String, default: '' },
    max_experience: { type: String, default: '' },
    skills: { type: [String], default: [] },
    
    // Step 3 Data
    job_description: { type: String, default: '' }
}, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' }
});

export const JobPostModel = mongoose.model<IJobPost>('JobPost', jobPostSchema);
