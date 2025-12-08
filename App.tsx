import React, { useState, useEffect } from 'react';
import { PromoGate } from './components/PromoGate';
import { Shop } from './components/Shop';
import { AICodeHunter } from './components/AICodeHunter'; 
import { AppView, Combo } from './types';
import { getCombos } from './services/firebase';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        const data = await getCombos();
        setCombos(data);
        setLoading(false);
    };
    fetchData();
  }, []);

  const renderView = () => {
    if (loading && view === AppView.SHOP) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    switch (view) {
      case AppView.LANDING:
        return (
          <PromoGate 
            onUnlock={() => setView(AppView.SHOP)} 
            onHunt={() => setView(AppView.COUPON_LIST)} 
          />
        );
      case AppView.COUPON_LIST:
        return (
            <AICodeHunter 
                onBack={() => setView(AppView.LANDING)} 
                onGoToShop={() => setView(AppView.SHOP)}
            />
        );
      case AppView.SHOP:
      default:
        return (
          <Shop 
            combos={combos} 
            onOpenHunter={() => setView(AppView.COUPON_LIST)}
          />
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