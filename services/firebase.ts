import { initializeUI } from "@firebase-oss/ui-core";
import { getAnalytics } from "firebase/analytics";
import { type FirebaseOptions, initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import {
	addDoc,
	arrayUnion,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	limit,
	onSnapshot,
	orderBy,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import type {
	Category,
	Combo,
	Coupon,
	Order,
	Promo,
	SystemSettings,
	UserProfile,
} from "../types";

// Firebase configuration from Vite environment variables
const firebaseConfig: FirebaseOptions = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (production-ready: no mock fallbacks)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

auth.languageCode = "vi"; // Set auth UI language to Vietnamese

const ui = initializeUI({
	app,
	auth,
});
const db = getFirestore(app);

// Optional analytics (only in browser and when measurementId is provided)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
	analytics = getAnalytics(app);
}

// --- Public API ---

export const getCombos = async (): Promise<Combo[]> => {
	const querySnapshot = await getDocs(collection(db, "combos"));
	return querySnapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...(docSnap.data() as Omit<Combo, "id">),
	}));
};

export const getCoupons = async (): Promise<Coupon[]> => {
	const querySnapshot = await getDocs(collection(db, "coupons"));
	return querySnapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...(docSnap.data() as Omit<Coupon, "id">),
	}));
};

export const getActivePromo = async (): Promise<Promo | null> => {
	try {
		const q = query(
			collection(db, "promos"),
			where("isActive", "==", true),
			limit(1),
		);
		const querySnapshot = await getDocs(q);
		if (!querySnapshot.empty) {
			const docSnap = querySnapshot.docs[0];
			return { id: docSnap.id, ...docSnap.data() } as Promo;
		}
		return null;
	} catch (e) {
		console.error("Error fetching promo:", e);
		return null;
	}
};

export const createOrder = async (order: Order): Promise<boolean> => {
	try {
		await addDoc(collection(db, "orders"), order);

		// If order has a coupon, mark it as used for the user
		if (order.appliedCoupon && order.userId) {
			const userRef = doc(db, "users", order.userId);
			await updateDoc(userRef, {
				usedCoupons: arrayUnion(order.appliedCoupon),
			});
		}

		return true;
	} catch (e) {
		console.error("Error creating order:", e);
		return false;
	}
};

export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
	try {
		const q = query(
			collection(db, "orders"),
			where("userId", "==", userId),
			orderBy("createdAt", "desc"),
		);
		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnap) => ({
			id: docSnap.id,
			...(docSnap.data() as Omit<Order, "id">),
		}));
	} catch (e) {
		console.error("Error fetching user orders:", e);
		return [];
	}
};

// --- Admin API ---

export const getOrders = async (): Promise<Order[]> => {
	try {
		const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnap) => ({
			id: docSnap.id,
			...(docSnap.data() as Omit<Order, "id">),
		}));
	} catch (e) {
		console.error("Error fetching orders:", e);
		return [];
	}
};

export const getUsers = async (): Promise<UserProfile[]> => {
	try {
		const querySnapshot = await getDocs(collection(db, "users"));
		return querySnapshot.docs.map((doc) => doc.data() as UserProfile);
	} catch (e) {
		console.error("Error fetching users:", e);
		return [];
	}
};

export const updateOrderStatus = async (
	orderId: string,
	status: "pending" | "confirmed" | "cancelled",
): Promise<boolean> => {
	try {
		const orderRef = doc(db, "orders", orderId);
		await updateDoc(orderRef, { status });
		return true;
	} catch (e) {
		console.error("Error updating order:", e);
		return false;
	}
};

export const addCombo = async (combo: Omit<Combo, "id">): Promise<boolean> => {
	try {
		await addDoc(collection(db, "combos"), combo);
		return true;
	} catch (e) {
		console.error("Error adding combo:", e);
		return false;
	}
};

export const deleteCombo = async (comboId: string): Promise<boolean> => {
	try {
		await deleteDoc(doc(db, "combos", comboId));
		return true;
	} catch (e) {
		console.error("Error deleting combo:", e);
		return false;
	}
};

export const addCoupon = async (
	coupon: Omit<Coupon, "id">,
): Promise<boolean> => {
	try {
		await addDoc(collection(db, "coupons"), coupon);
		return true;
	} catch (e) {
		console.error("Error adding coupon:", e);
		return false;
	}
};

export const deleteCoupon = async (couponId: string): Promise<boolean> => {
	try {
		await deleteDoc(doc(db, "coupons", couponId));
		return true;
	} catch (e) {
		console.error("Error deleting coupon:", e);
		return false;
	}
};

