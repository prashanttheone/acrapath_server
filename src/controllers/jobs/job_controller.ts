import type { Request, Response } from 'express';
import { JobPostModel } from '../../models/job_post_model.js';
import { UserModel } from '../../models/user_model.js';
import { updateAutocompleteDictionaries } from '../../services/dictionary_service.js';

// Create a new job post
export const createJobPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const jobData = req.body;

        // Ensure user is authenticated
        if (!req.user || !req.user.userId) {
            res.status(401).json({ error: 'Unauthorized: User missing' });
            return;
        }

        jobData.posted_by = req.user.userId;

        // 1. Validate the user exists
        const userExists = await UserModel.findById(jobData.posted_by);
        if (!userExists) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // 2. Create and save the new job post
        const newJob = new JobPostModel(jobData);
        await newJob.save();

        // 3. Update autocomplete dictionaries in the background (fire-and-forget)
        // We do NOT await this so the API responds instantly to the client.
        updateAutocompleteDictionaries(jobData).catch(err => {
            console.error('Background dictionary update failed:', err);
        });

        // 4. Return success
        res.status(201).json({
            message: 'Job post created successfully',
            job: newJob
        });
    } catch (error) {
        console.error('Error creating job post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all job posts with pagination and filtering
export const getJobs = async (req: Request, res: Response): Promise<void> => {
    try {
        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Filtering
        const query: any = {};

        // 1. Location (case-insensitive regex)
        if (req.query.location) {
            query.location = { $regex: req.query.location, $options: 'i' };
        }

        // 2. Experience (simple handling: exact match or logic can be expanded)
        // Usually, min_experience and max_experience are stored as strings. 
        // For simple filtering, we might do an exact match or use regex if they are strings like "0-2 years".
        if (req.query.experience) {
            query.$or = [
                { min_experience: { $regex: req.query.experience, $options: 'i' } },
                { max_experience: { $regex: req.query.experience, $options: 'i' } }
            ];
        }

        // 3. Salary (simple handling)
        if (req.query.salary) {
            query.$or = [
                { min_salary: { $regex: req.query.salary, $options: 'i' } },
                { max_salary: { $regex: req.query.salary, $options: 'i' } }
            ];
        }

        // 4. Job Type
        if (req.query.job_type) {
            query.job_type = { $in: [req.query.job_type] };
        }

        // 5. Skills
        if (req.query.skills) {
            query.skills = { $in: Array.isArray(req.query.skills) ? req.query.skills : [req.query.skills] };
        }

        // Optional: Function, Industry - Assuming these could map to job_role or company_name
        if (req.query.function) {
            query.job_role = { $regex: req.query.function, $options: 'i' };
        }
        
        // Count total matching jobs
        const totalJobs = await JobPostModel.countDocuments(query);

        // Fetch paginated and filtered jobs
        const jobs = await JobPostModel.find(query)
            .sort({ created: -1 }) // Newest first
            .skip(skip)
            .limit(limit)
            .populate('posted_by', 'full_name email'); // Adjust based on UserModel fields

        res.status(200).json({
            jobs,
            currentPage: page,
            totalPages: Math.ceil(totalJobs / limit),
            totalJobs,
            hasNextPage: skip + jobs.length < totalJobs
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a single job post by ID
export const getJobById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const job = await JobPostModel.findById(id).populate('posted_by', 'full_name email'); // Adjust based on UserModel fields

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        res.status(200).json(job);
    } catch (error) {
        console.error('Error fetching job by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
