import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
    id: number | string;
    title: string;
    price: number;
    thumbnail?: string;
    quantity?: number;
}

export interface IOrder extends Document {
    order_id: string;
    user_id: string;
    address: string;
    product?: IOrderItem;
    products: IOrderItem[];
    total_amount: number;
    status: string;
    created?: Date;
    updated?: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
    id: { type: Schema.Types.Mixed, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, default: '' },
    quantity: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new Schema<IOrder>({
    order_id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    address: { type: String, required: true },
    product: { type: orderItemSchema, default: null },
    products: { type: [orderItemSchema], default: [] },
    total_amount: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' }
});

export const OrderModel = mongoose.model<IOrder>('Order', orderSchema);

export const generateOrderId = async (): Promise<string> => {
    const count = await OrderModel.countDocuments();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sequenceNum = count + 1;
    let orderId = '';
    let isUnique = false;

    while (!isUnique) {
        const paddedSeq = String(sequenceNum).padStart(3, '0');
        let randomSuffix = '';
        for (let i = 0; i < 2; i++) {
            randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        orderId = `ICPL-${paddedSeq}-${randomSuffix}`;
        const existing = await OrderModel.findOne({ order_id: orderId });
        if (!existing) {
            isUnique = true;
        } else {
            sequenceNum++;
        }
    }
    return orderId;
};
