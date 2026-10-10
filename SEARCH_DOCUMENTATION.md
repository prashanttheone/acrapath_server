# Acrapath Search & Dictionary Architecture

This document explains how the job search, autocomplete dictionaries, and data seeding work in the Acrapath server. 

## 1. The Autocomplete Dictionaries
To power the fast autocomplete search bar on the frontend without doing expensive table scans of every single job posting, the backend maintains three specialized "dictionary" collections:
- `LocationModel` (cities, states)
- `SkillModel` (tech stacks, languages)
- `DesignationModel` (job roles, titles)

These dictionaries are the single source of truth for the `/api/keywords/suggest` and `/api/locations/suggest` autocomplete endpoints.

## 2. Job Insertion (Auto-Populating Dictionaries)
When a recruiter creates a new job post via `POST /api/jobs`, the system automatically learns from the data:
1. The new job is saved to the `JobPostModel`.
2. A fire-and-forget background process (`src/services/dictionary_service.ts`) is triggered.
3. It parses all `skills`, `location`, `job_title`, and `job_role` fields from the new job.
4. It performs a MongoDB `upsert` (Update or Insert) against the dictionary collections. If the skill/location/designation is new, it gets added. If it already exists, it is ignored. 
5. Because this happens asynchronously, it does not slow down the API response for the recruiter.

## 3. Data Seeding (`seed_jobs.ts`)
To backfill the database with existing data (e.g., from `25_tech_jobs.json`):
- Run `npx tsx seed_jobs.ts`
- The script parses all JSON records and extracts every unique location, skill, and designation, upserting them into the dictionary collections.
- It then inserts the job postings into the `JobPostModel`.
- It gracefully handles duplicate `_id` keys, making it safe to run multiple times without crashing if the data is already there.

## 4. Searching for Jobs (`GET /api/jobs`)
The main search endpoint handles dynamic, multi-parameter searches with a smart fallback mechanism:

### Dynamic Parsing
- **Multi-Skill**: A user can query `?skills=HTML,React` or `?skills=HTML&skills=React`. The backend dynamically parses this into an array and performs a case-insensitive `$in` search.
- **Multi-Location**: A user can query `?location=Bengaluru&location=Delhi`. This is also parsed into an array for an `$in` search.
- **Multi-JobType**: Handled exactly the same way.

### Smart "AND/OR" Fallback Logic
By default, when a user searches for multiple categories (e.g., `location=Bengaluru` AND `skills=React`), MongoDB runs a strict **AND** search. It only returns jobs that perfectly match both conditions.

However, if that strict search returns `0` results, the backend doesn't just show an empty page. Instead, it triggers a **Fallback Search**:
1. It deletes the strict `AND` constraints for location, skills, and roles.
2. It wraps those constraints into a broad **OR** query.
3. It reruns the search, effectively asking MongoDB: *"Give me jobs that are EITHER in Bengaluru OR require React."*
4. It returns these broader results to the user, ensuring they always see relevant job listings.

## 5. Autocomplete Endpoint (`GET /api/keywords/suggest` & `/locations/suggest`)
- Instead of making multiple API calls for skills and designations separately, they are merged into one.
- `GET /api/keywords/suggest?q=React` queries both the `SkillModel` and `DesignationModel` **concurrently** using `Promise.all`.
- It merges the results from both collections, sorts them by their MongoDB Atlas `$search` relevance score in descending order, trims the list to the top 10 results, and returns them to the frontend.
