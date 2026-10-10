import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { JobPostModel } from './src/models/job_post_model.js';
import { LocationModel } from './src/models/location_model.js';
import { SkillModel } from './src/models/skill_model.js';
import { DesignationModel } from './src/models/designation_model.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/acrapath';

async function seedJobs() {
    try {
        console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);
        console.log('Successfully connected to MongoDB.');

        const filePath = path.join(process.cwd(), '25_tech_jobs.json');
        console.log(`Reading jobs from ${filePath}...`);
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        // Handle both { jobs: [...] } and [...] formats
        const jobs = jsonData.jobs || jsonData; 
        
        console.log(`Found ${jobs.length} jobs to process. Formating data...`);
        
        const processedJobs = jobs.map((job: any) => {
            const newJob = { ...job };
            // Convert nested posted_by string to ObjectId reference
            if (newJob.posted_by && newJob.posted_by._id) {
                newJob.posted_by = new mongoose.Types.ObjectId(newJob.posted_by._id);
            }
            
            // Convert _id to ObjectId
            if (newJob._id) {
                 newJob._id = new mongoose.Types.ObjectId(newJob._id);
            }
            return newJob;
        });

        console.log('Updating autocomplete dictionaries...');
        for (const job of processedJobs) {
            if (Array.isArray(job.location)) {
                for (const loc of job.location) {
                    if (loc) {
                        await LocationModel.updateOne(
                            { name: loc },
                            { $setOnInsert: { name: loc } },
                            { upsert: true }
                        );
                    }
                }
            }
            if (Array.isArray(job.skills)) {
                for (const skill of job.skills) {
                    if (skill) {
                        await SkillModel.updateOne(
                            { name: skill },
                            { $setOnInsert: { name: skill, isActive: true } },
                            { upsert: true }
                        );
                    }
                }
            }
            if (job.job_title) {
                await DesignationModel.updateOne(
                    { name: job.job_title },
                    { $setOnInsert: { name: job.job_title, isActive: true } },
                    { upsert: true }
                );
            }
            if (job.job_role && job.job_role !== job.job_title) {
                await DesignationModel.updateOne(
                    { name: job.job_role },
                    { $setOnInsert: { name: job.job_role, isActive: true } },
                    { upsert: true }
                );
            }
        }
        console.log('Successfully updated dictionaries!');

        console.log('Inserting into database...');
        try {
            // Insert jobs into MongoDB
            const result = await JobPostModel.insertMany(processedJobs, { ordered: false });
            console.log(`Successfully seeded ${result.length} jobs!`);
        } catch (insertError: any) {
            if (insertError.code === 11000) {
                console.log('Some or all jobs already exist. Skipping duplicates.');
            } else {
                throw insertError;
            }
        }

    } catch (error) {
        console.error('Error seeding jobs:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seedJobs();
