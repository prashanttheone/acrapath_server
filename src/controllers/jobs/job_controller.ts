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

        // 1. Location (multi-location support via array or single string)
        if (req.query.location) {
            const locations = Array.isArray(req.query.location) 
                ? req.query.location 
                : [req.query.location];
            query.location = { $in: locations.map(loc => new RegExp(String(loc).trim(), 'i')) };
        }

        // 2. Experience (simple handling)
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

        // 4. Job Type (multi-type support)
        if (req.query.job_type) {
            const types = Array.isArray(req.query.job_type) 
                ? req.query.job_type 
                : [req.query.job_type];
            query.job_type = { $in: types.map(t => new RegExp(String(t).trim(), 'i')) };
        }

        // 5. Skills (multi-skill support via array or comma-separated string)
        if (req.query.skills) {
            let skillsArray: string[] = [];
            if (Array.isArray(req.query.skills)) {
                skillsArray = req.query.skills.map(String);
            } else if (typeof req.query.skills === 'string') {
                skillsArray = req.query.skills.split(',');
            }
            query.skills = { $in: skillsArray.map(s => new RegExp(s.trim(), 'i')) };
        }

        // Optional: Function, Industry - Assuming these could map to job_role or company_name
        if (req.query.function) {
            query.job_role = { $regex: req.query.function, $options: 'i' };
        }
        
        let activeQuery = { ...query };
        // Count total matching jobs
        let totalJobs = await JobPostModel.countDocuments(activeQuery);

        // Fallback Logic: If 0 jobs found, loosen the search to an OR condition
        // e.g., if a user searches for HTML skills IN Bengaluru and gets 0, 
        // fallback to showing jobs that either need HTML OR are in Bengaluru.
        if (totalJobs === 0) {
            const looseConditions = [];
            
            // Only extract these constraints if we intend to loosen them
            if (activeQuery.location) looseConditions.push({ location: activeQuery.location });
            if (activeQuery.skills) looseConditions.push({ skills: activeQuery.skills });
            if (activeQuery.job_role) looseConditions.push({ job_role: activeQuery.job_role });

            // Only attempt fallback if there are multiple constraints to loosen
            if (looseConditions.length > 1) {
                const fallbackQuery = { ...activeQuery };
                // Remove the strict AND constraints from fallbackQuery
                delete fallbackQuery.location;
                delete fallbackQuery.skills;
                delete fallbackQuery.job_role;

                fallbackQuery.$and = [{ $or: looseConditions }];
                
                const looseTotalJobs = await JobPostModel.countDocuments(fallbackQuery);
                if (looseTotalJobs > 0) {
                    activeQuery = fallbackQuery;
                    totalJobs = looseTotalJobs;
                }
            }
        }

        // Fetch paginated and filtered jobs
        const jobs = await JobPostModel.find(activeQuery)
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
