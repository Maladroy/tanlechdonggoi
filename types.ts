export type ComboStatus = "available" | "out_of_stock" | "hidden";

// ===== NEW: Enhanced Variant System =====

/**
 * Represents a single value within a variant option.
 * e.g., "S", "M", "L" for Size variant or "Red", "Blue" for Color variant.
 */
export interface VariantValue {
	id: string; // Unique identifier for the value
	label: string; // Display name (e.g., "S", "Red", "Cotton")
	priceChange: number; // Price adjustment (can be positive, negative, or 0)
	order: number; // For drag-and-drop ordering
	imageUrl?: string; // Optional image for this specific value
}

/**
 * Represents a variant option (dimension) like Size, Color, Material.
 */
export interface VariantOption {
	id: string; // Unique identifier
	name: string; // e.g., "Size", "Color", "Material"
	values: VariantValue[]; // Array of possible values
	order: number; // For drag-and-drop ordering of variant types
	required: boolean; // Whether user must select this variant
}

/**
 * Rules for managing availability of specific variant combinations.
 * Allows disabling certain combinations (e.g., "Red + XL" out of stock).
 */
export interface VariantCombinationRule {
	id: string;
	combination: Record<string, string>; // { "Size": "valueId", "Color": "valueId" }
	isAvailable: boolean; // Whether this combination can be selected
	reason?: string; // Optional reason for unavailability (e.g., "Out of stock")
	customPriceAdjustment?: number; // Optional override for combination-specific pricing
}

// Legacy variant option structure for migration compatibility
export interface LegacyVariantOption {
	name: string; // e.g. "Size", "Color"
	values: string[]; // e.g. ["S", "M", "L"]
}

// ===== END Enhanced Variant System =====

export type TupleSort = Date | number | string;

export interface Combo {
	id: string;
	name: string;
	description: string;
	items: string[];
	originalPrice: number;
	price: number; // Base price
	imageUrl: string;
	tags: string[];
	category?: string;
	link?: string; // Optional now as we use cart
	coupon?: string; // Specific coupon code for this item
	status?: ComboStatus;
	type?: "combo" | "product"; // Default is 'combo' if undefined

	// NEW: Enhanced variant system
	variants?: VariantOption[]; // Ordered array of variant options
	variantCombinationRules?: VariantCombinationRule[]; // Rules for combinations
	defaultVariantImage?: string; // Fallback image when no variant selected

	// DEPRECATED: Will be removed after migration
	// Use VariantValue.imageUrl instead
	variantImages?: Record<string, string>; // Map of variant value to image URL
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
	selectedVariants?: Record<string, string>; // { "Size": "valueId", "Color": "valueId" }
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
