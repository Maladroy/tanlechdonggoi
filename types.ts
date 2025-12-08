export interface Combo {
  id: string;
  name: string;
  description: string;
  items: string[];
  originalPrice: number;
  price: number;
  imageUrl: string;
  tags: string[];
  link: string;       // External link to buy
  coupon?: string;    // Specific coupon code for this item
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

export enum AppView {
  LANDING = 'LANDING',
  SHOP = 'SHOP',
  COUPON_LIST = 'COUPON_LIST'
}