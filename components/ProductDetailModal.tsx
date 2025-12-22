import { Check, Copy, Flame, Maximize2, Percent, Plus, Share2, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Combo } from "../types";

interface Props {
    combo: Combo | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (combo: Combo) => void;
}

const TagBadge = ({ tag }: { tag: string }) => {
    const lowerTag = tag.toLowerCase();
    let className =
        "text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1";

    if (lowerTag.includes("hot")) {
        className += " bg-red-600 text-white shadow-red-200";
        return (
            <span className={className}>
                <Flame size={12} fill="currentColor" /> {tag}
            </span>
        );
    }
    if (
        lowerTag.includes("giảm") ||
        lowerTag.includes("sale") ||
        lowerTag.includes("%")
    ) {
        className += " bg-yellow-400 text-yellow-900 shadow-yellow-200";
        return (
            <span className={className}>
                <Percent size={12} /> {tag}
            </span>
        );
    }

    className += " bg-black/60 text-white";
    return <span className={className}>{tag}</span>;
};

export const ProductDetailModal: React.FC<Props> = ({
    combo,
    isOpen,
    onClose,
    onAddToCart,
}) => {
    const [copied, setCopied] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    if (!isOpen || !combo) return null;

    const handleCopyLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?product=${combo.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Zoom Overlay */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setIsZoomed(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsZoomed(false)}
                >
                    <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="max-w-full max-h-full object-contain"
                    />
                    <button
                        type="button"
                        className="absolute top-4 right-4 text-white p-2"
                        onClick={() => setIsZoomed(false)}
                    >
                        <X size={32} />
                    </button>
                </div>
            )}

            <div
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                    <X size={20} />
                </button>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto flex-1">
                    {/* Image Section - Full Width */}
                    <div className="relative h-72 sm:h-96 w-full shrink-0 group bg-gray-100">
                        <img
                            src={combo.imageUrl}
                            alt={combo.name}
                            className="w-full h-full object-cover cursor-zoom-in"
                            onClick={() => setIsZoomed(true)}
                        />

                        {/* Zoom Hint */}
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none">
                            <Maximize2 size={20} />
                        </div>

                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            {combo.tags?.map((tag) => (
                                <TagBadge key={tag} tag={tag} />
                            ))}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 md:p-8">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                {combo.name}
                            </h2>
                            <div className="flex flex-col items-end shrink-0">
                                {combo.originalPrice > combo.price && (
                                    <span className="text-gray-400 text-sm line-through decoration-red-500">
                                        {combo.originalPrice.toLocaleString("vi-VN")}₫
                                    </span>
                                )}
                                <span className="text-2xl font-black text-gray-900">
                                    {combo.price.toLocaleString("vi-VN")}
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                        vnđ
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-600 mb-8 whitespace-pre-line">
                            {combo.description}
                        </div>

                        <div className="bg-orange-50 rounded-xl p-5 mb-8 border border-orange-100">
                            <h3 className="font-bold text-sm text-orange-900 uppercase tracking-wider mb-3">
                                Bao gồm trong combo:
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {combo.items.map((item, i) => (
                                    <li
                                        key={item.charAt(0) + String(i)}
                                        className="flex items-center gap-3 text-sm text-gray-800 bg-white p-3 rounded-lg border border-orange-100 shadow-sm"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => onAddToCart(combo)}
                                className="flex-1 bg-gray-900 hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Thêm Vào Giỏ <Plus size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check size={20} className="text-green-600" /> Đã chép
                                    </>
                                ) : (
                                    <>
                                        <Share2 size={20} /> Chia sẻ
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
