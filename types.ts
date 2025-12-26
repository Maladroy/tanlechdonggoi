export type ComboStatus = "available" | "out_of_stock" | "hidden";

// New variant value structure with price adjustment
export interface VariantValue {
	id: string; // Unique identifier for the value
	label: string; // Display name (e.g., "S", "Red", "Cotton")
	priceChange: number; // Price adjustment (can be positive, negative, or 0)
	order: number; // For drag-and-drop ordering
	imageUrl?: string; // Optional image for this specific value
}

// Updated variant option structure
export interface VariantOption {
	id: string; // Unique identifier
	name: string; // e.g. "Size", "Color"
	values: VariantValue[]; // Array of possible values
	order: number; // For drag-and-drop ordering of variant types
	required: boolean; // Whether user must select this variant
}

// Variant combination availability rules
export interface VariantCombinationRule {
	id: string;
	combination: Record<string, string>; // { "Size": "S", "Color": "Red" }
	isAvailable: boolean; // Whether this combination can be selected
	reason?: string; // Optional reason for unavailability (e.g., "Out of stock")
	customPriceAdjustment?: number; // Optional override for combination-specific pricing
}

export type TupleSort = Date | number | string;
export interface Combo {
	id: string;
	name: string;
	description: string;
	items: string[];
	originalPrice: number;
	price: number;
	imageUrl: string;
	tags: string[];
	category?: string;
	link?: string; // Optional now as we use cart
	coupon?: string; // Specific coupon code for this item
	status?: ComboStatus;
	type?: "combo" | "product"; // Default is 'combo' if undefined
	variants?: VariantOption[];
	variantCombinationRules?: VariantCombinationRule[]; // Rules for combinations
	defaultVariantImage?: string; // Fallback image when no variant selected
	variantImages?: Record<string, string>; // DEPRECATED: Map of variant value to image URL
}

export interface Category {
	id: string;
	name: string;
	description?: string;
}

export interface Coupon {
	id?: string;
	code: string;
	desc: string;
	color: string;
	expiryDate: string; // ISO Date String (YYYY-MM-DD)
	applicableCombos?: string[]; // IDs of combos this coupon applies to
	type?: "fixed" | "percent"; // Type of discount
	value?: number; // Amount (e.g. 50000) or Percent (e.g. 15 for 15%)
	isNewUserOnly?: boolean;
	maxUsesPerUser?: number;
}

export interface CartItem extends Combo {
	quantity: number;
	selectedVariants?: Record<string, string>;
	computedPrice?: number; // Final price after variant adjustments
}

export interface UserProfile {
	name: string;
	phone: string;
	email?: string; // Optional email for recovery
	isAdmin?: boolean;
	dob?: string;
	gender?: "male" | "female" | "other";
	usedCoupons?: string[]; // List of coupon codes used by this user
	ownedCoupons?: string[]; // List of coupon codes granted to this user
}

export interface Order {
	id?: string;
	userId: string; // Firebase Auth UID
	user: UserProfile;
	items: CartItem[];
	total: number;
	createdAt: string;
	status: "pending" | "confirmed" | "cancelled";
	appliedCoupon?: string;
	shippingAddress?: {
		street: string;
		city: string;
		zipCode: string;
	};
}

export enum AppView {
	AUTH = "AUTH",
	SHOP = "SHOP",
	COUPON_LIST = "COUPON_LIST",
	ADMIN = "ADMIN",
}

export interface Promo {
	id: string;
	title: string;
	message: string;
	couponCode: string;
	discountValue?: string; // e.g. "10%" or "50k"
	expiryDate: string;
	isActive: boolean;
}

export interface SystemSettings {
	newUserCouponCode?: string;
}
