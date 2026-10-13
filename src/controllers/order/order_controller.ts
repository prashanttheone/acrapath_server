import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrderModel, generateOrderId, type IOrderItem } from '../../models/order_model.js';

/**
 * Helper to extract and normalize product items from the request body.
 * Supports:
 * 1. Array of products: { products: [{ id, title, price, thumbnail, quantity }] }
 * 2. Single product object: { product: { id, title, price, thumbnail, quantity } }
 * 3. Flat product fields: { id, title, price, thumbnail, quantity }
 */
const parseOrderItems = (body: any): IOrderItem[] => {
    if (Array.isArray(body.products) && body.products.length > 0) {
        return body.products.map((p: any) => ({
            id: p.id ?? p.product_id,
            title: p.title || '',
            price: Number(p.price) || 0,
            thumbnail: p.thumbnail || '',
            quantity: Number(p.quantity) || 1
        }));
    }

    if (body.product && typeof body.product === 'object') {
        const p = body.product;
        return [{
            id: p.id ?? p.product_id,
            title: p.title || '',
            price: Number(p.price) || 0,
            thumbnail: p.thumbnail || '',
            quantity: Number(p.quantity) || 1
        }];
    }

    if (body.id !== undefined || body.product_id !== undefined || body.title) {
        return [{
            id: body.id ?? body.product_id,
            title: body.title || '',
            price: Number(body.price) || 0,
            thumbnail: body.thumbnail || '',
            quantity: Number(body.quantity) || 1
        }];
    }

    return [];
};

/**
 * POST /api/orders
 * Create a new order with generated order_id (e.g. ICPL-001-XX).
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.body.user_id || req.body.userId || req.user?.userId;
        const address = req.body.address || req.body.adress;
        const items = parseOrderItems(req.body);

        if (!userId) {
            res.status(400).json({ error: 'user_id is required' });
            return;
        }

        if (!address || typeof address !== 'string' || address.trim() === '') {
            res.status(400).json({ error: 'address is required as text' });
            return;
        }

        if (items.length === 0) {
            res.status(400).json({
                error: 'Product details are required (id, title, price, thumbnail)'
            });
            return;
        }

        // Calculate total amount
        const calculatedTotal = items.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
        const totalAmount = req.body.total_amount !== undefined
            ? Number(req.body.total_amount)
            : Number(calculatedTotal.toFixed(2));

        const orderId = await generateOrderId();

        const newOrder = new OrderModel({
            order_id: orderId,
            user_id: String(userId),
            address: address.trim(),
            product: items[0],
            products: items,
            total_amount: totalAmount,
            status: req.body.status || 'pending'
        });

        await newOrder.save();

        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error while creating order' });
    }
};

/**
 * GET /api/orders
 * Retrieve orders with pagination and optional filtering by user_id or status.
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const skip = (page - 1) * limit;

        const filter: any = {};
        const userId = req.query.user_id || req.query.userId;
        if (userId) {
            filter.user_id = String(userId);
        }

        if (req.query.status) {
            filter.status = String(req.query.status);
        }

        const totalOrders = await OrderModel.countDocuments(filter);
        const orders = await OrderModel.find(filter)
            .sort({ created: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit) || 1,
            totalOrders,
            hasNextPage: skip + orders.length < totalOrders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error while fetching orders' });
    }
};

/**
 * GET /api/orders/:id
 * Retrieve a single order by order_id (e.g. ICPL-001-XX) or MongoDB _id.
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ error: 'Invalid order identifier provided' });
            return;
        }

        const queryConditions: any[] = [{ order_id: id }];
        if (mongoose.Types.ObjectId.isValid(id)) {
            queryConditions.push({ _id: id });
        }

        const order = await OrderModel.findOne({ $or: queryConditions });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.status(200).json({ order });
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ error: 'Internal server error while fetching order' });
    }
};

/**
 * GET /api/orders/user/:userId
 * Retrieve all orders belonging to a specific user.
 */
export const getOrdersByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const orders = await OrderModel.find({ user_id: String(userId) }).sort({ created: -1 });

        res.status(200).json({
            userId,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Internal server error while fetching user orders' });
    }
};
