// Retailer types
export interface Retailer {
  id: string;
  name: string;
  domain: string;
  checkout_url_patterns: string[];
  cart_total_selectors: string[];
  gift_card_input_selector: string;
  gift_card_pin_selector: string | null;
  apply_button_selector: string;
  add_another_selector: string | null;
  max_gift_cards_per_order: number | null;
  available_denominations: number[];
  per_user_daily_limit_usd: number;
  stacking_notes: string | null;
  is_active: boolean;
  logo_url: string | null;
}

// Stacking algorithm types
export interface GiftCardOffer {
  denomination: number;
  quantity: number;
  price_per_card: number;
  total_price: number;
  discount_percent: number;
}

export interface StackRecommendation {
  retailer_name: string;
  cart_total: number;
  cards: GiftCardOffer[];
  total_paid: number;
  total_gift_card_value: number;
  savings: number;
  savings_percent: number;
  residual_balance: number;
  remaining_to_pay: number;
  capped: boolean;
  cap_reason: string | null;
}

// Transaction types
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  user_id: string;
  retailer_id: string;
  cards_purchased: CardPurchased[];
  total_paid: number;
  total_value: number;
  savings: number;
  residual_balance: number;
  status: TransactionStatus;
  payment_processor_id: string | null;
  demo: boolean;
  created_at: string;
  // Payment processor fields (Phase 1)
  processor?: PaymentProcessor;
  processor_transaction_id?: string;
  processor_refund_id?: string;
  payment_method_id?: string;
  processor_fee?: number;
  net_amount?: number;
}

export interface CardPurchased {
  denomination: number;
  cost: number;
  code_last4: string;
}

// Stashly balance types
export interface StashlyBalance {
  id: string;
  user_id: string;
  retailer_id: string;
  retailer_name: string;
  balance: number;
}

// Inventory service types (internal, not exposed to clients)
export type CardStatus = 'available' | 'reserved' | 'sold';

export interface InventoryAvailability {
  retailer_name: string;
  denomination: number;
  available: boolean;
  discount_percent: number;
  price: number;
}

// API request/response types
export interface StackRequest {
  retailer_id: string;
  cart_total: number;
}

export interface PurchaseRequest {
  retailer_id: string;
  cart_total: number;
  payment_method_id?: string;
}

export interface PurchaseResponse {
  transaction_id: string;
  codes: DeliveredCode[];
  residual_balance: number;
  total_paid: number;
  total_savings: number;
}

export interface DeliveredCode {
  denomination: number;
  code: string;
  pin: string | null;
}

// User types
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  savings_total: number;
  role: UserRole;
  created_at: string;
  // Payment processor fields (Phase 1)
  payment_processor?: PaymentProcessor;
  processor_customer_id?: string;
}

// Payment types
export type PaymentProcessor = 'stripe' | 'stax';

export interface PaymentMethodInfo {
  id: string;
  last4: string;
  brand: string;
  isDefault: boolean;
}

export interface PaymentConfig {
  publishableKey: string;
  processor: PaymentProcessor;
}
