import React, { useState, useEffect } from 'react';
import { AuthGate } from './components/AuthGate';
import { Shop } from './components/Shop';
import { AICodeHunter } from './components/AICodeHunter'; 
import { Cart } from './components/Cart';
import { AdminDashboard } from './components/AdminDashboard';
import { AppView, Combo, CartItem, UserProfile } from './types';
import { getCombos } from './services/firebase';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User State
  const [user, setUser] = useState<UserProfile | null>(null);

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
  }, [view]); // Refetch when view changes (e.g. returning from Admin)

  // Auth Handlers
  const handleLogin = (userProfile: UserProfile) => {
      setUser(userProfile);
      setView(AppView.SHOP);
  };

  const handleAdminLogin = () => {
      setUser({ name: 'Admin', phone: '000000', emailOrPhone: 'admin' });
      setView(AppView.ADMIN);
  };

  // Cart Handlers
  const addToCart = (combo: Combo) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === combo.id);
      if (existing) {
        return prev.map(item => item.id === combo.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...combo, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCode(null);
  };

  // Coupon Logic
  const handleApplyCode = (code: string) => {
    // In a real app we would validate against DB coupons
    const validCodes = ['TANLECH50', 'COMBOGIADINH', 'BANMOI20', 'FREESHIP'];
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
        return <AuthGate onLoginSuccess={handleLogin} onAdminLogin={handleAdminLogin} />;
      
      case AppView.ADMIN:
        return <AdminDashboard onLogout={() => setView(AppView.AUTH)} />;

      case AppView.COUPON_LIST:
        return (
            <AICodeHunter 
                onBack={() => setView(AppView.SHOP)} 
                onGoToShop={() => setView(AppView.SHOP)}
            />
        );
        
      case AppView.SHOP:
      default:
        return (
            <>
                <Shop 
                    combos={combos} 
                    onOpenHunter={() => setView(AppView.COUPON_LIST)}
                    onAddToCart={addToCart}
                    cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
                    onOpenCart={() => setIsCartOpen(true)}
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
            </>
        );
    }
  };

  return (
    <>
      {renderView()}
    </>
  );
};

export default App;