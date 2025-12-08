import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, Ticket, Gift, Calendar, Clock } from 'lucide-react';
import { Coupon } from '../types';
import { getCoupons } from '../services/firebase';

interface Props {
  onBack: () => void;
  onGoToShop: () => void;
}

export const AICodeHunter: React.FC<Props> = ({ onBack, onGoToShop }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
        const data = await getCoupons();
        setCoupons(data);
        setLoading(false);
    }
    fetch();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (dateString: string) => {
      return new Date(dateString) < new Date();
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Kho Mã Giảm Giá</h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-6">
            <p className="text-gray-600">Lưu mã ngay để áp dụng khi thanh toán!</p>
        </div>

        {loading ? (
            <div className="flex justify-center py-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        ) : (
            coupons.map((coupon, idx) => {
              const expired = isExpired(coupon.expiryDate);
              return (
                <div key={idx} className={`relative group perspective ${expired ? 'opacity-70 grayscale' : ''}`}>
                    <div className={`relative overflow-hidden bg-gradient-to-r ${coupon.color} rounded-2xl shadow-xl transform transition-transform duration-300 ${!expired ? 'hover:scale-[1.02] hover:-rotate-1' : ''}`}>
                    {/* Decorative Circles */}
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-50 rounded-full"></div>
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-50 rounded-full"></div>
                    
                    <div className="p-6 flex flex-col relative z-10 text-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Gift size={20} className="text-white/90" />
                                    <span className={`font-bold text-lg tracking-widest ${expired ? 'line-through' : ''}`}>{coupon.code}</span>
                                </div>
                                <p className="text-sm text-white/90 font-medium mb-3">{coupon.desc}</p>
                            </div>

                            <div className="pl-4 border-l border-white/20 border-dashed flex items-center">
                                <button 
                                    onClick={() => !expired && handleCopy(coupon.code)}
                                    disabled={expired}
                                    className={`bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition flex items-center gap-2 min-w-[100px] justify-center ${expired ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'hover:bg-gray-50 active:scale-95'}`}
                                >
                                    {expired ? (
                                        'Hết Hạn'
                                    ) : copiedCode === coupon.code ? (
                                        <>
                                            <Check size={16} className="text-green-600" /> Đã Lưu
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} /> Lưu Mã
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Expiry Date */}
                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-xs text-white/80 font-mono">
                            {expired ? <Clock size={12} className="text-red-200" /> : <Calendar size={12} />}
                            <span className={expired ? 'text-red-200 font-bold' : ''}>
                                {expired ? 'Đã hết hạn vào: ' : 'HSD: '} 
                                {formatDate(coupon.expiryDate)}
                            </span>
                        </div>
                    </div>
                    
                    {/* Shine Effect (Only if not expired) */}
                    {!expired && (
                         <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                    )}
                    </div>
                </div>
              );
            })
        )}
      </div>

      <div className="mt-10 w-full max-w-md">
        <button 
            onClick={onGoToShop}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-2xl shadow-gray-400 hover:bg-orange-600 transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
        >
            <Ticket size={24} />
            Đã Có Mã - Vào Mua Ngay
        </button>
      </div>
      
      <style>{`
        @keyframes shine {
            100% {
                left: 125%;
            }
        }
        .animate-shine {
            animation: shine 1s;
        }
      `}</style>
    </div>
  );
};