import type React from "react";

interface Props {
    onClick: () => void;
    className?: string;
    text?: string;
}

export const PromoBanner: React.FC<Props> = ({
    onClick,
    className = "",
    text = "🔥 BẠN ĐÃ CÓ MÃ GIẢM GIÁ CHƯA? VÀO LẤY NGAY 🔥"
}) => {
    return (
        <button
            type="button"
            className={`w-full bg-linear-to-r from-red-600 to-orange-600 text-white text-center py-2 px-4 text-xs md:text-sm font-bold animate-pulse cursor-pointer hover:opacity-90 transition ${className}`}
            onClick={onClick}
        >
            {text}
        </button>
    );
};
