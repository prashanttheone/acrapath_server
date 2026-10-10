# Job Post Schema & Data Flow

To store the job post data from the React Native app into your MongoDB backend, you should create a new schema. Since this data represents a job listing created by a user (likely an employer/recruiter), a great name for this model would be **`JobPostModel`** (or just **`Job`**).

## 1. Suggested MongoDB Schema (`job_post_model.ts`)

Create a new file in your backend at `src/controllers/models/job_post_model.ts`. 

Notice the `posted_by` field. This uses `Schema.Types.ObjectId` and `ref: 'User'` to create a relational link back to the specific user from your `UserModel` who created this job.

```typescript
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
```

## 2. Sending Data from React Native

In your React Native `PostJob.tsx`, when the user reaches Step 3 and clicks "Post Job", you will make a POST request to your backend. 

You need to pass the `userId` (which you likely have stored in your app after the user logs in) along with the Redux `formData`.

```typescript
// Inside PostJob.tsx (React Native)

import axios from 'axios';

const handleNext = async () => {
    // ... validation logic for step 1 and 2 ...

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('--- Submitting Job Post ---');
      
      try {
        // Assume you get the logged-in user's ID from an auth context/redux store
        const userId = "64f1a2b3c4d5e6f7a8b9c0d1"; 
        
        const payload = {
          posted_by: userId,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_role: formData.jobRole,
          job_type: formData.jobType,
          location: formData.location,
          work_mode: formData.workMode,
          min_salary: formData.minSalary,
          max_salary: formData.maxSalary,
          is_not_disclose: formData.isNotDisclose,
          is_night_shift: formData.isNightShift,
          perks: formData.perks,
          qualification: formData.qualification,
          min_experience: formData.minExperience,
          max_experience: formData.maxExperience,
          skills: formData.skills,
          job_description: formData.jobDescription,
        };

        // Call your backend API
        const response = await axios.post('http://your-backend-api.com/api/jobs', payload);
        
        ToastAndroid.show('Job Posted Successfully!', ToastAndroid.LONG);
        navigation.goBack();
      } catch (error) {
        Alert.alert('Error', 'Failed to post job');
      }
    }
};
```

## 3. Handling the Request on the Backend (Node.js/Express)

Finally, in your backend controller, you will receive this payload and save it to the database. Because `posted_by` references `User`, you can easily fetch the job along with the user's `full_name` or `email` later!

```typescript
// Inside src/controllers/jobs/create_job.ts (Backend)

import { Request, Response } from 'express';
import { JobPostModel } from '../models/job_post_model';
import { UserModel } from '../models/user_model';

export const createJobPost = async (req: Request, res: Response) => {
    try {
        const jobData = req.body;

        // 1. Validate the user exists
        const userExists = await UserModel.findById(jobData.posted_by);
        if (!userExists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Create and save the new job post
        const newJob = new JobPostModel(jobData);
        await newJob.save();

        // 3. Return success
        return res.status(201).json({
            message: 'Job post created successfully',
            job: newJob
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
```

### Why this is scalable:
By separating the `JobPostModel` from the `UserModel` and using an `ObjectId` reference (`ref: 'User'`), your database remains normalized. This means a single User can post hundreds of jobs without bloating the User document, and you can always `.populate('posted_by')` in mongoose to get the employer's details when showing the job to candidates.
