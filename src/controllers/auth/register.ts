import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user_model.js';

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const { full_name, email, phone, password } = req.body;
        
        const existingUser = await UserModel.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or phone already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new UserModel({
            full_name,
            email,
            phone,
            password: hashedPassword
        });

        await newUser.save();

        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            secret,
            { expiresIn: '7d' }
        );

        return res.status(201).json({ message: 'User created successfully', userId: newUser._id, email: newUser.email, full_name: newUser.full_name, token });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
