import type React from "react";
import { useEffect, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { AICodeHunter } from "./components/AICodeHunter";
import { AuthGate } from "./components/AuthGate";
import { Cart } from "./components/Cart";
import { ProfileModal } from "./components/ProfileModal";
import { Shop } from "./components/Shop";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  getCombos,
  getUserProfile,
  signOutUser,
  updateUserProfile,
} from "./services/firebase";
import type { CartItem, Combo, UserProfile } from "./types";
import { AppView } from "./types";
import "./font.css";
import "./style.css";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  // User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Cart State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getCombos();
      setCombos(data);
      setLoading(false);
    };
    fetchData();

    // Listen for Auth Changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
          if (profile.isAdmin) {
            setView(AppView.ADMIN);
          } else {
            setView(AppView.SHOP);
          }
        } else {
          setUser({
            name: firebaseUser.displayName || "Khách hàng",
            phone: "",
            emailOrPhone: firebaseUser.email || "",
          });
          setView(AppView.SHOP);
        }
      } else {
        setUser(null);
        setView(AppView.AUTH);
      }
    });

    return () => unsubscribe();
  }, []); // Remove dependency on [view] to avoid infinite loops, but keep fetching data on mount

  // Auth Handlers
  const handleLogin = (userProfile: UserProfile) => {
    setUser(userProfile);
    if (userProfile.isAdmin) {
      setView(AppView.ADMIN);
    } else {
      setView(AppView.SHOP);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
    setView(AppView.AUTH);
    setCart([]);
    setIsProfileOpen(false);
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (user && auth.currentUser) {
      const success = await updateUserProfile(auth.currentUser.uid, data);
      if (success) {
        setUser({ ...user, ...data });
        return true;
      }
    }
    return false;
  };

  // Cart Handlers
  const addToCart = (combo: Combo) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === combo.id);
      if (existing) {
        return prev.map((item) =>
          item.id === combo.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...combo, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCode(null);
  };

  // Coupon Logic
  const handleApplyCode = (code: string) => {
    // In a real app we would validate against DB coupons
    const validCodes = ["TANLECH50", "COMBOGIADINH", "BANMOI20", "FREESHIP"];
    if (validCodes.includes(code.toUpperCase())) {
      setAppliedCode(code.toUpperCase());
      return true;
    }
    // Also allow new dynamic coupons
    setAppliedCode(code.toUpperCase());
    return true;
  };

  const renderView = () => {
    if (loading && view !== AppView.AUTH && view !== AppView.ADMIN) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    switch (view) {
      case AppView.AUTH:
        return (
          <AuthGate
            onLoginSuccess={handleLogin}
          />
        );

      case AppView.ADMIN:
        return <AdminDashboard onLogout={handleLogout} />;

      case AppView.COUPON_LIST:
        return (
          <AICodeHunter
            onBack={() => setView(AppView.SHOP)}
            onGoToShop={() => setView(AppView.SHOP)}
          />
        );

      default:
        return (
          <>
            <Shop
              combos={combos}
              onOpenHunter={() => setView(AppView.COUPON_LIST)}
              onAddToCart={addToCart}
              cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
              onOpenCart={() => setIsCartOpen(true)}
              user={user}
              onOpenProfile={() => setIsProfileOpen(true)}
            />

            <Cart
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cart={cart}
              user={user}
              onRemove={removeFromCart}
              appliedCode={appliedCode}
              onApplyCode={handleApplyCode}
              onRemoveCode={() => setAppliedCode(null)}
              onClearCart={clearCart}
            />

            {user && (
              <ProfileModal
                user={user}
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onUpdate={handleUpdateProfile}
                onLogout={handleLogout}
              />
            )}
          </>
        );
    }
  };

  return <>{renderView()}</>;
};

export default App;
