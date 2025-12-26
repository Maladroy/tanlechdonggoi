/** biome-ignore-all lint/a11y/noStaticElementInteractions: <NO> */
import { ArrowRight, Check, Flame, Maximize2, Percent, Plus, Share2, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Combo } from "../types";
import MarkdownRenderer from "./MarkdownRenderer";
import { Toast } from "./Toast";

interface Props {
    combo: Combo | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (combo: Combo & { selectedVariants?: Record<string, string> }, options?: { openCart?: boolean }) => void;
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
    const [showToast, setShowToast] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [currentImage, setCurrentImage] = useState<string>("");

    // Reset selection and image when combo changes
    useEffect(() => {
        if (combo) {
            setSelectedVariants({});
            setCurrentImage(combo.imageUrl);
        }
    }, [combo?.id, combo?.imageUrl]);

    // Update image based on variant selection
    useEffect(() => {
        if (combo?.variantImages && Object.keys(selectedVariants).length > 0) {
            // Check if any selected variant value has a matching image
            for (const value of Object.values(selectedVariants)) {
                if (combo.variantImages[value]) {
                    setCurrentImage(combo.variantImages[value]);
                    break; // Use the first match
                }
            }
        }
    }, [selectedVariants, combo?.variantImages]);

    if (!isOpen || !combo) return null;

    const handleCopyLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?product=${combo.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setShowToast(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddToCart = (openCart = true) => {
        // If it's a product and has variants, ensure all are selected
        if (combo.type === 'product' && combo.variants?.length) {
            const missing = combo.variants.find(v => !selectedVariants[v.name]);
            if (missing) {
                alert(`Vui lòng chọn ${missing.name}`);
                return;
            }
        }

        onAddToCart({
            ...combo,
            selectedVariants
        }, { openCart });

        // Show a small notification or toast if not opening cart?
        // For now relying on default behavior (App doesn't show toast, but we can assume user knows item added)
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
        >
            {/* Zoom Overlay */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setIsZoomed(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsZoomed(false)}
                >
                    <img
                        src={currentImage}
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

            <Toast
                message="Đã sao chép liên kết!"
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
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
                <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
                    {/* Image Section - Full Width */}
                    <div className="relative h-72 sm:h-96 w-full shrink-0 group bg-gray-100">
                        <img
                            src={currentImage || combo.imageUrl}
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
                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                                {combo.name}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl md:text-3xl font-bold text-orange-600">
                                    {combo.price.toLocaleString("vi-VN")}₫
                                </span>
                                {combo.originalPrice > combo.price && (
                                    <>
                                        <span className="text-base text-gray-400 line-through">
                                            {combo.originalPrice.toLocaleString("vi-VN")}₫
                                        </span>
                                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                                            -{Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <MarkdownRenderer content={combo.description} />

                        {/* Variant Selection */}
                        {combo.type === "product" && combo.variants && combo.variants.length > 0 && (
                            <div className="mb-8 space-y-4">
                                {combo.variants.map((variant) => (
                                    <div key={variant.name}>
                                        <h3 className="font-bold text-sm text-gray-800 mb-2">
                                            {variant.name}:
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {variant.values.map((val) => {
                                                const isSelected = selectedVariants[variant.name] === val;
                                                return (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: val }))}
                                                        className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium border transition-all ${isSelected
                                                            ? "bg-orange-600 text-white border-orange-600 shadow-md"
                                                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                                                            }`}
                                                    >
                                                        {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(!combo.type || combo.type === 'combo') && combo.items.length > 1 && (
                            <div className="bg-orange-50 rounded-xl p-5 my-8 border border-orange-100">
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
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100 pb-1">
                            <button
                                type="button"
                                onClick={() => handleAddToCart(false)}
                                className="cursor-pointer flex-1 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Thêm Vào Giỏ
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAddToCart(true)}
                                className="cursor-pointer flex-1 bg-gray-900 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Mua Ngay <ArrowRight size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                                title="Chia sẻ"
                            >
                                {copied ? (
                                    <Check size={20} className="text-green-600" />
                                ) : (
                                    <Share2 size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
