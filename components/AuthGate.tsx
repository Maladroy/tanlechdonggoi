import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, User, Phone, Lock, Mail } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
  onAdminLogin: () => void;
}

export const AuthGate: React.FC<Props> = ({ onLoginSuccess, onAdminLogin }) => {
  const [isRegister, setIsRegister] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // BACKDOOR FOR ADMIN LOGIN
    if (!isRegister && emailOrPhone === 'admin' && password === 'admin') {
        onAdminLogin();
        return;
    }

    if (isRegister) {
        onLoginSuccess({
            name,
            phone,
            emailOrPhone
        });
    } else {
        // Login simulation
        onLoginSuccess({
            name: 'Khách Hàng Thân Thiết',
            phone: emailOrPhone.match(/\d+/) ? emailOrPhone : '0909000000',
            emailOrPhone
        });
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        
        <div className="relative bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-orange-600">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-orange-600 w-24 h-24 rounded-full flex items-center justify-center border-4 border-orange-600 shadow-lg">
                <ShoppingBag size={40} />
            </div>

            <div className="mt-12 text-center">
                <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                    Tân Lếch <span className="text-orange-600">Đóng Gói</span>
                </h1>
                <p className="text-gray-500 mb-6 text-sm">
                    {isRegister ? 'Đăng ký thành viên để săn Combo giá sốc!' : 'Đăng nhập để xem đơn hàng và ưu đãi'}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => setIsRegister(true)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isRegister ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Đăng Ký
                </button>
                <button 
                    onClick={() => setIsRegister(false)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isRegister ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Đăng Nhập
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                    <>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                required
                                placeholder="Họ và tên"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="tel" 
                                required
                                placeholder="Số điện thoại liên hệ"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
                            />
                        </div>
                    </>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        placeholder={isRegister ? "Email hoặc Tên đăng nhập" : "Email hoặc Số điện thoại"}
                        value={emailOrPhone}
                        onChange={e => setEmailOrPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        required
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-300 hover:bg-orange-600 transition transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-4"
                >
                    {isRegister ? 'Hoàn Tất Đăng Ký' : 'Đăng Nhập Ngay'}
                    <ArrowRight size={20} />
                </button>
            </form>
        </div>
    </div>
  );
};