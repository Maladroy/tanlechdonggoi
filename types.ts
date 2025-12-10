export type ComboStatus = "available" | "out_of_stock" | "hidden";

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
	link?: string; // Optional now as we use cart
	coupon?: string; // Specific coupon code for this item
	status?: ComboStatus
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
}

export interface CartItem extends Combo {
	quantity: number;
}

export interface UserProfile {
	name: string;
	phone: string;
	emailOrPhone: string; // Used as username (Legacy, usually same as phone)
	email?: string; // Optional email for recovery/login
	isAdmin?: boolean;
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
