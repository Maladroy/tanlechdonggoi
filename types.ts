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
}

export interface Coupon {
	id?: string;
	code: string;
	desc: string;
	color: string;
	expiryDate: string; // ISO Date String (YYYY-MM-DD)
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
}

export enum AppView {
	AUTH = "AUTH",
	SHOP = "SHOP",
	COUPON_LIST = "COUPON_LIST",
	ADMIN = "ADMIN",
}
