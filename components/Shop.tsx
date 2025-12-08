import React from 'react';
import { Combo } from '../types';
import { ExternalLink, Tag, Clock, ArrowRight } from 'lucide-react';

interface Props {
  combos: Combo[];
  onOpenHunter: () => void;
}

export const Shop: React.FC<Props> = ({ combos, onOpenHunter }) => {
  const handleBuy = (link: string) => {
    window.open(link, '_blank');
  };
  
  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-xl">T</div>
            <h1 className="font-bold text-gray-800 text-lg tracking-tight">Tấn Lệch <span className="text-orange-600">Store</span></h1>
          </div>
          <button 
              onClick={onOpenHunter}
              className="flex items-center gap-1 bg-yellow-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-yellow-200 transition"
          >
              <Tag size={16} /> Kho Mã Giảm
          </button>
        </div>
      </header>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-center py-2 px-4 text-xs md:text-sm font-bold animate-pulse cursor-pointer" onClick={onOpenHunter}>
        🔥KHÔNG CÓ MÃ GIẢM GIÁ? VÀO LẤY NGAY ĐỂ MUA COMBO CHÁY 🔥
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-end">
             <div>
                <h2 className="text-2xl font-bold text-gray-900">Danh Sách Combo 📦</h2>
                <p className="text-gray-500 text-sm">Chốt đơn nhanh kẻo hết hàng ngon!</p>
             </div>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((combo) => (
            <div key={combo.id} className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-visible hover:shadow-2xl transition-all duration-300 group flex flex-col">
              
              {/* Coupon Bow/Banner */}
              {combo.coupon && (
                <div className="absolute -top-3 -right-3 z-20">
                    <div className="relative">
                        <div className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 shadow-lg transform rotate-6 rounded-md flex items-center gap-1 border-2 border-white">
                            <Tag size={12} fill="currentColor" />
                            MÃ: {combo.coupon}
                        </div>
                    </div>
                </div>
              )}

              <div className="relative h-56 overflow-hidden rounded-t-3xl">
                <img 
                    src={combo.imageUrl} 
                    alt={combo.name} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" 
                />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                    {combo.tags[0]}
                </div>
                {/* Sale Timer */}
                <div className="absolute bottom-3 right-3 bg-white/90 text-red-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-sm">
                    <Clock size={12} /> Flash Sale
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2">
                    <h3 className="font-bold text-xl text-gray-800 leading-snug group-hover:text-orange-600 transition">{combo.name}</h3>
                </div>
                
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {combo.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {combo.items.map((item, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                            + {item}
                        </span>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-xs line-through decoration-red-500">
                            {combo.originalPrice.toLocaleString('vi-VN')}₫
                        </span>
                        <span className="text-2xl font-black text-gray-900">
                            {combo.price.toLocaleString('vi-VN')}
                            <span className="text-xs font-normal text-gray-500 ml-1">vnđ</span>
                        </span>
                    </div>
                    
                    <button 
                        onClick={() => handleBuy(combo.link)}
                        className="bg-gray-900 hover:bg-orange-600 text-white pl-5 pr-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-200 active:scale-95 flex items-center gap-2 group/btn"
                    >
                        Mua Ngay 
                        <ExternalLink size={18} className="group-hover/btn:translate-x-1 transition" />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-12 py-8 bg-gray-100 text-center text-gray-400 text-sm">
          <p>© 2024 Tạp Hóa Tấn Lệch. Chỉ bán Combo, không bán lẻ.</p>
      </footer>
    </div>
  );
};