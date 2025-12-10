import { getAnalytics } from "firebase/analytics";
import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Combo, Coupon, Order } from "../types";

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
const db = getFirestore(app);
const auth = getAuth(app);

// Optional analytics (only in browser and when measurementId is provided)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  analytics = getAnalytics(app);
}

// --- Public API ---

export const getCombos = async (): Promise<Combo[]> => {
  const querySnapshot = await getDocs(collection(db, "combos"));
  return querySnapshot.docs.map(
    (docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Combo, "id">) }),
  );
};

export const getCoupons = async (): Promise<Coupon[]> => {
  const querySnapshot = await getDocs(collection(db, "coupons"));
  return querySnapshot.docs.map(
    (docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Coupon, "id">) }),
  );
};

export const createOrder = async (order: Order): Promise<boolean> => {
  try {
    await addDoc(collection(db, "orders"), order);
    return true;
  } catch (e) {
    console.error("Error creating order:", e);
    return false;
  }
};

// --- Admin API ---

export const getOrders = async (): Promise<Order[]> => {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Order, "id">) }),
    );
  } catch (e) {
    console.error("Error fetching orders:", e);
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

// --- User Profile API ---

import { setDoc, getDoc } from "firebase/firestore";
import type { UserProfile } from "../types";

export const createUserProfile = async (
  uid: string,
  profile: UserProfile,
): Promise<boolean> => {
  try {
    await setDoc(doc(db, "users", uid), profile);
    return true;
  } catch (e) {
    console.error("Error creating user profile:", e);
    return false;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
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

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
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
  },
];

const SEED_COUPONS: Omit<Coupon, "id">[] = [
  {
    code: "TANLECH50",
    desc: "Giảm 50K cho đơn từ 300K",
    color: "from-pink-500 to-rose-500",
    expiryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
  {
    code: "FREESHIP",
    desc: "Miễn phí vận chuyển toàn quốc",
    color: "from-blue-400 to-indigo-500",
    expiryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
  {
    code: "COMBOGIADINH",
    desc: "Giảm 15% cho Combo Gia Đình",
    color: "from-amber-400 to-orange-500",
    expiryDate: new Date(Date.now() - 86400000).toISOString(),
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
    // eslint-disable-next-line no-alert
    alert("Đã thêm dữ liệu mẫu vào Firestore!");
  } catch (e) {
    // eslint-disable-next-line no-alert
    alert("Lỗi seed data: " + e);
  }
};

export { app, analytics, auth };
