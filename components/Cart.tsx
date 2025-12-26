import { useForm } from "@tanstack/react-form";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	ChevronRight,
	Loader2,
	MapPin,
	Minus,
	Phone,
	Plus,
	ShoppingBag,
	Ticket,
	Trash2,
	User,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { auth, createOrder, getOrdersByUser } from "../services/firebase";
import type { CartItem, Coupon, UserProfile } from "../types";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	cart: CartItem[];
	user: UserProfile | null;
	onRemove: (id: string, selectedVariants?: Record<string, string>) => void;
	onUpdateQuantity: (
		id: string,
		delta: number,
		selectedVariants?: Record<string, string>,
	) => void;
	coupons: Coupon[];
	initialCouponCode?: string | null;
	onClearCart: () => void;
	onOrderSuccess: () => void;
	onLoginRedirect: () => void;
}

type CartStep = "cart" | "checkout";

export const Cart: React.FC<Props> = ({
	isOpen,
	onClose,
	cart,
	user,
	onRemove,
	onUpdateQuantity,
	coupons,
	initialCouponCode,
	onClearCart,
	onOrderSuccess,
	onLoginRedirect,
}) => {
	const [step, setStep] = useState<CartStep>("cart");
	const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
	const [couponError, setCouponError] = useState("");
	const [couponInput, setCouponInput] = useState("");
	const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
	const [hasAutoApplied, setHasAutoApplied] = useState(false);
	const [isCoolingDown, setIsCoolingDown] = useState(false);
	const COOLDOWN_TIME = 60000; // 60 seconds

	// Form logic
	const form = useForm({
		defaultValues: {
			name: user?.name || "",
			phone: user?.phone || "",
			address: "",
			city: "",
			zipCode: "",
		},
		onSubmit: async ({ value }) => {
			// Check cooldown
			const lastOrder = localStorage.getItem("lastOrderTime");
			if (lastOrder && Date.now() - Number.parseInt(lastOrder, 10) < COOLDOWN_TIME) {
				// eslint-disable-next-line no-alert
				alert("Vui lòng đợi 1 phút trước khi đặt đơn tiếp theo!");
				return;
			}

			const { total } = calculateTotal();
			let orderUser = user;
			let userId = auth.currentUser?.uid;

			if (!orderUser) {
				orderUser = { name: value.name, phone: value.phone };
				userId = "guest";
			}

			if (!userId || !orderUser) return;

			const success = await createOrder({
				userId: userId,
				user: orderUser,
				items: cart,
				total: total,
				createdAt: new Date().toISOString(),
				status: "pending",
				appliedCoupon: appliedCoupon?.code ?? null,
				shippingAddress: {
					street: value.address,
					city: value.city,
					zipCode: value.zipCode,
				},
			});

			if (success) {
				localStorage.setItem("lastOrderTime", Date.now().toString());
				setIsCoolingDown(true);
				setTimeout(() => setIsCoolingDown(false), COOLDOWN_TIME);

				onClearCart();
				onOrderSuccess();
				setStep("cart"); // Reset step
			}
		},
	});

	// Calculations
	const subtotal = cart.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);

	const calculateDiscount = (
		cartItems: CartItem[],
		coupon: Coupon | null,
		subTotal: number,
	): number => {
		if (!coupon) return 0;
		if (new Date(coupon.expiryDate) < new Date()) return 0;
		if (
			coupon.applicableCombos?.length &&
			!cartItems.some((item) => coupon.applicableCombos?.includes(item.id))
		) {
			return 0;
		}

		let discount = 0;
		if (coupon.type === "percent" && coupon.value) {
			discount = (subTotal * coupon.value) / 100;
		} else if (coupon.type === "fixed" && coupon.value) {
			discount = coupon.value;
		}
		return Math.min(discount, subTotal);
	};

	const calculateTotal = () => {
		const discount = calculateDiscount(cart, appliedCoupon, subtotal);
		return { discountAmount: discount, total: subtotal - discount };
	};

	const { discountAmount, total } = calculateTotal();

	// Coupon Logic
	const handleApplyCoupon = useCallback(
		async (codeOverride?: string, silent = false) => {
			const code = codeOverride || couponInput;
			if (!code) return;
			setIsValidatingCoupon(true);
			setCouponError("");

			try {
				const found = coupons.find(
					(c) => c.code.toUpperCase() === code.toUpperCase(),
				);
				if (!found) throw new Error("Mã không tồn tại!");
				if (new Date(found.expiryDate) < new Date())
					throw new Error("Mã này đã hết hạn!");

				if (found.applicableCombos?.length) {
					const hasItem = cart.some((item) =>
						found.applicableCombos?.includes(item.id),
					);
					if (!hasItem) throw new Error("Mã không áp dụng cho sản phẩm này!");
				}

				if (user) {
					if (user.usedCoupons?.includes(found.code))
						throw new Error("Bạn đã dùng mã này rồi!");
					if (found.isNewUserOnly) {
						const orders = await getOrdersByUser(auth.currentUser?.uid || "");
						if (orders.filter((o) => o.status !== "cancelled").length > 0) {
							throw new Error("Mã chỉ dành cho khách mới!");
						}
					}
				} else {
					if (found.isNewUserOnly || found.maxUsesPerUser)
						throw new Error("Vui lòng đăng nhập để dùng mã này!");
				}

				setAppliedCoupon(found);
				if (!codeOverride) setCouponInput("");
			} catch (e: unknown) {
				const error = e as Error;
				if (!silent) {
					setCouponError(error.message || "Lỗi kiểm tra mã");
				}
				setAppliedCoupon(null);
			} finally {
				setIsValidatingCoupon(false);
			}
		},
		[couponInput, coupons, cart, user],
	);

	// Effects
	useEffect(() => {
		if (!isOpen) {
			setHasAutoApplied(false);
		} else {
			// Check cooldown when opening
			const lastOrder = localStorage.getItem("lastOrderTime");
			if (
				lastOrder &&
				Date.now() - Number.parseInt(lastOrder) < COOLDOWN_TIME
			) {
				setIsCoolingDown(true);
				const remaining =
					COOLDOWN_TIME - (Date.now() - Number.parseInt(lastOrder));
				setTimeout(() => setIsCoolingDown(false), remaining);
			}
		}
	}, [isOpen]);

	useEffect(() => {
		const tryAutoApply = async () => {
			if (
				!(
					isOpen &&
					!appliedCoupon &&
					!hasAutoApplied &&
					user?.ownedCoupons?.length &&
					cart.length > 0
				)
			)
				return;
			for (const code of user.ownedCoupons) {
				if (user.usedCoupons?.includes(code)) continue;
				await handleApplyCoupon(code, true);
				if (appliedCoupon) break;
			}
			setHasAutoApplied(true);
		};
		tryAutoApply();
	}, [isOpen, appliedCoupon, hasAutoApplied, user, cart, handleApplyCoupon]);

	useEffect(() => {
		if (isOpen && initialCouponCode && !appliedCoupon) {
			setCouponInput(initialCouponCode);
			handleApplyCoupon(initialCouponCode);
		}
	}, [isOpen, initialCouponCode, appliedCoupon, handleApplyCoupon]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			{/* Overlay */}
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				aria-label="Close cart"
			/>

			{/* Slide-over Panel */}
			<div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
				{/* HEADER */}
				<div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0 z-10">
					<div className="flex items-center gap-3">
						{step === "checkout" && (
							<button
								type="button"
								onClick={() => setStep("cart")}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
							>
								<ArrowLeft size={20} className="text-gray-600" />
							</button>
						)}
						<h2 className="font-bold text-xl text-gray-800">
							{step === "cart" ? `Giỏ Hàng (${cart.length})` : "Thanh Toán"}
						</h2>

					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				{/* BODY CONTENT - Scrollable Area */}
				<div className="flex-1 overflow-y-auto bg-gray-50">
					{cart.length === 0 ? (
						<EmptyCartView onClose={onClose} />
					) : (
						<div className="p-4 space-y-4">
							{/* STEP 1: CART LIST */}
							{step === "cart" && (
								<>
									<div className="space-y-3">
										{cart.map((item) => (
											<CartItemRow
												key={item.id}
												item={item}
												appliedCoupon={appliedCoupon}
												onUpdateQuantity={onUpdateQuantity}
												onRemove={onRemove}
											/>
										))}
									</div>

									{/* Coupon Input Section */}
									<div className="mt-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
										<CouponSection
											user={user}
											appliedCoupon={appliedCoupon}
											setAppliedCoupon={setAppliedCoupon}
											couponInput={couponInput}
											setCouponInput={setCouponInput}
											isValidatingCoupon={isValidatingCoupon}
											handleApplyCoupon={handleApplyCoupon}
											couponError={couponError}
											onLoginRedirect={onLoginRedirect}
										/>
									</div>
								</>
							)}

							{/* STEP 2: CHECKOUT FORM */}
							{step === "checkout" && (
								<div className="animate-fade-in space-y-4">
									{/* Mini Order Summary */}
									<div className="bg-white p-4 rounded-xl border border-gray-200">
										<div className="flex justify-between text-sm text-gray-500 mb-2">
											<span>Tạm tính ({cart.length} món)</span>
											<span>{subtotal.toLocaleString("vi-VN")}₫</span>
										</div>
										{discountAmount > 0 && (
											<div className="flex justify-between text-sm text-green-600 mb-2">
												<span>Giảm giá</span>
												<span>-{discountAmount.toLocaleString("vi-VN")}₫</span>
											</div>
										)}
										<div className="border-t border-dashed pt-2 flex justify-between font-bold text-gray-900">
											<span>Tổng thanh toán</span>
											<span className="text-orange-600">
												{total.toLocaleString("vi-VN")}₫
											</span>
										</div>
									</div>

									{/* Shipping Form */}
									<form
										id="checkout-form"
										onSubmit={(e) => {
											e.preventDefault();
											e.stopPropagation();
											form.handleSubmit();
										}}
										className="space-y-4"
									>
										<div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm">
											<h4 className="font-bold text-gray-800 text-sm flex items-center gap-2 pb-2 border-b border-gray-100">
												<MapPin size={18} className="text-orange-600" />
												Thông tin giao hàng
											</h4>

											{!user && (
												<>
													<FormField
														field={form}
														name="name"
														placeholder="Họ và tên"
														icon={<User size={16} />}
														required
													/>
													<FormField
														field={form}
														name="phone"
														placeholder="Số điện thoại"
														type="tel"
														icon={<Phone size={16} />}
														required
													/>
												</>
											)}

											{user && (
												<div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex gap-2">
													<User size={16} className="mt-0.5" />
													<span>
														Người nhận: <strong>{user.name}</strong> -{" "}
														{user.phone}
													</span>
												</div>
											)}

											<FormField
												field={form}
												name="address"
												placeholder="Địa chỉ (Số nhà, đường...)"
												required
											/>

											<div className="flex gap-3">
												<div className="flex-1">
													{/* <FormField field={form} name="city" placeholder="Tỉnh / TP" required /> */}
													<form.Field
														name="city"
														validators={{
															onChange: ({ value }: { value: string }) => {
																if (!value)
																	return "Vui lòng nhập Tỉnh/Thành phố";
																if (value.length < 2)
																	return "Vui lòng nhập tỉnh/thành phố";
																return undefined;
															},
														}}
													>
														{(field: any) => (
															<div>
																<select
																	value={field.state.value}
																	onBlur={field.handleBlur}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																	className={`w-full pl-3 pr-3 py-2.5 border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${field.state.meta.errors.length
																		? "border-red-300 bg-red-50 text-red-900 placeholder:text-red-300"
																		: "border-gray-200 bg-gray-50"
																		}`}
																>
																	<option value="" disabled>
																		Chọn Tỉnh / Thành phố
																	</option>
																	{provinces.map((prov) => (
																		<option key={prov} value={prov}>
																			{prov}
																		</option>
																	))}
																</select>
																{field.state.meta.errors.length > 0 && (
																	<p className="text-[10px] text-red-500 mt-1 ml-1">
																		{field.state.meta.errors[0]}
																	</p>
																)}
															</div>
														)}
													</form.Field>
												</div>
												<div className="w-1/3">
													<FormField
														field={form}
														name="zipCode"
														placeholder="Zip"
														required
													/>
												</div>
											</div>
										</div>
									</form>
								</div>
							)}
						</div>
					)}
				</div>

				{/* FOOTER - Sticky Bottom */}
				{cart.length > 0 && (
					<div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
						{step === "cart" ? (
							// CART FOOTER
							<div className="space-y-3">
								<div className="flex justify-between items-end">
									<div>
										<p className="text-xs text-gray-500">Tổng cộng</p>
										<p className="text-2xl font-black text-gray-900 leading-none">
											{total.toLocaleString("vi-VN")}₫
										</p>
										{discountAmount > 0 && (
											<p className="text-xs text-green-600 font-medium mt-1">
												Đã tiết kiệm {discountAmount.toLocaleString("vi-VN")}₫
											</p>
										)}
									</div>
									<div className="text-right">
										<p className="text-xs text-gray-400 mb-1">
											Chưa bao gồm phí ship
										</p>
									</div>
								</div>
								<div className="grid grid-cols-12 gap-3">
									<button
										type="button"
										onClick={() => setStep("checkout")}
										className="col-span-10 cursor-pointer w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
									>
										Tiến hành đặt hàng <ChevronRight size={18} />
									</button>

									{step === "cart" && cart.length > 0 && (
										<button
											type="button"
											onClick={() => {
												if (window.confirm("Bạn có chắc muốn xóa hết giỏ hàng không?")) {
													onClearCart();
												}
											}}
											/* Đã thêm: flex items-center justify-center */
											className="col-span-2 flex items-center justify-center py-2 px-1 text-red-500 bg-red-50 rounded-xl transition-colors cursor-pointer hover:bg-red-100 hover:text-red-600"
											title="Xóa hết giỏ hàng"
										>
											<Trash2 size={20} />
										</button>
									)}
								</div>

							</div>
						) : (
							// CHECKOUT FOOTER
							<div className="space-y-3">
								<form.Subscribe
									selector={(state) => [state.canSubmit, state.isSubmitting]}
								>
									{([canSubmit, isSubmitting]) => (
										<button
											type="submit"
											form="checkout-form" // Links to the form ID above
											disabled={!canSubmit || isSubmitting || isCoolingDown}
											className={`cursor-pointer w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 ${!canSubmit || isSubmitting || isCoolingDown
												? "opacity-70 cursor-not-allowed"
												: ""
												}`}
										>
											{isSubmitting ? (
												<Loader2 size={20} className="animate-spin" />
											) : isCoolingDown ? (
												"Vui lòng đợi..."
											) : (
												"Xác nhận đặt hàng"
											)}
										</button>
									)}
								</form.Subscribe>
								<button
									type="button"
									onClick={() => setStep("cart")}
									className="w-full text-gray-500 text-sm font-medium hover:text-gray-800 py-2 cursor-pointer"
								>
									<ArrowLeft className="inline mr-1" />
									Quay lại giỏ hàng
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

// --- Sub Components for cleaner code ---

const EmptyCartView = ({ onClose }: { onClose: () => void }) => (
	<div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 p-8 text-center">
		<div className="bg-gray-100 p-6 rounded-full">
			<ShoppingBag size={48} className="text-gray-300" />
		</div>
		<div>
			<h3 className="text-gray-900 font-bold text-lg">Giỏ hàng trống</h3>
			<p className="text-sm mt-1">Chưa có gì đâu, ra lựa combo đi!</p>
		</div>
		<button
			type="button"
			onClick={onClose}
			className="px-6 py-2 bg-white border border-gray-300 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
		>
			Quay lại mua sắm
		</button>
	</div>
);

const CartItemRow = ({
	item,
	appliedCoupon,
	onUpdateQuantity,
	onRemove,
}: {
	item: CartItem;
	appliedCoupon: Coupon | null;
	onUpdateQuantity: (
		id: string,
		delta: number,
		selectedVariants?: Record<string, string>,
	) => void;
	onRemove: (id: string, selectedVariants?: Record<string, string>) => void;
}) => {
	const displayImage = (() => {
		if (item.variantImages && item.selectedVariants) {
			for (const value of Object.values(item.selectedVariants)) {
				if (item.variantImages[value]) return item.variantImages[value];
			}
		}
		return item.imageUrl;
	})();

	return (
		<div className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm transition hover:shadow-md">
			<div className="relative w-20 h-20 shrink-0">
				<img
					src={displayImage}
					alt={item.name}
					className="w-full h-full object-cover rounded-lg bg-gray-50"
				/>
				{appliedCoupon?.applicableCombos?.includes(item.id) && (
					<div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-sm cursor-pointer">
						<Ticket size={10} />
					</div>
				)}
			</div>
			<div className="flex-1 flex flex-col justify-between min-w-0">
				<div>
					<h3 className="font-bold text-gray-800 text-sm truncate">
						{item.name}
					</h3>
					{item.selectedVariants &&
						Object.keys(item.selectedVariants).length > 0 && (
							<div className="flex flex-wrap gap-1 mt-1">
								{Object.entries(item.selectedVariants).map(([key, value]) => (
									<span
										key={key}
										className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
									>
										{value}
									</span>
								))}
							</div>
						)}
					<p className="text-orange-600 font-bold text-sm mt-0.5">
						{item.price.toLocaleString("vi-VN")}₫
					</p>
				</div>
				<div className="flex justify-between items-center gap-2">
					<div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
						<button
							type="button"
							onClick={() =>
								onUpdateQuantity(item.id, -1, item.selectedVariants)
							}
							disabled={item.quantity <= 1}
							className="p-1.5 hover:bg-white rounded-md text-gray-600 disabled:opacity-30 shadow-sm transition-all cursor-pointer"
						>
							<Minus size={12} />
						</button>
						<span className="text-sm font-bold text-gray-800 w-6 text-center">
							{item.quantity}
						</span>
						<button
							type="button"
							onClick={() => onUpdateQuantity(item.id, 1, item.selectedVariants)}
							className="p-1.5 hover:bg-white rounded-md text-gray-600 shadow-sm transition-all cursor-pointer"
						>
							<Plus size={12} />
						</button>
					</div>
					<button
						type="button"
						onClick={() => onRemove(item.id, item.selectedVariants)}
						className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
					>
						<Trash2 size={16} />
					</button>
				</div>
			</div>
		</div>
	);
};

const CouponSection = ({
	user,
	appliedCoupon,
	setAppliedCoupon,
	couponInput,
	setCouponInput,
	isValidatingCoupon,
	handleApplyCoupon,
	couponError,
	onLoginRedirect,
}: any) => {
	if (!user) {
		return (
			<div className="flex gap-3 items-start text-sm">
				<div className="bg-blue-100 p-2 rounded-lg text-blue-600">
					<AlertCircle size={20} />
				</div>
				<div>
					<button
						type="button"
						onClick={onLoginRedirect}
						className="cursor-pointer font-bold text-gray-800 hover:text-orange-600 underline text-left"
					>
						Đăng nhập để giảm giá
					</button>
					<p className="text-gray-500 text-xs mt-1">
						Thành viên mới giảm 20% cho đơn đầu tiên.
					</p>
				</div>
			</div>
		);
	}

	if (appliedCoupon) {
		return (
			<div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg text-green-800">
				<div className="flex items-center gap-2 overflow-hidden">
					<CheckCircle size={18} className="shrink-0" />
					<div className="truncate">
						<span className="font-bold text-sm block">
							{appliedCoupon.code}
						</span>
						<span className="text-xs text-green-600 truncate block">
							{appliedCoupon.desc}
						</span>
					</div>
				</div>
				<button
					type="button"
					onClick={() => setAppliedCoupon(null)}
					className="shrink-0 text-xs bg-white px-2 py-1 rounded border border-green-200 hover:border-red-300 hover:text-red-500 transition"
				>
					Gỡ
				</button>
			</div>
		);
	}

	return (
		<div>
			<label
				htmlFor="coupon-input"
				className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block"
			>
				Mã giảm giá
			</label>
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Ticket
						className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						size={16}
					/>
					<input
						id="coupon-input"
						type="text"
						placeholder="NHAPMA"
						className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase transition-all"
						value={couponInput}
						onChange={(e) => setCouponInput(e.target.value)}
						disabled={isValidatingCoupon}
					/>
				</div>
				<button
					type="button"
					onClick={() => handleApplyCoupon()}
					disabled={isValidatingCoupon || !couponInput}
					className="bg-gray-900 text-white px-4 rounded-lg text-sm font-bold hover:bg-black disabled:opacity-70 transition-colors"
				>
					{isValidatingCoupon ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						"Áp dụng"
					)}
				</button>
			</div>
			{couponError && (
				<p className="text-red-500 text-xs mt-2 flex items-center gap-1">
					<AlertCircle size={12} /> {couponError}
				</p>
			)}
		</div>
	);
};

const fieldMap = {
	name: "Tên",
	phone: "Số điện thoại",
	city: "Tỉnh/Thành phố",
	address: "Địa chỉ",
	zipCode: "Mã zip",
};

const provinces = [
	"Hà Nội",
	"TP Hồ Chí Minh",
	"Đà Nẵng",
	"Hải Phòng",
	"Cần Thơ",
	"An Giang",
	"Bình Dương",
	"Bình Phước",
	"Bình Thuận",
	"Bình Định",
	"Bà Rịa - Vũng Tàu",
	"Cà Mau",
	"Đắk Lắk",
	"Đắk Nông",
	"Điện Biên",
	"Gia Lai",
	"Hà Giang",
	"Hà Nam",
	"Hà Tĩnh",
	"Hải Dương",
	"Hậu Giang",
	"Hòa Bình",
	"Hưng Yên",
	"Khánh Hòa",
	"Kiên Giang",
	"Kon Tum",
	"Lai Châu",
	"Lâm Đồng",
	"Lạng Sơn",
	"Lào Cai",
	"Long An",
	"Nam Định",
	"Nghệ An",
	"Ninh Bình",
	"Ninh Thuận",
	"Phú Thọ",
	"Phú Yên",
	"Quảng Bình",
	"Quảng Nam",
	"Quảng Ngãi",
	"Quảng Ninh",
	"Quảng Trị",
	"Sóc Trăng",
	"Sơn La",
	"Tây Ninh",
	"Thái Bình",
	"Thái Nguyên",
	"Thanh Hóa",
	"Thừa Thiên Huế",
	"Tiền Giang",
	"Trà Vinh",
	"Tuyên Quang",
	"Vĩnh Long",
	"Vĩnh Phúc",
	"Yên Bái",
] as const;

// Helper for form fields to clean up main render
const FormField = ({
	field: formHook,
	name,
	placeholder,
	type = "text",
	required,
	icon,
}: any) => (
	<formHook.Field
		name={name}
		validators={{
			onChange: ({ value }: { value: string }) => {
				console.log(name);
				if (name === "zipCode" && value && !/^\d{0,6}$/.test(value)) {
					return "Mã zip không hợp lệ";
				}
				// Phone validation for Vietnam numbers. Number starts with 0 or +84 followed by +9 (Can be more) digits starting with 3,5,7,8,9
				if (
					name === "phone" &&
					value &&
					!/(?:\+84|0084|0)[235789][0-9]{1,2}[0-9]{7}(?:[^\d]+|$)/g.test(value)
				) {
					return "Số điện thoại không hợp lệ";
				}

				if (name === "name" && value && value.length < 3) {
					return "Tên quá ngắn";
				}
				if (name === "city" && value && value.length < 2) {
					return "Vui lòng nhập tỉnh/thành phố";
				}

				const fieldName =
					fieldMap[name as keyof typeof fieldMap] || "Trường này";
				return required && !value ? `Vui lòng nhập ${fieldName}` : undefined;
			},
			onBlur: ({ value }: { value: string }) => {
				const fieldName =
					fieldMap[name as keyof typeof fieldMap] || "Trường này";
				return required && !value ? `Vui lòng nhập ${fieldName}` : undefined;
			},
		}}
	>
		{(field: any) => (
			<div>
				<div className="relative">
					{icon && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
							{icon}
						</div>
					)}
					<input
						type={type}
						placeholder={placeholder}
						value={field.state.value}
						onBlur={field.handleBlur}
						onChange={(e) => field.handleChange(e.target.value)}
						className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${field.state.meta.errors.length
							? "border-red-300 bg-red-50 text-red-900 placeholder:text-red-300"
							: "border-gray-200 bg-gray-50"
							}`}
					/>
				</div>
				{field.state.meta.errors.length > 0 && (
					<p className="text-[10px] text-red-500 mt-1 ml-1">
						{field.state.meta.errors[0]}
					</p>
				)}
			</div>
		)}
	</formHook.Field>
);
