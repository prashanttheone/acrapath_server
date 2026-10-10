import type { Request, Response } from 'express';
import { LocationModel } from '../../models/location_model.js';
import { SkillModel } from '../../models/skill_model.js';
import { DesignationModel } from '../../models/designation_model.js';

// Reusable function to perform standard MongoDB regex search (no Atlas index required)
async function getSuggestions(model: any, query: string, paths: string[] = ['name', 'aliases']) {
    if (!query) return [];

    const regex = new RegExp(query, 'i');
    const orClauses = paths.map(path => ({ [path]: regex }));

    return model.find({ $or: orClauses }).limit(10).lean();
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

export const suggestKeywords = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = req.query.q as string || '';
        
        // Fetch from both collections concurrently
        const [skills, designations] = await Promise.all([
            getSuggestions(SkillModel, q),
            getSuggestions(DesignationModel, q)
        ]);
        
        // Combine, sort by search score descending, and limit to top 10
        const combined = [...skills, ...designations]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 10);
            
        res.status(200).json({ data: combined });
    } catch (error) {
        console.error('Error suggesting keywords:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
};
