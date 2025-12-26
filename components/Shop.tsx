import { Flame, Percent, Plus, ShoppingCart, Tag } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { Category, Combo, UserProfile } from "../types";
import { PromoBanner } from "./PromoBanner";

interface Props {
  combos: Combo[];
  categories: Category[];
  onOpenHunter: () => void;
  onViewProduct: (combo: Combo) => void;
  onAddToCart: (combo: Combo) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  user: UserProfile | null;
  onOpenProfile: () => void;
}

export const Shop: React.FC<Props> = ({
  combos,
  categories,
  onOpenHunter,
  onViewProduct,
  onAddToCart,
  cartItemCount,
  onOpenCart,
  user,
  onOpenProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">(
    "default",
  );

  const categoryOptions = useMemo(() => {
    const uniqueIds = new Set(
      combos.map((c) => c.category).filter(Boolean) as string[],
    );
    const mapped = categories.filter((cat) => cat.id && uniqueIds.has(cat.id));
    return [{ id: "all", name: "Tất cả danh mục" }, ...mapped];
  }, [categories, combos]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
      <PromoBanner onClick={onOpenHunter} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 flex-1 w-full">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Danh Sách Sản Phẩm 📦
              </h2>
              <p className="text-gray-500 text-sm">
                Chốt đơn nhanh kẻo hết hàng ngon!
              </p>
            </div>

            <div className="flex gap-2">
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

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categoryOptions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === c.id
                  ? "bg-orange-600 text-white border-orange-600 shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border-gray-200"
                  }`}
              >
                {c.name}
              </button>
            ))}
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
                  -
                  {Math.round(
                    ((combo.originalPrice - combo.price) /
                      combo.originalPrice) *
                    100,
                  )}
                  %
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
                <button
                  type="button"
                  onClick={() => onViewProduct(combo)}
                  className="w-full h-full block cursor-pointer"
                >
                  <img
                    src={combo.imageUrl}
                    alt={combo.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
                  />
                </button>
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {combo.tags?.map((tag) => {
                    const lowerTag = tag.toLowerCase();
                    let className =
                      "text-xs font-bold px-2 py-1 rounded-md backdrop-blur-md flex items-center gap-1";
                    let icon = null;

                    if (lowerTag.includes("hot")) {
                      className += " bg-red-600 text-white shadow-sm";
                      icon = <Flame size={10} fill="currentColor" />;
                    } else if (
                      lowerTag.includes("giảm") ||
                      lowerTag.includes("sale") ||
                      lowerTag.includes("%")
                    ) {
                      className += " bg-yellow-400 text-yellow-900 shadow-sm";
                      icon = <Percent size={10} />;
                    } else {
                      className += " bg-black/60 text-white";
                    }

                    return (
                      <span key={tag} className={className}>
                        {icon} {tag}
                      </span>
                    );
                  })}
                </div>
                {/* Sale Timer */}
                {/* <div className="absolute bottom-3 right-3 bg-white/90 text-red-600 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-sm">
                  <Clock size={12} /> Flash Sale
                </div> */}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => onViewProduct(combo)}
                    className="font-bold text-xl text-gray-800 leading-snug group-hover:text-orange-600 transition text-left"
                  >
                    {combo.name}
                  </button>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {combo.description}
                </p>

                {combo.items.length > 1 && (
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
                )}

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
                    onClick={() => {
                      if (combo.type === "product" && combo.variants?.length) {
                        onViewProduct(combo);
                      } else {
                        onAddToCart(combo);
                      }
                    }}
                    className="cursor-pointer  bg-gray-900 hover:bg-orange-600 text-white pl-5 pr-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-200 active:scale-95 flex items-center gap-2 group/btn"
                  >
                    {combo.type === "product" && combo.variants?.length
                      ? "Chọn Phân Loại"
                      : "Thêm Vào Giỏ"}
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
      <footer className="mt-auto py-6 text-center text-gray-400 text-sm w-full border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <p>© 2025 Tân Lếch Đóng Gói.</p>
      </footer>
    </div>
  );
};
