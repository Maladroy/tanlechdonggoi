import { CheckCircle, X } from "lucide-react";
import type React from "react";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    isVisible,
    onClose,
    duration = 3000,
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
            <CheckCircle size={20} className="text-green-400" />
            <span className="font-bold text-sm">{message}</span>
            <button
                type="button"
                onClick={onClose}
                className="hover:bg-white/20 p-1 rounded-full transition"
            >
                <X size={16} />
            </button>
        </div>
    );
};
