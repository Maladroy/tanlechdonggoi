import { X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { getActivePromo } from "../services/firebase";
import type { Promo } from "../types";

export const PromoPopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [promo, setPromo] = useState<Promo | null>(null);

    useEffect(() => {
        const checkPromo = async () => {
            const hasSeenPromo = localStorage.getItem("seen_promo_popup_v1");
            if (hasSeenPromo) return;

            const activePromo = await getActivePromo();
            if (activePromo) {
                // Check expiry
                if (new Date(activePromo.expiryDate) > new Date()) {
                    setPromo(activePromo);
                    setTimeout(() => setIsOpen(true), 2000);
                }
            }
        };
        checkPromo();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("seen_promo_popup_v1", "true");
    };

    if (!isOpen || !promo) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity w-full h-full border-none cursor-default"
                onClick={handleClose}
                aria-label="Close popup"
            />

            {/* Content */}
            <div className="relative bg-white rounded-3xl p-1 shadow-2xl animate-float max-w-sm w-full overflow-hidden">
                <div className="absolute top-4 right-4 z-10">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-linear-to-br from-orange-500 to-rose-600 text-white p-8 pt-12 text-center rounded-[1.4rem]">
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider mb-4 border border-white/30">
                        ƯU ĐÃI ĐẶC BIỆT
                    </span>
                    <h3 className="text-3xl font-black mb-2 leading-tight">
                        {promo.title}
                        {promo.discountValue && <><br /> <span className="text-yellow-300">{promo.discountValue}</span></>}
                    </h3>
                    <p className="text-white/90 text-sm mb-6">
                        {promo.message}
                    </p>

                    <div className="bg-white/10 p-3 rounded-xl border border-dashed border-white/30 mb-6">
                        <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
                            Mã giảm giá
                        </p>
                        <div className="font-mono text-2xl font-bold tracking-wider text-yellow-300">
                            {promo.couponCode}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full bg-white text-orange-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg shadow-orange-900/20"
                    >
                        Mua Sắm Ngay
                    </button>
                </div>
            </div>
        </div>
    );
};
