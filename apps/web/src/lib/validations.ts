import { z } from 'zod';

export const purchaseSchema = z.object({
  retailer_id: z.string().min(1, 'Retailer ID is required'),
  cart_total: z.number().positive('Cart total must be positive'),
  payment_method_id: z.string().min(1).optional(),
});

export const savePaymentMethodSchema = z.object({
  token: z.string().min(1, 'Payment token is required'),
});

export const paymentMethodIdSchema = z.object({
  id: z.string().min(1, 'Payment method ID is required'),
});