export const updateCombo = async (
	id: string,
	data: Partial<Combo>,
): Promise<boolean> => {
	try {
		const ref = doc(db, "combos", id);
		await updateDoc(ref, data);
		return true;
	} catch (e) {
		console.error("Error updating combo:", e);
		return false;
	}
};

export const updateCoupon = async (
	id: string,
	data: Partial<Coupon>,
): Promise<boolean> => {
	try {
		const ref = doc(db, "coupons", id);
		await updateDoc(ref, data);
		return true;
	} catch (e) {
		console.error("Error updating coupon:", e);
		return false;
	}
};

// --- Categories API ---

export const getCategories = async (): Promise<Category[]> => {
	try {
		const querySnapshot = await getDocs(collection(db, "categories"));
		return querySnapshot.docs.map((docSnap) => ({
			id: docSnap.id,
			...(docSnap.data() as Omit<Category, "id">),
		}));
	} catch (e) {
		console.error("Error fetching categories:", e);
		return [];
	}
};

export const addCategory = async (
	category: Omit<Category, "id">,
): Promise<boolean> => {
	try {
		await addDoc(collection(db, "categories"), category);
		return true;
	} catch (e) {
		console.error("Error adding category:", e);
		return false;
	}
};

export const updateCategory = async (
	id: string,
	data: Partial<Category>,
): Promise<boolean> => {
	try {
		const ref = doc(db, "categories", id);
		await updateDoc(ref, data);
		return true;
	} catch (e) {
		console.error("Error updating category:", e);
		return false;
	}
};

export const deleteCategory = async (id: string): Promise<boolean> => {
	try {
		await deleteDoc(doc(db, "categories", id));
		return true;
	} catch (e) {
		console.error("Error deleting category:", e);
		return false;
	}
};

// --- Settings API ---

export const getSystemSettings = async (): Promise<SystemSettings | null> => {
	try {
		const docSnap = await getDoc(doc(db, "settings", "general"));
		if (docSnap.exists()) {
			return { id: "general", ...docSnap.data() } as SystemSettings;
		}
		return null;
	} catch (e) {
		console.error("Error fetching settings:", e);
		return null;
	}
};

export const updateSystemSettings = async (
	data: Partial<SystemSettings>,
): Promise<boolean> => {
	try {
		const ref = doc(db, "settings", "general");
		await setDoc(ref, data, { merge: true });
		return true;
	} catch (e) {
		console.error("Error updating settings:", e);
		return false;
	}
};

// --- User Profile API ---

export const createUserProfile = async (
	uid: string,
	profile: UserProfile,
): Promise<boolean> => {
	try {
		if (profile.email) {
			profile.email = profile.email.toLowerCase();
		}

		// Sanitize undefined values
		const sanitizedProfile = JSON.parse(JSON.stringify(profile));

		// Check for New User Coupon
		const settings = await getSystemSettings();
		if (settings?.newUserCouponCode) {
			// Ensure we don't overwrite if for some reason profile already has coupons (unlikely on create)
			const existing = sanitizedProfile.ownedCoupons || [];
			if (!existing.includes(settings.newUserCouponCode)) {
				sanitizedProfile.ownedCoupons = [
					...existing,
					settings.newUserCouponCode,
				];
			}
		}

		await setDoc(doc(db, "users", uid), sanitizedProfile);
		return true;
	} catch (e) {
		console.error("Error creating user profile:", e);
		return false;
	}
};

export const subscribeToUserProfile = (
	uid: string,
	onUpdate: (profile: UserProfile | null) => void,
) => {
	return onSnapshot(
		doc(db, "users", uid),
		(docSnap) => {
			if (docSnap.exists()) {
				onUpdate(docSnap.data() as UserProfile);
			} else {
				onUpdate(null);
			}
		},
		(error) => {
			console.error("Error subscribing to profile:", error);
			onUpdate(null);
		},
	);
};

export const getUserProfile = async (
	uid: string,
): Promise<UserProfile | null> => {
	try {
		const docSnap = await getDoc(doc(db, "users", uid));
		if (docSnap.exists()) {
			return docSnap.data() as UserProfile;
		}
		return null;
	} catch (e) {
		console.error("Error fetching user profile:", e);
		return null;
	}
};

export const getUserByEmail = async (
	email: string,
): Promise<UserProfile | null> => {
	try {
		const normalizedEmail = email.toLowerCase().trim();

		const q = query(
			collection(db, "users"),
			where("email", "==", normalizedEmail),
		);
		const querySnapshot = await getDocs(q);
		if (!querySnapshot.empty) {
			return querySnapshot.docs[0].data() as UserProfile;
		}
		return null;
	} catch (e) {
		console.error("Error fetching user by email:", e);
		return null;
	}
};

