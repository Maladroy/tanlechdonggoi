import React, { useState } from 'react';
import { Lock, ArrowRight, Ticket, ShoppingBag } from 'lucide-react';

interface Props {
  onUnlock: () => void;
  onHunt: () => void;
}

export const PromoGate: React.FC<Props> = ({ onUnlock, onHunt }) => {
  const [email, setEmail] = useState('');
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if(email) {
        onUnlock();
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        
        <div className="relative bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border-t-8 border-orange-600">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-orange-600 w-24 h-24 rounded-full flex items-center justify-center border-4 border-orange-600 shadow-lg">
                <ShoppingBag size={40} />
            </div>

            <h1 className="mt-10 text-3xl md:text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Tân Lếch <span className="text-orange-600">Store</span>
            </h1>
            <p className="text-gray-500 mb-8 font-medium">
                Chuyên Combo giá sỉ - Cần có mã mới mua được giá tốt!
            </p>

            <div className="space-y-4">
                {/* Option 1: Hunt Code */}
                <button 
                    onClick={onHunt}
                    className="w-full group bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-orange-200 transition transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                    <Ticket className="animate-pulse" />
                    Vào Kho Săn Mã Giảm Giá
                    <ArrowRight className="group-hover:translate-x-1 transition" size={20} />
                </button>

                <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-2 text-gray-400 font-bold bg-white">Hoặc đăng ký nhận tin</span>
                    </div>
                </div>

                {/* Option 2: Register */}
                <form onSubmit={handleRegister} className="flex gap-2">
                    <input 
                        type="email" 
                        required
                        placeholder="Email của bạn..."
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="flex-1 bg-gray-100 border-gray-200 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                    />
                    <button type="submit" className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition whitespace-nowrap">
                        Xem Hàng
                    </button>
                </form>
            </div>
            
            <p className="mt-6 text-xs text-gray-400">
                *Lưu ý: Hàng ngon số lượng có hạn.
            </p>
        </div>
    </div>
  );
};