import { AlertTriangle, Eye, Filter, Package, Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
	getCombos,
	getCoupons,
	updateOrderStatus,
} from "../../services/firebase";
import type { Combo, Coupon, Order, TupleSort } from "../../types";

interface Props {
	orders: Order[];
	onRefresh: () => void;
}

export const AdminOrders: React.FC<Props> = ({ orders, onRefresh }) => {
	const [orderSearch, setOrderSearch] = useState("");
	const [orderStatusFilter, setOrderStatusFilter] = useState<
		"all" | "pending" | "confirmed" | "cancelled"
	>("all");
	const [sortConfig, setSortConfig] = useState<{
		key: "createdAt" | "total" | "status" | "customer" | "id";
		direction: "asc" | "desc";
	}>({ key: "createdAt", direction: "desc" });
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
	const [combos, setCombos] = useState<Combo[]>([]);
	const [coupons, setCoupons] = useState<Coupon[]>([]);

	// Load reference data for validation
	useEffect(() => {
		const loadData = async () => {
			const [cbs, cps] = await Promise.all([getCombos(), getCoupons()]);
			setCombos(cbs);
			setCoupons(cps);
		};
		loadData();
	}, []);

	const validateOrder = (order: Order): string[] => {
		const issues: string[] = [];
		if (combos.length === 0) return []; // Data not loaded yet

		// 1. Validate Products & Prices
		let calculatedSubtotal = 0;
		for (const item of order.items) {
			const product = combos.find((c) => c.id === item.id);
			if (!product) {
				issues.push(`Sản phẩm không tồn tại: "${item.name}" (ID: ${item.id})`);
				// Skip price check for non-existent item but add to total with order price to assume "trust" for math check?
				// No, strictly use order price for math if product missing to isolate errors?
				// Actually if product missing, we can't verify price.
				calculatedSubtotal += item.price * item.quantity;
				continue;
			}
			if (product.price !== item.price) {
				issues.push(
					`Giá sản phẩm bị thay đổi: "${item.name}" (Gốc: ${product.price.toLocaleString()}, Đơn: ${item.price.toLocaleString()})`,
				);
			}
			calculatedSubtotal += item.price * item.quantity; // Use item price to verify math consistency, or product price?
			// Use PRODUCT price to verify if total was manipulated based on real prices.
			// Re-calculating using REAL prices:
			// actually let's use the product price for the "True Total" calculation.
		}

		// Recalculate TRUE total based on DB prices
		let trueSubtotal = 0;
		for (const item of order.items) {
			const product = combos.find((c) => c.id === item.id);
			if (product) {
				trueSubtotal += product.price * item.quantity;
			} else {
				trueSubtotal += item.price * item.quantity; // Fallback
			}
		}

		// 2. Validate Coupon
		let discount = 0;
		if (order.appliedCoupon) {
			const coupon = coupons.find(
				(c) => c.code.toUpperCase() === order.appliedCoupon?.toUpperCase(),
			);
			if (!coupon) {
				issues.push(`Mã giảm giá không tồn tại: ${order.appliedCoupon}`);
			} else {
				// Expiry Check
				if (new Date(coupon.expiryDate) < new Date(order.createdAt)) {
					issues.push(
						`Mã giảm giá đã hết hạn vào lúc đặt đơn: ${order.appliedCoupon}`,
					);
				}

				// Reuse Check
				const userOrders = orders.filter(
					(o) =>
						o.userId === order.userId &&
						o.id !== order.id &&
						o.status !== "cancelled" &&
						o.appliedCoupon === order.appliedCoupon,
				);
				if (userOrders.length > 0) {
					issues.push(
						`Mã giảm giá bị dùng lại (Đơn khác: ${userOrders
							.map((o) => o.id?.slice(0, 5))
							.join(", ")})`,
					);
				}

				// Calculate Discount
				let applicable = true;
				if (
					coupon.applicableCombos?.length &&
					!order.items.some((item) =>
						coupon.applicableCombos?.includes(item.id),
					)
				) {
					applicable = false;
					issues.push(`Mã không áp dụng cho sản phẩm trong đơn`);
				}

				if (applicable) {
					if (coupon.type === "percent" && coupon.value) {
						discount = (trueSubtotal * coupon.value) / 100;
					} else if (coupon.type === "fixed" && coupon.value) {
						discount = coupon.value;
					}
					discount = Math.min(discount, trueSubtotal);
				}
			}
		} else {
			// If no coupon, but total < subtotal?
			// Maybe manual discount? We assume strict logic.
		}

		const trueTotal = trueSubtotal - discount;

		// 3. Compare Totals
		// Use a tolerance for floating point or minor diffs
		if (Math.abs(trueTotal - order.total) > 1000) {
			issues.push(
				`Tổng tiền không khớp (Hệ thống tính: ${trueTotal.toLocaleString()}, Đơn: ${order.total.toLocaleString()})`,
			);
		}

		return issues;
	};

	// Filter & Sort Orders
	useEffect(() => {
		let result = [...orders];

		// Filter
		if (orderStatusFilter !== "all") {
			result = result.filter((o) => o.status === orderStatusFilter);
		}
		if (orderSearch) {
			const lower = orderSearch.toLowerCase();
			result = result.filter(
				(o) =>
					o.id?.toLowerCase().includes(lower) ||
					o.user.name.toLowerCase().includes(lower) ||
					o.user.phone.includes(lower),
			);
		}

		// Sort
		result.sort((a, b) => {
			let valA: TupleSort = "";
			let valB: TupleSort = "";

			switch (sortConfig.key) {
				case "createdAt":
					valA = new Date(a.createdAt).getTime();
					valB = new Date(b.createdAt).getTime();
					break;
				case "total":
					valA = a.total;
					valB = b.total;
					break;
				case "status":
					valA = a.status;
					valB = b.status;
					break;
				case "customer":
					valA = a.user.name.toLowerCase();
					valB = b.user.name.toLowerCase();
					break;
				case "id":
					valA = a.id || "";
					valB = b.id || "";
					break;
			}

			if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
			if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});

		setFilteredOrders(result);
	}, [orders, orderStatusFilter, orderSearch, sortConfig]);

	const requestSort = (
		key: "createdAt" | "total" | "status" | "customer" | "id",
	) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
		}));
	};

	const handleStatusUpdate = async (
		id: string,
		status: "pending" | "confirmed" | "cancelled",
	) => {
		await updateOrderStatus(id, status);
		onRefresh();
		if (selectedOrder && selectedOrder.id === id) {
			setSelectedOrder({ ...selectedOrder, status });
		}
	};

	return (
		<div className="space-y-4">
			{/* Filter Bar */}
			<div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-center mb-4">
				<div className="relative flex-1">
					<Search
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
						size={18}
					/>
					<input
						type="text"
						placeholder="Tìm đơn hàng (ID, Tên, SĐT)..."
						className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
						value={orderSearch}
						onChange={(e) => setOrderSearch(e.target.value)}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Filter size={18} className="text-slate-500" />
					<select
						className="border rounded-lg px-3 py-2 text-sm"
						value={orderStatusFilter}
						onChange={(e) =>
							setOrderStatusFilter(
								e.target.value as "all" | "pending" | "confirmed" | "cancelled",
							)
						}
					>
						<option value="all">Tất cả trạng thái</option>
						<option value="pending">Chờ Xử Lý</option>
						<option value="confirmed">Đã Chốt</option>
						<option value="cancelled">Đã Hủy</option>
					</select>
				</div>
			</div>

			{/* Orders Table */}
			<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm text-slate-600">
						<thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
							<tr>
								<th
									className="p-4 cursor-pointer hover:bg-slate-100 transition"
									onClick={() => requestSort("id")}
								>
									ID{" "}
									{sortConfig.key === "id" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="p-4 cursor-pointer hover:bg-slate-100 transition"
									onClick={() => requestSort("customer")}
								>
									Khách Hàng{" "}
									{sortConfig.key === "customer" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th className="p-4">Sản Phẩm</th>
								<th
									className="p-4 cursor-pointer hover:bg-slate-100 transition"
									onClick={() => requestSort("total")}
								>
									Tổng Tiền{" "}
									{sortConfig.key === "total" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="p-4 cursor-pointer hover:bg-slate-100 transition"
									onClick={() => requestSort("createdAt")}
								>
									Thời Gian{" "}
									{sortConfig.key === "createdAt" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th
									className="p-4 cursor-pointer hover:bg-slate-100 transition"
									onClick={() => requestSort("status")}
								>
									Trạng Thái{" "}
									{sortConfig.key === "status" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</th>
								<th className="p-4 text-center">Thao Tác</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{filteredOrders.length === 0 ? (
								<tr>
									<td colSpan={7} className="p-8 text-center text-slate-500">
										Không tìm thấy đơn hàng nào.
									</td>
								</tr>
							) : (
								filteredOrders.map((order) => (
									<tr key={order.id} className="hover:bg-slate-50">
										<td className="p-4 font-mono text-xs">
											{order.id?.slice(0, 8)}...
											{validateOrder(order).length > 0 && (
												<div
													className="text-red-500 flex items-center gap-1 mt-1 font-bold"
													title="Đơn hàng có dấu hiệu bất thường!"
												>
													<AlertTriangle size={12} />
													WARNING
												</div>
											)}
										</td>
										<td className="p-4">
											<div className="font-bold text-slate-800">
												{order.user.name}
											</div>
											<div className="text-xs">{order.user.phone}</div>
										</td>
										<td className="p-4 max-w-xs">
											<div className="text-xs space-y-1">
												{order.items.slice(0, 2).map((item) => (
													<div key={item.id}>
														{item.quantity}x {item.name}
													</div>
												))}
												{order.items.length > 2 && (
													<div className="text-slate-400">
														...và {order.items.length - 2} món khác
													</div>
												)}
											</div>
										</td>
										<td className="p-4 font-bold text-orange-600">
											{order.total.toLocaleString()}đ
											{order.appliedCoupon && (
												<div className="text-[10px] font-normal text-green-600 bg-green-50 px-1 rounded inline-block ml-1">
													{order.appliedCoupon}
												</div>
											)}
										</td>
										<td className="p-4 text-xs">
											{new Date(order.createdAt).toLocaleDateString()} <br />
											{new Date(order.createdAt).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</td>
										<td className="p-4">
											<span
												className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === "confirmed"
													? "bg-green-100 text-green-700"
													: order.status === "cancelled"
														? "bg-red-100 text-red-700"
														: "bg-yellow-100 text-yellow-700"
													}`}
											>
												{order.status === "confirmed"
													? "Đã Chốt"
													: order.status === "cancelled"
														? "Đã Hủy"
														: "Chờ Xử Lý"}
											</span>
										</td>
										<td className="p-4 text-center">
											<div className="flex justify-center gap-2">
												<button
													type="button"
													onClick={() => setSelectedOrder(order)}
													className="bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100 transition"
													title="Xem chi tiết"
												>
													<Eye size={16} />
												</button>

												<select
													className={`text-xs border rounded p-1 outline-none font-bold ${order.status === "confirmed"
														? "text-green-600 border-green-200 bg-green-50"
														: order.status === "cancelled"
															? "text-red-600 border-red-200 bg-red-50"
															: "text-yellow-600 border-yellow-200 bg-yellow-50"
														}`}
													value={order.status}
													onChange={(e) =>
														handleStatusUpdate(
															order.id!,
															e.target.value as
															| "pending"
															| "confirmed"
															| "cancelled",
														)
													}
													onClick={(e) => e.stopPropagation()}
												>
													<option value="pending">Chờ</option>
													<option value="confirmed">Chốt</option>
													<option value="cancelled">Hủy</option>
												</select>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Order Detail Modal */}
			{selectedOrder && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
					<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
						<div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
							<div className="flex flex-col">
								<h3 className="text-xl font-bold text-gray-800">
									Chi Tiết Đơn Hàng #{selectedOrder.id?.slice(0, 8)}
								</h3>
								{validateOrder(selectedOrder).length > 0 && (
									<span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 w-fit mt-1">
										⚠ ĐƠN HÀNG ĐÃ BỊ CAN THIỆP
									</span>
								)}
							</div>
							<button
								type="button"
								onClick={() => setSelectedOrder(null)}
								className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition"
							>
								<X size={20} />
							</button>
						</div>

						<div className="p-6 overflow-y-auto flex-1 space-y-8">
							{/* Security Validation Alerts */}
							{validateOrder(selectedOrder).length > 0 && (
								<div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
									<h4 className="flex items-center gap-2 font-bold text-red-800 mb-2">
										<AlertTriangle size={20} />
										Cảnh báo an toàn
									</h4>
									<ul className="list-disc list-inside space-y-1 text-sm text-red-700">
										{validateOrder(selectedOrder).map((issue, idx) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: List is static
											<li key={idx}>{issue}</li>
										))}
									</ul>
								</div>
							)}

							{/* Status & Meta */}
							<div className="flex flex-wrap gap-4 justify-between items-center">
								<div className="flex items-center gap-2 text-sm text-gray-500">
									<Package size={16} />
									<span>
										Đặt lúc:{" "}
										{new Date(selectedOrder.createdAt).toLocaleString()}
									</span>
								</div>
								<span
									className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${selectedOrder.status === "confirmed"
										? "bg-green-100 text-green-700"
										: selectedOrder.status === "cancelled"
											? "bg-red-100 text-red-700"
											: "bg-yellow-100 text-yellow-700"
										}`}
								>
									{selectedOrder.status === "confirmed"
										? "Đã Chốt Đơn"
										: selectedOrder.status === "cancelled"
											? "Đã Hủy Đơn"
											: "Chờ Xử Lý"}
								</span>
							</div>

							{/* Customer Info */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-3">
									<h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
										Khách Hàng
									</h4>
									<div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100">
										<p>
											<span className="text-gray-500 block text-xs">
												Họ tên
											</span>
											<span className="font-medium text-gray-900 text-base">
												{selectedOrder.user.name}
											</span>
										</p>
										<p>
											<span className="text-gray-500 block text-xs">SĐT</span>
											<span className="font-mono text-gray-700">
												{selectedOrder.user.phone}
											</span>
										</p>
										{selectedOrder.user.email && (
											<p>
												<span className="text-gray-500 block text-xs">
													Email
												</span>
												<span className="text-gray-700">
													{selectedOrder.user.email}
												</span>
											</p>
										)}
									</div>
								</div>

								<div className="space-y-3">
									<h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
										Giao Hàng
									</h4>
									<div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100 h-full">
										{selectedOrder.shippingAddress ? (
											<>
												<p>
													<span className="text-gray-500 block text-xs">
														Địa chỉ
													</span>
													<span className="font-medium text-gray-900">
														{selectedOrder.shippingAddress.street}
													</span>
												</p>
												<p>
													<span className="text-gray-500 block text-xs">
														Thành phố
													</span>
													<span className="text-gray-700">
														{selectedOrder.shippingAddress.city}
													</span>
												</p>
												<p>
													<span className="text-gray-500 block text-xs">
														Mã bưu điện
													</span>
													<span className="font-mono text-gray-700">
														{selectedOrder.shippingAddress.zipCode}
													</span>
												</p>
											</>
										) : (
											<p className="text-gray-500 italic">
												Không có địa chỉ giao hàng
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Items */}
							<div className="space-y-3">
								<h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
									Sản Phẩm Đã Đặt
								</h4>
								<div className="border border-gray-200 rounded-xl overflow-hidden">
									<table className="w-full text-sm text-left">
										<thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
											<tr>
												<th className="p-3">Sản phẩm</th>
												<th className="p-3 text-center">SL</th>
												<th className="p-3 text-right">Đơn giá</th>
												<th className="p-3 text-right">Thành tiền</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100">
											{selectedOrder.items.map((item) => (
												<tr key={item.id}>
													<td className="p-3">
														<div className="font-medium text-gray-900">
															{item.name}
														</div>
														<div className="text-xs text-gray-500">
															{item.items.join(", ")}
														</div>
													</td>
													<td className="p-3 text-center font-medium">
														x{item.quantity}
													</td>
													<td className="p-3 text-right text-gray-600">
														{item.price.toLocaleString()}đ
													</td>
													<td className="p-3 text-right font-bold text-gray-900">
														{(item.price * item.quantity).toLocaleString()}đ
													</td>
												</tr>
											))}
										</tbody>
										<tfoot className="bg-gray-50">
											{selectedOrder.appliedCoupon && (
												<tr>
													<td
														colSpan={3}
														className="p-3 text-right text-green-600 font-medium"
													>
														Mã giảm giá ({selectedOrder.appliedCoupon})
													</td>
													<td className="p-3 text-right text-green-600 font-bold">
														-
														{(
															selectedOrder.items.reduce(
																(sum, i) => sum + i.price * i.quantity,
																0,
															) - selectedOrder.total
														).toLocaleString()}
														đ
													</td>
												</tr>
											)}
											<tr>
												<td
													colSpan={3}
													className="p-4 text-right font-bold text-gray-900 text-base"
												>
													Tổng Cộng
												</td>
												<td className="p-4 text-right font-black text-xl text-orange-600">
													{selectedOrder.total.toLocaleString()}đ
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						</div>

						{/* Actions Footer */}
						<div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-500 font-bold">
									Cập nhật trạng thái:
								</span>
								<select
									className={`text-sm border rounded-lg px-3 py-2 outline-none font-bold cursor-pointer ${selectedOrder.status === "confirmed"
										? "text-green-600 border-green-200 bg-green-50"
										: selectedOrder.status === "cancelled"
											? "text-red-600 border-red-200 bg-red-50"
											: "text-yellow-600 border-yellow-200 bg-yellow-50"
										}`}
									value={selectedOrder.status}
									onChange={(e) =>
										handleStatusUpdate(
											selectedOrder.id!,
											e.target.value as "pending" | "confirmed" | "cancelled",
										)
									}
								>
									<option value="pending">⏳ Chờ Xử Lý</option>
									<option value="confirmed">✅ Đã Chốt Đơn</option>
									<option value="cancelled">❌ Đã Hủy Đơn</option>
								</select>
							</div>

							<button
								type="button"
								onClick={() => setSelectedOrder(null)}
								className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 transition"
							>
								Đóng
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
