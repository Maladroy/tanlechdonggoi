import { useForm } from "@tanstack/react-form";
import {
  AlertCircle,
  CheckCircle,
  Minus,
  Phone,
  Plus,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { auth, createOrder } from "../services/firebase";
import type { CartItem, Coupon, UserProfile } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  user: UserProfile | null;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  coupons: Coupon[]; // List of available coupons from DB
  onClearCart: () => void;
  onOrderSuccess: () => void;
}

export const Cart: React.FC<Props> = ({
  isOpen,
  onClose,
  cart,
  user,
  onRemove,
  onUpdateQuantity,
  coupons,
  onClearCart,
  onOrderSuccess,
}) => {
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponInput, setCouponInput] = useState("");

  // Form for Shipping Address
  const form = useForm({
    defaultValues: {
      address: "",
      city: "",
      zipCode: "",
    },
    onSubmit: async ({ value }) => {
      if (!user || !auth.currentUser) return;

      const { total } = calculateTotal();

      const success = await createOrder({
        userId: auth.currentUser.uid,
        user: user,
        items: cart,
        total: total,
        createdAt: new Date().toISOString(),
        status: "pending",
        appliedCoupon: appliedCoupon ? appliedCoupon.code : null, // Fix: Firestore doesn't accept undefined
        shippingAddress: {
          street: value.address,
          city: value.city,
          zipCode: value.zipCode,
        },
      });

      if (success) {
        onClearCart();
        onOrderSuccess();
      }
    },
  });

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const calculateDiscount = (
    cartItems: CartItem[],
    coupon: Coupon | null
  ): number => {
    if (!coupon) return 0;

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date()) return 0;

    // If coupon is restricted to specific combos, require at least one eligible item
    if (coupon.applicableCombos && coupon.applicableCombos.length > 0) {
      const hasEligibleItem = cartItems.some((item) =>
        coupon.applicableCombos?.includes(item.id)
      );
      if (!hasEligibleItem) return 0;
    }

    let discount = 0;

    if (coupon.type === "percent" && coupon.value) {
      discount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === "fixed" && coupon.value) {
      discount = coupon.value;
    }

    // Always apply coupon on the order subtotal (not per item)
    return Math.min(discount, subtotal);
  };

  const calculateTotal = () => {
    const discount = calculateDiscount(cart, appliedCoupon);
    return {
      subtotal,
      discountAmount: discount,
      total: subtotal - discount,
    };
  };

  const { discountAmount, total } = calculateTotal();

  const handleApplyCoupon = () => {
    if (!couponInput) return;
    const found = coupons.find(
      (c) => c.code.toUpperCase() === couponInput.toUpperCase()
    );

    if (found) {
      // Basic validation
      if (new Date(found.expiryDate) < new Date()) {
        setCouponError("Mã này đã hết hạn!");
        setAppliedCoupon(null);
        return;
      }

      // Check if applicable
      if (found.applicableCombos && found.applicableCombos.length > 0) {
        const hasItem = cart.some(item => found.applicableCombos?.includes(item.id));
        if (!hasItem) {
          setCouponError("Mã này không áp dụng cho các sản phẩm trong giỏ!");
          setAppliedCoupon(null);
          return;
        }
      }

      setAppliedCoupon(found);
      setCouponError("");
      setCouponInput("");
    } else {
      setCouponError("Mã không tồn tại!");
      setAppliedCoupon(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-xl text-gray-800">
            Giỏ Hàng ({cart.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingCartIcon />
              <p>Chưa có gì đâu, ra lựa combo đi!</p>
              <button
                type="button"
                onClick={onClose}
                className="text-orange-600 font-bold hover:underline"
              >
                Quay lại mua sắm
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3 border border-gray-100 rounded-xl bg-white shadow-sm"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="font-bold text-orange-600">
                      {item.price.toLocaleString("vi-VN")}₫
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-100 rounded-l-lg text-gray-600 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold text-gray-800 px-2 min-w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-100 rounded-r-lg text-gray-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Show if coupon applies to this specific item */}
                  {appliedCoupon?.applicableCombos?.includes(item.id) && (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Ticket size={12} />
                      Được giảm giá bởi mã {appliedCoupon.code}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* Coupon Section */}
            <div className="mb-6">
              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg text-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span className="font-medium text-sm">
                      Đã dùng: <strong>{appliedCoupon.code}</strong>
                      <span className="block text-xs font-normal text-green-600">
                        {appliedCoupon.desc}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Gỡ bỏ
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        placeholder="Nhập mã giảm giá"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 uppercase"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={12} /> {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{discountAmount.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end mb-4">
              <span className="font-bold text-gray-900 text-lg">Tổng cộng</span>
              <span className="font-black text-2xl text-orange-600">
                {total.toLocaleString("vi-VN")}₫
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <CheckCircle size={16} className="text-orange-600" />
                  Thông tin giao hàng
                </h4>

                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Người nhận: <strong>{user?.name} - {user?.phone}</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  <form.Field
                    name="address"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? "Vui lòng nhập địa chỉ" : undefined,
                    }}
                  >
                    {(field) => (
                      <>
                        <input
                          type="text"
                          aria-label="Địa chỉ chi tiết"
                          autoComplete="on"
                          placeholder="Địa chỉ chi tiết (Số nhà, đường...)"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={`w-full p-2 border rounded-lg text-sm ${field.state.meta.errors.length
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                            }`}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </>
                    )}
                  </form.Field>

                  <div className="flex gap-2">
                    <form.Field
                      name="city"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Nhập TP" : undefined,
                      }}
                    >
                      {(field) => (
                        <div className="flex-1">
                          <input
                            autoComplete="on"
                            type="text"
                            placeholder="Tỉnh / Thành phố"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={`w-full p-2 border rounded-lg text-sm ${field.state.meta.errors.length
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                              }`}
                          />
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name="zipCode"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Nhập Zip" : undefined,
                      }}
                    >
                      {(field) => (
                        <div className="w-1/3">
                          <input
                            autoComplete="on"
                            type="text"
                            placeholder="Zipcode"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={`w-full p-2 border rounded-lg text-sm ${field.state.meta.errors.length
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                              }`}
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
              </div>

              {/* Call to Order Info */}
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-800">
                  <Phone size={18} />
                  <span className="text-sm font-bold">Gọi đặt mua:</span>
                </div>
                <a
                  href="tel:0901234567"
                  className="text-orange-600 font-black text-lg hover:underline"
                >
                  090.123.4567
                </a>
              </div>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className={`w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 ${!canSubmit || isSubmitting
                      ? "opacity-80 cursor-not-allowed"
                      : ""
                      }`}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Đặt Hàng Ngay"}
                  </button>
                )}
              </form.Subscribe>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const ShoppingCartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-200"
  >
    <title>Shopping Cart</title>
    <circle cx="8" cy="21" r="1"></circle>
    <circle cx="19" cy="21" r="1"></circle>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
  </svg>
);
