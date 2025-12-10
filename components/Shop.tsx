import { Clock, Plus, ShoppingCart, Tag } from "lucide-react";
import type React from "react";
import { useState, useMemo } from "react";
import type { Combo, UserProfile } from "../types";

interface Props {
  combos: Combo[];
  onOpenHunter: () => void;
  onAddToCart: (combo: Combo) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  user: UserProfile | null;
  onOpenProfile: () => void;
}

export const Shop: React.FC<Props> = ({
  combos,
  onOpenHunter,
  onAddToCart,
  cartItemCount,
  onOpenCart,
  user,
  onOpenProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");

  const categories = ["all", ...new Set(combos.map((c) => c.category).filter(Boolean) as string[])];

  const filteredCombos = useMemo(() => {
    let result = [...combos];
    if (selectedCategory !== "all") {
      result = result.filter((c) => c.category === selectedCategory);
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [combos, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-xl">
              T
            </div>
            <h1 className="font-bold text-gray-800 text-lg tracking-tight hidden md:block">
              Tân Lếch <span className="text-orange-600">Đóng Gói</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenHunter}
              className="flex items-center gap-1 bg-yellow-100 text-orange-700 px-3 py-2 rounded-full text-sm font-semibold hover:bg-yellow-200 transition"
            >
              <Tag size={16} /> <span className="hidden sm:inline">Săn Mã</span>
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-full py-1 px-3 hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || "K"}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                {user?.name || "Đăng nhập"}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-800"
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Promo Banner */}
      <button
        type="button"
        className="w-full bg-linear-to-r from-red-600 to-orange-600 text-white text-center py-2 px-4 text-xs md:text-sm font-bold animate-pulse cursor-pointer hover:opacity-90 transition"
        onClick={onOpenHunter}
      >
        🔥 BẠN ĐÃ CÓ MÃ GIẢM GIÁ CHƯA? VÀO LẤY NGAY 🔥
      </button>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Danh Sách Combo 📦
            </h2>
            <p className="text-gray-500 text-sm">
              Chốt đơn nhanh kẻo hết hàng ngon!
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.filter(c => c !== "all").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5"
            >
              <option value="default">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCombos.map((combo) => (
            <div
              key={combo.id}
              className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-visible hover:shadow-2xl transition-all duration-300 group flex flex-col"
            >
              {/* Off Percentage Badge */}
              {combo.originalPrice > combo.price && (
                <div className="absolute top-3 right-3 z-30 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                  -{Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)}%
                </div>
              )}

              {/* Coupon Bow/Banner */}
              {combo.coupon && (
                <div className="absolute -top-3 -right-3 z-20">
                  <div className="relative">
                    <div className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 shadow-lg transform rotate-6 rounded-md flex items-center gap-1 border-2 border-white">
                      <Tag size={12} fill="currentColor" />
                      MÃ: {combo.coupon}
                    </div>
                  </div>
                </div>
              )}

              <div className="relative h-56 overflow-hidden rounded-t-3xl">
                <img
                  src={combo.imageUrl}
                  alt={combo.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
                />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                  {combo.tags}
                </div>
                {/* Sale Timer */}
                {/* <div className="absolute bottom-3 right-3 bg-white/90 text-red-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-sm">
                  <Clock size={12} /> Flash Sale
                </div> */}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2">
                  <h3 className="font-bold text-xl text-gray-800 leading-snug group-hover:text-orange-600 transition">
                    {combo.name}
                  </h3>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {combo.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {combo.items.map((item, i) => (
                    <span
                      key={item.charAt(0) + String(i)}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200"
                    >
                      + {item}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    {combo.originalPrice > combo.price && (
                      <span className="text-gray-400 text-xs line-through decoration-red-500">
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

                  <button
                    type="button"
                    onClick={() => onAddToCart(combo)}
                    className="bg-gray-900 hover:bg-orange-600 text-white pl-5 pr-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-200 active:scale-95 flex items-center gap-2 group/btn"
                  >
                    Thêm Vào Giỏ
                    <Plus
                      size={18}
                      className="group-hover/btn:rotate-90 transition"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 bg-gray-100 text-center text-gray-400 text-sm rel-0 fixed bottom-0 w-full">
        <p>© 2025 Tân Lếch Đóng Gói. Chỉ bán Combo, không bán lẻ.</p>
      </footer>
    </div>
  );
};
