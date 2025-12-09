import type React from "react";
import { useState } from "react";
import type { CartItem, UserProfile } from "../types";
import {
	X,
	Trash2,
	Ticket,
	CheckCircle,
	AlertCircle,
	Phone,
	Check,
} from "lucide-react";
import { createOrder } from "../services/firebase";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	cart: CartItem[];
	user: UserProfile | null;
	onRemove: (id: string) => void;
	appliedCode: string | null;
	onApplyCode: (code: string) => boolean; // returns success
	onRemoveCode: () => void;
	onClearCart: () => void;
}

export const Cart: React.FC<Props> = ({
	isOpen,
	onClose,
	cart,
	user,
	onRemove,
	appliedCode,
	onApplyCode,
	onRemoveCode,
	onClearCart,
}) => {
	const [codeInput, setCodeInput] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [orderSuccess, setOrderSuccess] = useState(false);

	const subtotal = cart.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);

	// Simple discount logic for demo
	let discountAmount = 0;
	if (appliedCode) {
		if (appliedCode.toUpperCase().includes("50")) discountAmount = 50000;
		else if (appliedCode.toUpperCase().includes("VIP"))
			discountAmount = subtotal * 0.3;
		else if (appliedCode.toUpperCase().includes("FREE"))
			discountAmount = 15000; // Fake ship deduction
		else discountAmount = subtotal * 0.1;
	}

	// Cap discount
	if (discountAmount > subtotal) discountAmount = subtotal;

	const finalTotal = subtotal - discountAmount;

	const handleApply = () => {
		if (!codeInput) return;
		const success = onApplyCode(codeInput);
		if (success) {
			setErrorMsg("");
			setCodeInput("");
		} else {
			setErrorMsg("Mã này không hợp lệ hoặc đã hết hạn!");
		}
	};

	const handleCheckout = async () => {
		if (!user) return;
		setIsSubmitting(true);

		// Simulate API call
		const success = await createOrder({
			user: user,
			items: cart,
			total: finalTotal,
			createdAt: new Date().toISOString(),
			status: "pending",
			appliedCoupon: appliedCode || undefined,
		});

		setIsSubmitting(false);
		if (success) {
			setOrderSuccess(true);
			onClearCart();
		}
	};

	const handleCloseSuccess = () => {
		setOrderSuccess(false);
		onClose();
	};

	if (!isOpen) return null;

	// SUCCESS VIEW
	if (orderSuccess) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					onClick={handleCloseSuccess}
				></div>
				<div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-float">
					<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<Check size={40} className="text-green-600" />
					</div>
					<h2 className="text-2xl font-black text-gray-900 mb-2">
						Đặt Hàng Thành Công!
					</h2>
					<p className="text-gray-500 mb-6">
						Cảm ơn <strong>{user?.name}</strong>. Nhân viên Tấn Lệch sẽ liên hệ
						qua số điện thoại{" "}
						<strong className="text-orange-600">{user?.phone}</strong> để chốt
						đơn trong ít phút nữa.
					</p>

					<div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
						<p className="text-xs text-orange-800 font-bold flex items-center justify-center gap-2">
							<Phone size={14} /> Hỗ trợ: 090.123.4567
						</p>
					</div>

					<button
						onClick={handleCloseSuccess}
						className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
					>
						Đã Hiểu, Cảm Ơn Shop!
					</button>
				</div>
			</div>
		);
	}

	// CART VIEW
	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			></div>

			{/* Drawer */}
			<div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
				<div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
					<h2 className="font-bold text-xl text-gray-800">
						Giỏ Hàng ({cart.length})
					</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-200 rounded-full transition"
					>
						<X size={24} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{cart.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
							<ShoppingCartIcon />
							<p>Chưa có gì đâu, ra lựa combo đi!</p>
							<button
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
									<p className="text-gray-500 text-xs mt-1 line-clamp-1">
										{item.items.join(", ")}
									</p>
									<div className="mt-2 flex justify-between items-center">
										<span className="font-bold text-orange-600">
											{item.price.toLocaleString("vi-VN")}₫
										</span>
										<div className="flex items-center gap-3">
											<span className="text-sm text-gray-600">
												x{item.quantity}
											</span>
											<button
												onClick={() => onRemove(item.id)}
												className="text-gray-400 hover:text-red-500"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>

				{cart.length > 0 && (
					<div className="p-5 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
						{/* Coupon Section */}
						<div className="mb-6">
							{appliedCode ? (
								<div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg text-green-800">
									<div className="flex items-center gap-2">
										<CheckCircle size={18} />
										<span className="font-medium text-sm">
											Đã dùng: <strong>{appliedCode}</strong>
										</span>
									</div>
									<button
										onClick={onRemoveCode}
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
												value={codeInput}
												onChange={(e) => setCodeInput(e.target.value)}
											/>
										</div>
										<button
											onClick={handleApply}
											className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
										>
											Áp dụng
										</button>
									</div>
									{errorMsg && (
										<p className="text-red-500 text-xs mt-2 flex items-center gap-1">
											<AlertCircle size={12} /> {errorMsg}
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
								{finalTotal.toLocaleString("vi-VN")}₫
							</span>
						</div>

						<div className="space-y-3">
							<div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 flex items-start gap-2">
								<AlertCircle size={16} className="shrink-0 mt-0.5" />
								<span>
									Thông tin nhận hàng:{" "}
									<strong>
										{user?.name} - {user?.phone}
									</strong>
								</span>
							</div>

							<button
								onClick={handleCheckout}
								disabled={isSubmitting}
								className={`w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 ${isSubmitting ? "opacity-80 cursor-wait" : ""}`}
							>
								{isSubmitting ? <>Đang xử lý...</> : <>Đặt Hàng Ngay</>}
							</button>
						</div>
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
		<circle cx="8" cy="21" r="1"></circle>
		<circle cx="19" cy="21" r="1"></circle>
		<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
	</svg>
);
