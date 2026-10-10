import { LocationModel } from '../models/location_model.js';
import { SkillModel } from '../models/skill_model.js';
import { DesignationModel } from '../models/designation_model.js';

export const updateAutocompleteDictionaries = async (jobData: any): Promise<void> => {
    try {
        // Update locations
        if (Array.isArray(jobData.location)) {
            for (const loc of jobData.location) {
                if (loc) {
                    await LocationModel.updateOne(
                        { name: loc },
                        { $setOnInsert: { name: loc, isActive: true } },
                        { upsert: true }
                    );
                }
            }
        }

        // Update skills
        if (Array.isArray(jobData.skills)) {
            for (const skill of jobData.skills) {
                if (skill) {
                    await SkillModel.updateOne(
                        { name: skill },
                        { $setOnInsert: { name: skill, isActive: true } },
                        { upsert: true }
                    );
                }
            }
        }

        // Update designations (using job_title or job_role)
        if (jobData.job_title) {
            await DesignationModel.updateOne(
                { name: jobData.job_title },
                { $setOnInsert: { name: jobData.job_title, isActive: true } },
                { upsert: true }
            );
        }
        if (jobData.job_role && jobData.job_role !== jobData.job_title) {
            await DesignationModel.updateOne(
                { name: jobData.job_role },
                { $setOnInsert: { name: jobData.job_role, isActive: true } },
                { upsert: true }
            );
        }
    } catch (error) {
        console.error('Failed to update autocomplete dictionaries in background:', error);
    }
};
