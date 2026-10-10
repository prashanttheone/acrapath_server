# Acrapath Database Seeding Guide

This guide explains how the database seeding mechanism works in the Acrapath server. Seeding is used to populate your MongoDB instance with an initial set of data (like job posts, locations, and skills) so that the application is fully functional right away.

## 1. The Seed Script (`seed_jobs.ts`)
The primary script for seeding the database is located in the root of the project: `seed_jobs.ts`.

It reads from a static JSON file (`25_tech_jobs.json`) containing 25 pre-formatted tech job listings. 

### What happens when you run it:
1. **Connection Setup**: It connects to your MongoDB cluster using the `MONGO_URI` environment variable.
2. **Data Formatting**: It iterates through the 25 job entries in the JSON file. It maps their fields into the format required by your Mongoose `JobPostModel` schema.
3. **Dictionary Population (Pre-processing)**: 
   - *Before* inserting the jobs, it scans all 25 jobs for unique **locations**, **skills**, and **designations** (job roles/titles).
   - It performs an `upsert` against the `LocationModel`, `SkillModel`, and `DesignationModel`.
   - This ensures your autocomplete search dictionaries are fully populated *immediately*.
4. **Job Insertion**: 
   - It attempts to insert all 25 jobs into the `JobPostModel` using `insertMany`.
   - It uses `{ ordered: false }` to ensure that if one job fails (e.g., due to a duplicate `_id`), the rest will still process.
   - It gracefully catches MongoDB duplicate key errors (Error code `11000`) and skips the duplicates, ensuring the script won't crash if you run it multiple times.

## 2. How to Run the Seed Script

Since the project uses TypeScript and ES Modules (`"type": "module"`), you should use `tsx` to run the seed script directly from the terminal without needing to compile it to JavaScript first.

From the `acrapath_server` directory, run:

```bash
npx tsx seed_jobs.ts
```

### Expected Output
If successful, you will see output similar to this:

```text
Connecting to MongoDB at mongodb+srv://...
Successfully connected to MongoDB.
Reading jobs from /home/prashant/prashant/acrapath_server/25_tech_jobs.json...
Found 25 jobs to process. Formating data...
Updating autocomplete dictionaries...
Successfully updated dictionaries!
Inserting into database...
Successfully seeded 25 jobs! 
(or "Some or all jobs already exist. Skipping duplicates.")
Disconnected from MongoDB.
```

## 3. Modifying the Seed Data
To add more jobs or change the initial data:
1. Open `25_tech_jobs.json`.
2. Add new JSON objects to the array following the same schema structure.
3. Rerun `npx tsx seed_jobs.ts`. The script will detect the new jobs, add their skills/locations to the dictionaries, and insert the new jobs into the database while skipping the ones that already exist!
