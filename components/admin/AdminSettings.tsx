import { Save } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
    getCoupons,
    getSystemSettings,
    updateSystemSettings,
} from "../../services/firebase";
import type { Coupon } from "../../types";

export const AdminSettings: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [newUserCouponCode, setNewUserCouponCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [c, s] = await Promise.all([getCoupons(), getSystemSettings()]);
            setCoupons(c);
            if (s?.newUserCouponCode) {
                setNewUserCouponCode(s.newUserCouponCode);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updateSystemSettings({ newUserCouponCode });
        setSaving(false);
        alert("Đã lưu cài đặt!");
    };

    return (
        <div>
            <h3 className="font-bold text-lg text-slate-700 mb-6">Cài Đặt Hệ Thống</h3>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
                <div className="mb-6">
                    <h4 className="font-bold text-md text-slate-800 mb-2">
                        Mã Giảm Giá Cho Người Mới
                    </h4>
                    <p className="text-sm text-slate-500 mb-4">
                        Mã này sẽ được tự động cấp cho người dùng khi họ tạo tài khoản mới.
                    </p>

                    <div className="flex gap-4">
                        <select
                            className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50"
                            value={newUserCouponCode}
                            onChange={(e) => setNewUserCouponCode(e.target.value)}
                        >
                            <option value="">-- Không chọn --</option>
                            {coupons.map((c) => (
                                <option key={c.id} value={c.code}>
                                    {c.code} - {c.desc} ({c.type === "fixed" ? `${c.value?.toLocaleString()}đ` : `${c.value}%`})
                                </option>
                            ))}
                        </select>
                    </div>
                    {newUserCouponCode && (
                        <p className="text-xs text-green-600 mt-2 font-bold">
                            Đang chọn: {newUserCouponCode}
                        </p>
                    )}
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition shadow-lg shadow-orange-200 disabled:opacity-70"
                    >
                        <Save size={20} />
                        {saving ? "Đang lưu..." : "Lưu Cài Đặt"}
                    </button>
                </div>
            </div>
        </div>
    );
};
