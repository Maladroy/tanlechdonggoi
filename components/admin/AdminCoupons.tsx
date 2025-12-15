import { Edit, Plus, Trash2, XCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { addCoupon, deleteCoupon, updateCoupon } from "../../services/firebase";
import type { Combo, Coupon } from "../../types";

interface Props {
	coupons: Coupon[];
	combos: Combo[];
	onRefresh: () => void;
}

export const AdminCoupons: React.FC<Props> = ({
	coupons,
	combos,
	onRefresh,
}) => {
	const [showAddCoupon, setShowAddCoupon] = useState(false);
	const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
	const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
		code: "",
		desc: "",
		color: "from-blue-500 to-cyan-500",
		expiryDate: "",
		type: "fixed",
		value: 0,
		applicableCombos: [],
	});

	const handleSaveCoupon = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingCouponId) {
			await updateCoupon(editingCouponId, newCoupon);
		} else {
			await addCoupon(newCoupon as Omit<Coupon, "id">);
		}
		closeCouponModal();
		onRefresh();
	};

	const openEditCoupon = (coupon: Coupon) => {
		setNewCoupon(coupon);
		setEditingCouponId(coupon.id || null);
		setShowAddCoupon(true);
	};

	const closeCouponModal = () => {
		setShowAddCoupon(false);
		setEditingCouponId(null);
		setNewCoupon({
			code: "",
			desc: "",
			color: "from-blue-500 to-cyan-500",
			expiryDate: "",
			type: "fixed",
			value: 0,
			applicableCombos: [],
		});
	};

	const handleDeleteCoupon = async (id: string) => {
		if (confirm("Xóa mã này?")) {
			await deleteCoupon(id);
			onRefresh();
		}
	};

	const toggleApplicableCombo = (comboId: string) => {
		setNewCoupon((prev) => {
			const current = prev.applicableCombos || [];
			if (current.includes(comboId)) {
				return {
					...prev,
					applicableCombos: current.filter((id) => id !== comboId),
				};
			}
			return { ...prev, applicableCombos: [...current, comboId] };
		});
	};

	return (
		<div>
			<button
				type="button"
				onClick={() => setShowAddCoupon(true)}
				className="mb-6 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition"
			>
				<Plus size={20} /> Tạo Mã Mới
			</button>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{coupons.map((coupon) => (
					<div
						key={coupon.id}
						className={`p-5 rounded-2xl text-white bg-linear-to-r ${coupon.color} relative group shadow-lg transition hover:-translate-y-1`}
					>
						<div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<button
								type="button"
								onClick={() => openEditCoupon(coupon)}
								className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm transition"
							>
								<Edit size={14} />
							</button>
							<button
								type="button"
								onClick={() => coupon.id && handleDeleteCoupon(coupon.id)}
								className="p-1.5 bg-white/20 rounded-full hover:bg-red-500/80 backdrop-blur-sm transition"
							>
								<Trash2 size={14} />
							</button>
						</div>

						<div className="flex justify-between items-start mb-4">
							<div>
								<h3 className="font-black text-2xl tracking-tight">
									{coupon.code}
								</h3>
								<p className="text-white/90 text-sm font-medium mt-1">
									{coupon.desc}
								</p>
							</div>
						</div>

						<div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-white/10">
							<div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
								<span className="text-xs text-white/70 uppercase font-bold">
									Giá Trị
								</span>
								<span className="font-bold text-lg">
									{coupon.type === "percent"
										? `-${coupon.value}%`
										: `-${coupon.value?.toLocaleString()}đ`}
								</span>
							</div>
							<div className="text-xs text-white/80 space-y-1">
								<div className="flex justify-between">
									<span>Áp dụng:</span>
									<span className="font-medium text-right max-w-[150px] truncate">
										{coupon.applicableCombos &&
										coupon.applicableCombos.length > 0
											? coupon.applicableCombos
													.map(
														(id) => combos.find((c) => c.id === id)?.name || id,
													)
													.join(", ")
											: "Toàn bộ"}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Hết hạn:</span>
									<span className="font-mono">
										{new Date(coupon.expiryDate).toLocaleDateString()}
									</span>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Add/Edit Coupon Modal */}
			{showAddCoupon && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
					<div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
						<h3 className="text-xl font-bold mb-6 flex justify-between items-center">
							{editingCouponId ? "Cập Nhật Mã" : "Tạo Mã Mới"}
							<button
								type="button"
								onClick={closeCouponModal}
								className="text-slate-400 hover:text-slate-600"
							>
								<XCircle size={24} />
							</button>
						</h3>
						<form onSubmit={handleSaveCoupon} className="space-y-4">
							<div>
								<label
									htmlFor="coupon-code"
									className="block text-sm font-bold text-slate-700 mb-1"
								>
									Mã Code
								</label>
								<input
									id="coupon-code"
									required
									placeholder="VD: SALE50"
									className="w-full p-2 border border-slate-300 rounded-lg uppercase font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
									value={newCoupon.code}
									onChange={(e) =>
										setNewCoupon({
											...newCoupon,
											code: e.target.value.toUpperCase(),
										})
									}
								/>
							</div>
							<div>
								<label
									htmlFor="coupon-desc"
									className="block text-sm font-bold text-slate-700 mb-1"
								>
									Mô tả
								</label>
								<input
									id="coupon-desc"
									required
									placeholder="Mô tả ngắn gọn"
									className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
									value={newCoupon.desc}
									onChange={(e) =>
										setNewCoupon({ ...newCoupon, desc: e.target.value })
									}
								/>
							</div>

							<div className="flex gap-3">
								<div className="w-1/2">
									<label
										htmlFor="coupon-type"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Loại
									</label>
									<select
										id="coupon-type"
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										value={newCoupon.type}
										onChange={(e) =>
											setNewCoupon({
												...newCoupon,
												type: e.target.value as "fixed" | "percent",
											})
										}
									>
										<option value="fixed">Tiền mặt (VNĐ)</option>
										<option value="percent">Phần trăm (%)</option>
									</select>
								</div>
								<div className="w-1/2">
									<label
										htmlFor="coupon-value"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Giá trị
									</label>
									<input
										id="coupon-value"
										required
										type="number"
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										placeholder={newCoupon.type === "percent" ? "10" : "50000"}
										value={newCoupon.value || ""}
										onChange={(e) =>
											setNewCoupon({
												...newCoupon,
												value: Number(e.target.value),
											})
										}
									/>
								</div>
							</div>

							<div>
								<span className="block text-sm font-bold text-slate-700 mb-2">
									Áp dụng cho sản phẩm
								</span>
								<div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
									{combos.map((combo) => (
										<label
											key={combo.id}
											className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white p-2 rounded-lg transition"
										>
											<input
												type="checkbox"
												checked={newCoupon.applicableCombos?.includes(combo.id)}
												onChange={() => toggleApplicableCombo(combo.id)}
												className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
											/>
											<span className="flex-1">{combo.name}</span>
										</label>
									))}
								</div>
								<p className="text-xs text-slate-500 mt-1 ml-1">
									*Để trống để áp dụng cho tất cả sản phẩm
								</p>
							</div>

							<div>
								<label
									htmlFor="coupon-expiry"
									className="block text-sm font-bold text-slate-700 mb-1"
								>
									Hạn sử dụng
								</label>
								<input
									id="coupon-expiry"
									required
									type="date"
									className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
									value={
										newCoupon.expiryDate
											? newCoupon.expiryDate.split("T")[0]
											: ""
									}
									onChange={(e) =>
										setNewCoupon({
											...newCoupon,
											expiryDate: new Date(e.target.value).toISOString(),
										})
									}
								/>
							</div>

							<div>
								<label
									htmlFor="coupon-color"
									className="block text-sm font-bold text-slate-700 mb-1"
								>
									Màu sắc thẻ
								</label>
								<select
									id="coupon-color"
									className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
									value={newCoupon.color}
									onChange={(e) =>
										setNewCoupon({ ...newCoupon, color: e.target.value })
									}
								>
									<option value="from-pink-500 to-rose-500">Hồng - Đỏ</option>
									<option value="from-blue-400 to-indigo-500">
										Xanh Dương
									</option>
									<option value="from-amber-400 to-orange-500">
										Cam - Vàng
									</option>
									<option value="from-emerald-400 to-teal-500">Xanh Lá</option>
									<option value="from-purple-500 to-indigo-600">Tím</option>
								</select>
							</div>

							<div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
								<button
									type="button"
									onClick={closeCouponModal}
									className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
								>
									Hủy
								</button>
								<button
									type="submit"
									className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200"
								>
									{editingCouponId ? "Cập Nhật" : "Tạo Mã"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
