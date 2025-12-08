import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { Combo, Coupon } from '../types';

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase (Wrapped to prevent crash if config is invalid in demo)
let db: any = null;
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
} catch (e) {
    console.warn("Firebase init failed, using mock data:", e);
}

// --- Mock Data (Fallback) ---

const MOCK_COMBOS: Combo[] = [
  {
    id: 'c1',
    name: 'Combo Sinh Viên Cuối Tháng',
    description: 'Cứu đói cấp tốc, chuẩn vị mì tôm chanh.',
    items: ['1 Thùng Mì Hảo Hảo', '1 Vỉ Xúc Xích', '6 Lon Redbull'],
    originalPrice: 350000,
    price: 289000,
    imageUrl: 'https://picsum.photos/seed/noodle/400/300',
    tags: ['Best Seller', '-18%'],
    link: '#',
    coupon: 'TANLECH50'
  },
  {
    id: 'c2',
    name: 'Combo Gia Đình Hạnh Phúc',
    description: 'Vợ khen chồng đảm, mâm cơm trọn vị.',
    items: ['1 Gạo ST25 5kg', '1 Chai Dầu Neptune', '1 Nước Mắm Nam Ngư'],
    originalPrice: 450000,
    price: 360000,
    imageUrl: 'https://picsum.photos/seed/rice/400/300',
    tags: ['Tiết Kiệm', '-20%'],
    link: '#',
    coupon: 'COMBOGIADINH'
  },
  {
    id: 'c3',
    name: 'Combo Nhậu Lai Rai',
    description: 'Không say không về, mà về thì vợ mắng.',
    items: ['1 Thùng Tiger', '1 Khô Gà Lá Chanh', '1 Đậu Phộng'],
    originalPrice: 600000,
    price: 499000,
    imageUrl: 'https://picsum.photos/seed/beer/400/300',
    tags: ['Hot', '-15%'],
    link: '#'
  },
  {
    id: 'c4',
    name: 'Combo Eat Clean "Giả Trân"',
    description: 'Ăn kiêng nhưng vẫn phải ngon cái bụng.',
    items: ['1 Yến Mạch', '1 Hạt Chia', '1 Sữa Chua Hy Lạp'],
    originalPrice: 300000,
    price: 250000,
    imageUrl: 'https://picsum.photos/seed/healthy/400/300',
    tags: ['Healthy'],
    link: '#'
  }
];

const MOCK_COUPONS: Coupon[] = [
  { 
      code: 'TANLECH50', 
      desc: 'Giảm 50K cho đơn từ 300K', 
      color: 'from-pink-500 to-rose-500',
      expiryDate: new Date(Date.now() + 86400000 * 3).toISOString() // 3 days from now
  },
  { 
      code: 'FREESHIP', 
      desc: 'Miễn phí vận chuyển toàn quốc', 
      color: 'from-blue-400 to-indigo-500',
      expiryDate: new Date(Date.now() + 86400000 * 7).toISOString() 
  },
  { 
      code: 'COMBOGIADINH', 
      desc: 'Giảm 15% cho Combo Gia Đình', 
      color: 'from-amber-400 to-orange-500',
      expiryDate: new Date(Date.now() - 86400000).toISOString() // Expired yesterday
  },
  { 
      code: 'BANMOI20', 
      desc: 'Giảm 20K cho bạn mới', 
      color: 'from-emerald-400 to-teal-500',
      expiryDate: '2025-12-31T23:59:59.000Z'
  },
];

// --- Service Functions ---

export const getCombos = async (): Promise<Combo[]> => {
    if (!db) return new Promise(resolve => setTimeout(() => resolve(MOCK_COMBOS), 500));
    
    try {
        const querySnapshot = await getDocs(collection(db, "combos"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Combo));
        if (data.length === 0) return MOCK_COMBOS; // Return mock if DB empty
        return data;
    } catch (e) {
        console.error("Error fetching combos:", e);
        return MOCK_COMBOS;
    }
};

export const getCoupons = async (): Promise<Coupon[]> => {
    if (!db) return new Promise(resolve => setTimeout(() => resolve(MOCK_COUPONS), 500));

    try {
        const querySnapshot = await getDocs(collection(db, "coupons"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
        if (data.length === 0) return MOCK_COUPONS;
        return data;
    } catch (e) {
        console.error("Error fetching coupons:", e);
        return MOCK_COUPONS;
    }
};

// Helper to seed data (Run this once from console if you have a valid DB connected)
export const seedDatabase = async () => {
    if (!db) {
        console.error("Database not initialized");
        return;
    }
    
    for (const combo of MOCK_COMBOS) {
        await addDoc(collection(db, "combos"), combo);
    }
    for (const coupon of MOCK_COUPONS) {
        await addDoc(collection(db, "coupons"), coupon);
    }
    console.log("Database seeded!");
};