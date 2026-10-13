import { Router } from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    getOrdersByUserId
} from '../controllers/order/order_controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Protect all order routes with requireAuth
router.use(requireAuth);

// Order routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/user/:userId', getOrdersByUserId);
router.get('/:id', getOrderById);

export default router;
