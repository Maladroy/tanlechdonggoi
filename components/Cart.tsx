import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Ticket, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemove: (id: string) => void;
  appliedCode: string | null;
  onApplyCode: (code: string) => boolean; // returns success
  onRemoveCode: () => void;
}

export const Cart: React.FC<Props> = ({ 
  isOpen, onClose, cart, onRemove, appliedCode, onApplyCode, onRemoveCode 
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Simple discount logic for demo
  let discountAmount = 0;
  if (appliedCode) {
    if (appliedCode.toUpperCase().includes('50')) discountAmount = subtotal * 0.5;
    else if (appliedCode.toUpperCase().includes('VIP')) discountAmount = subtotal * 0.3;
    else discountAmount = subtotal * 0.1;
  }

  const finalTotal = subtotal - discountAmount;

  const handleApply = () => {
    if (!codeInput) return;
    const success = onApplyCode(codeInput);
    if (success) {
        setErrorMsg('');
        setCodeInput('');
    } else {
        setErrorMsg('Mã này hết hạn hoặc không tồn tại rồi cưng ơi!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-bold text-xl text-gray-800">Giỏ Hàng Của Bạn</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingCartIcon />
                    <p>Chưa có gì đâu, ra lựa combo đi!</p>
                    <button onClick={onClose} className="text-orange-600 font-bold hover:underline">Quay lại mua sắm</button>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                        <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                            <p className="text-gray-500 text-xs mt-1">{item.items.join(', ')}</p>
                            <div className="mt-2 flex justify-between items-center">
                                <span className="font-bold text-orange-600">{item.price.toLocaleString('vi-VN')}₫</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">x{item.quantity}</span>
                                    <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {/* Coupon Section */}
                <div className="mb-6">
                    {appliedCode ? (
                        <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg text-green-800">
                             <div className="flex items-center gap-2">
                                <CheckCircle size={18} />
                                <span className="font-medium text-sm">Đã dùng: <strong>{appliedCode}</strong></span>
                             </div>
                             <button onClick={onRemoveCode} className="text-xs text-red-500 font-bold hover:underline">Gỡ bỏ</button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Nhập mã giảm giá"
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 uppercase"
                                        value={codeInput}
                                        onChange={(e) => setCodeInput(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleApply}
                                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
                                >
                                    Áp dụng
                                </button>
                            </div>
                            {errorMsg && (
                                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> {errorMsg}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                        <span>Tạm tính</span>
                        <span>{subtotal.toLocaleString('vi-VN')}₫</span>
                    </div>
                    {discountAmount > 0 && (
                         <div className="flex justify-between text-green-600">
                            <span>Giảm giá</span>
                            <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between items-end mb-4">
                    <span className="font-bold text-gray-900 text-lg">Tổng cộng</span>
                    <span className="font-black text-2xl text-orange-600">{finalTotal.toLocaleString('vi-VN')}₫</span>
                </div>

                <button className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200">
                    Thanh Toán Ngay
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

const ShoppingCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
        <circle cx="8" cy="21" r="1"></circle>
        <circle cx="19" cy="21" r="1"></circle>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
    </svg>
);
