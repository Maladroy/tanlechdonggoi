import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Combo, Coupon, Order } from '../types';

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
let db: any = null;
try {
    // Check if configured (Prevent crash in demo environment if keys aren't set)
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } else {
        console.warn("Firebase not configured. Using Mock Data for demo.");
    }
} catch (e) {
    console.warn("Firebase init failed:", e);
}

// --- Mock Data Fallback (Used only if DB connection fails/not configured) ---

const MOCK_COMBOS: Combo[] = [
  {
    id: 'c1',
    name: 'Combo Sinh Viên Cuối Tháng',
    description: 'Cứu đói cấp tốc, chuẩn vị mì tôm chanh.',
    items: ['1 Thùng Mì Hảo Hảo', '1 Vỉ Xúc Xích', '6 Lon Redbull'],
    originalPrice: 350000,
    price: 289000,
    imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=600',
    tags: ['Best Seller', '-18%'],
    coupon: 'TANLECH50'
  },
  {
    id: 'c2',
    name: 'Combo Gia Đình Hạnh Phúc',
    description: 'Vợ khen chồng đảm, mâm cơm trọn vị.',
    items: ['1 Gạo ST25 5kg', '1 Chai Dầu Neptune', '1 Nước Mắm Nam Ngư'],
    originalPrice: 450000,
    price: 360000,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
    tags: ['Tiết Kiệm', '-20%'],
    coupon: 'COMBOGIADINH'
  },
  {
    id: 'c3',
    name: 'Combo Nhậu Lai Rai',
    description: 'Không say không về, mà về thì vợ mắng.',
    items: ['1 Thùng Tiger', '1 Khô Gà Lá Chanh', '1 Đậu Phộng'],
    originalPrice: 600000,
    price: 499000,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=600',
    tags: ['Hot', '-15%']
  },
  {
    id: 'c4',
    name: 'Combo Eat Clean "Giả Trân"',
    description: 'Ăn kiêng nhưng vẫn phải ngon cái bụng.',
    items: ['1 Yến Mạch', '1 Hạt Chia', '1 Sữa Chua Hy Lạp'],
    originalPrice: 300000,
    price: 250000,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342d5c2895?auto=format&fit=crop&q=80&w=600',
    tags: ['Healthy']
  }
];

const MOCK_COUPONS: Coupon[] = [
  { 
      id: 'cp1',
      code: 'TANLECH50', 
      desc: 'Giảm 50K cho đơn từ 300K', 
      color: 'from-pink-500 to-rose-500',
      expiryDate: new Date(Date.now() + 86400000 * 3).toISOString()
  },
  { 
      id: 'cp2',
      code: 'FREESHIP', 
      desc: 'Miễn phí vận chuyển toàn quốc', 
      color: 'from-blue-400 to-indigo-500',
      expiryDate: new Date(Date.now() + 86400000 * 7).toISOString() 
  },
  { 
      id: 'cp3',
      code: 'COMBOGIADINH', 
      desc: 'Giảm 15% cho Combo Gia Đình', 
      color: 'from-amber-400 to-orange-500',
      expiryDate: new Date(Date.now() - 86400000).toISOString()
  },
];

let MOCK_ORDERS: Order[] = [];

// --- Public API ---

export const getCombos = async (): Promise<Combo[]> => {
    if (!db) return MOCK_COMBOS;
    try {
        const querySnapshot = await getDocs(collection(db, "combos"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Combo));
        return data.length > 0 ? data : MOCK_COMBOS;
    } catch (e) {
        console.error("Error fetching combos:", e);
        return MOCK_COMBOS;
    }
};

export const getCoupons = async (): Promise<Coupon[]> => {
    if (!db) return MOCK_COUPONS;
    try {
        const querySnapshot = await getDocs(collection(db, "coupons"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
        return data.length > 0 ? data : MOCK_COUPONS;
    } catch (e) {
        console.error("Error fetching coupons:", e);
        return MOCK_COUPONS;
    }
};

export const createOrder = async (order: Order): Promise<boolean> => {
    if (!db) {
        MOCK_ORDERS.unshift({ ...order, id: `ord-${Date.now()}` });
        return new Promise(resolve => setTimeout(() => resolve(true), 800));
    }
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
    if (!db) return MOCK_ORDERS;
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (e) {
        console.error("Error fetching orders:", e);
        return [];
    }
};

export const updateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<boolean> => {
    if (!db) {
        const idx = MOCK_ORDERS.findIndex(o => o.id === orderId);
        if (idx !== -1) MOCK_ORDERS[idx].status = status;
        return true;
    }
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status });
        return true;
    } catch (e) {
        console.error("Error updating order:", e);
        return false;
    }
};

export const addCombo = async (combo: Omit<Combo, 'id'>): Promise<boolean> => {
    if (!db) {
        MOCK_COMBOS.push({ ...combo, id: `c-${Date.now()}` });
        return true;
    }
    try {
        await addDoc(collection(db, "combos"), combo);
        return true;
    } catch (e) {
        console.error("Error adding combo:", e);
        return false;
    }
};

export const deleteCombo = async (comboId: string): Promise<boolean> => {
    if (!db) {
        const idx = MOCK_COMBOS.findIndex(c => c.id === comboId);
        if (idx !== -1) MOCK_COMBOS.splice(idx, 1);
        return true;
    }
    try {
        await deleteDoc(doc(db, "combos", comboId));
        return true;
    } catch (e) {
        console.error("Error deleting combo:", e);
        return false;
    }
};

export const addCoupon = async (coupon: Omit<Coupon, 'id'>): Promise<boolean> => {
    if (!db) {
        MOCK_COUPONS.push({ ...coupon, id: `cp-${Date.now()}` });
        return true;
    }
    try {
        await addDoc(collection(db, "coupons"), coupon);
        return true;
    } catch (e) {
        console.error("Error adding coupon:", e);
        return false;
    }
};

export const deleteCoupon = async (couponId: string): Promise<boolean> => {
    if (!db) {
        const idx = MOCK_COUPONS.findIndex(c => c.id === couponId);
        if (idx !== -1) MOCK_COUPONS.splice(idx, 1);
        return true;
    }
    try {
        await deleteDoc(doc(db, "coupons", couponId));
        return true;
    } catch (e) {
        console.error("Error deleting coupon:", e);
        return false;
    }
};

// Seed function for Admin to quickly populate DB
export const seedDatabase = async () => {
    if (!db) return;
    try {
        for (const combo of MOCK_COMBOS) {
            await addDoc(collection(db, "combos"), { ...combo, id: undefined }); // let firestore gen ID
        }
        for (const coupon of MOCK_COUPONS) {
            await addDoc(collection(db, "coupons"), { ...coupon, id: undefined });
        }
        alert("Đã thêm dữ liệu mẫu vào Firestore!");
    } catch (e) {
        alert("Lỗi seed data: " + e);
    }
};