export const updateUserProfile = async (
	uid: string,
	data: Partial<UserProfile>,
): Promise<boolean> => {
	try {
		if (data.email) {
			data.email = data.email.toLowerCase();
		}
		const userRef = doc(db, "users", uid);
		await updateDoc(userRef, data);

		return true;
	} catch (e) {
		console.error("Error updating profile", e);
		return false;
	}
};

export const signOutUser = async (): Promise<boolean> => {
	try {
		await signOut(auth);
		return true;
	} catch (e) {
		console.error("Error signing out:", e);
		return false;
	}
};

// --- Seed helpers (for initial data population only; not used as runtime mocks) ---

const SEED_COMBOS: Omit<Combo, "id">[] = [
	{
		name: "Combo Sinh Viên Cuối Tháng",
		description: "Cứu đói cấp tốc, chuẩn vị mì tôm chanh.",
		items: ["1 Thùng Mì Hảo Hảo", "1 Vỉ Xúc Xích", "6 Lon Redbull"],
		originalPrice: 350000,
		price: 289000,
		imageUrl:
			"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=600",
		tags: ["Best Seller", "-18%"],
		coupon: "TANLECH50",
		status: "available",
	},
	{
		name: "Combo Gia Đình Hạnh Phúc",
		description: "Vợ khen chồng đảm, mâm cơm trọn vị.",
		items: ["1 Gạo ST25 5kg", "1 Chai Dầu Neptune", "1 Nước Mắm Nam Ngư"],
		originalPrice: 450000,
		price: 360000,
		imageUrl:
			"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600",
		tags: ["Tiết Kiệm", "-20%"],
		coupon: "COMBOGIADINH",
		status: "available",
	},
	{
		name: "Combo Nhậu Lai Rai",
		description: "Không say không về, mà về thì vợ mắng.",
		items: ["1 Thùng Tiger", "1 Khô Gà Lá Chanh", "1 Đậu Phộng"],
		originalPrice: 600000,
		price: 499000,
		imageUrl:
			"https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=600",
		tags: ["Hot", "-15%"],
		status: "out_of_stock",
	},
	{
		name: 'Combo Eat Clean "Giả Trân"',
		description: "Ăn kiêng nhưng vẫn phải ngon cái bụng.",
		items: ["1 Yến Mạch", "1 Hạt Chia", "1 Sữa Chua Hy Lạp"],
		originalPrice: 300000,
		price: 250000,
		imageUrl:
			"https://images.unsplash.com/photo-1511690656952-34342d5c2895?auto=format&fit=crop&q=80&w=600",
		tags: ["Healthy"],
		status: "available",
	},
];

const SEED_COUPONS: Omit<Coupon, "id">[] = [
	{
		code: "TANLECH50",
		desc: "Giảm 50K cho đơn từ 300K",
		color: "from-pink-500 to-rose-500",
		expiryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
		type: "fixed",
		value: 50000,
	},
	{
		code: "FREESHIP",
		desc: "Miễn phí vận chuyển toàn quốc",
		color: "from-blue-400 to-indigo-500",
		expiryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
		type: "fixed",
		value: 15000,
	},
	{
		code: "COMBOGIADINH",
		desc: "Giảm 15% cho Combo Gia Đình",
		color: "from-amber-400 to-orange-500",
		expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Extended expiry
		type: "percent",
		value: 15,
		// We will handle applicableCombos logic dynamically by matching combo.coupon or name in the cart for this demo
	},
];

// Seed function for Admin to quickly populate DB with sample data
export const seedDatabase = async () => {
	try {
		for (const combo of SEED_COMBOS) {
			await addDoc(collection(db, "combos"), combo);
		}
		for (const coupon of SEED_COUPONS) {
			await addDoc(collection(db, "coupons"), coupon);
		}

		// Seed Promo
		await addDoc(collection(db, "promos"), {
			title: "GIẢM NGAY 10% HÔM NAY!",
			message:
				"Dành riêng cho khách hàng mới ghé thăm Tân Lếch Đóng Gói lần đầu tiên.",
			couponCode: "CHAO2024",
			discountValue: "10%",
			expiryDate: "2025-12-31",
			isActive: true,
		});

		// eslint-disable-next-line no-alert
		alert("Đã thêm dữ liệu mẫu vào Firestore!");
	} catch (e) {
		// eslint-disable-next-line no-alert
		alert("Lỗi seed data: " + e);
	}
};

export { app, analytics, auth, ui };
