import type { Request, Response } from 'express';
import { LocationModel } from './models/location_model.js';
import { SkillModel } from './models/skill_model.js';
import { DesignationModel } from './models/designation_model.js';

// Reusable function to perform Atlas Search autocomplete aggregation
async function getSuggestions(model: any, query: string, paths: string[] = ['name', 'aliases']) {
    if (!query) return [];

    // The autocomplete operator in Atlas Search. 
    // You need an index created in Atlas (usually named 'default' or a custom name).
    // The fields 'name' and 'aliases' should be indexed with the 'autocomplete' data type.
    
    // We use a compound query to search across multiple fields (e.g. name and aliases)
    const shouldClauses = paths.map(path => ({
        autocomplete: {
            query,
            path,
            fuzzy: {
                maxEdits: 1,
                prefixLength: 1
            }
        }
    }));

    return model.aggregate([
        {
            $search: {
                // If your index is named something specific, add `index: 'index_name',`
                compound: {
                    should: shouldClauses,
                    minimumShouldMatch: 1
                }
            }
        },
        {
            $limit: 10
        },
        {
            $project: {
                _id: 1,
                name: 1,
                aliases: 1,
                category: 1,
                type: 1,
                state: 1,
                countryCode: 1,
                score: { $meta: 'searchScore' }
            }
        }
    ]);
}

export const suggestLocations = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = req.query.q as string || '';
        const results = await getSuggestions(LocationModel, q);
        res.status(200).json({ data: results });
    } catch (error) {
        console.error('Error suggesting locations:', error);
        res.status(500).json({ error: 'Failed to fetch location suggestions' });
    }
};

export const suggestSkills = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = req.query.q as string || '';
        const results = await getSuggestions(SkillModel, q);
        res.status(200).json({ data: results });
    } catch (error) {
        console.error('Error suggesting skills:', error);
        res.status(500).json({ error: 'Failed to fetch skill suggestions' });
    }
};

export const suggestDesignations = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = req.query.q as string || '';
        const results = await getSuggestions(DesignationModel, q);
        res.status(200).json({ data: results });
    } catch (error) {
        console.error('Error suggesting designations:', error);
        res.status(500).json({ error: 'Failed to fetch designation suggestions' });
    }
};
