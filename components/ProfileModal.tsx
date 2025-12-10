import React, { useState } from "react";
import { X, Save, User, Phone, Mail } from "lucide-react";
import type { UserProfile } from "../types";

interface Props {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (data: Partial<UserProfile>) => Promise<boolean>;
    onLogout: () => void;
}

export const ProfileModal: React.FC<Props> = ({
    user,
    isOpen,
    onClose,
    onUpdate,
    onLogout,
}) => {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone);
    const [email, setEmail] = useState(user.email || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const success = await onUpdate({ name, phone, email });
        setLoading(false);

        if (success) {
            setMessage({ type: "success", text: "Cập nhật thành công!" });
            setTimeout(() => {
                setMessage(null);
                onClose();
            }, 1500);
        } else {
            setMessage({ type: "error", text: "Có lỗi xảy ra. Vui lòng thử lại." });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User size={24} /> Hồ Sơ Của Bạn
                    </h2>
                    <button type="button" onClick={onClose} className="hover:bg-orange-700 p-1 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {message && (
                        <div
                            className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === "success"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
                            >
                                {loading ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                ) : (
                                    <>
                                        <Save size={20} /> Lưu Thay Đổi
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                            >
                                Đăng Xuất
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
