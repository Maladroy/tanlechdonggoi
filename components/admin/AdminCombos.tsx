import { Edit, Plus, Trash2, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
	addCombo,
	deleteCombo,
	getCategories,
	updateCombo,
} from "../../services/firebase";
import type { Category, Combo, ComboStatus, VariantCombinationRule, VariantOption } from "../../types";
import { ensureNewVariantFormat } from "../../utils";
import MarkdownRenderer from "../MarkdownRenderer";
import { CombinationRulesManager } from "./CombinationRulesManager";
import { VariantManager } from "./VariantManager";

interface Props {
	combos: Combo[];
	onRefresh: () => void;
}

export const AdminCombos: React.FC<Props> = ({ combos, onRefresh }) => {
	const [showAddCombo, setShowAddCombo] = useState(false);
	const [editingComboId, setEditingComboId] = useState<string | null>(null);
	const [categories, setCategories] = useState<Category[]>([]);

	const [newCombo, setNewCombo] = useState<Partial<Combo>>({
		name: "",
		description: "",
		price: 0,
		originalPrice: 0,
		imageUrl: "",
		tags: [],
		items: [],
		category: "",
		type: "combo",
		variants: [],
		variantImages: {},
	});
	const [itemsInput, setItemsInput] = useState("");
	const [tagsInput, setTagsInput] = useState("");
	// State for managing variants in the modal (new format)
	const [tempVariants, setTempVariants] = useState<VariantOption[]>([]);
	const [tempCombinationRules, setTempCombinationRules] = useState<VariantCombinationRule[]>([]);

	useEffect(() => {
		getCategories().then(setCategories);
	}, []);

	const handleSaveCombo = async (e: React.FormEvent) => {
		e.preventDefault();
		const items = itemsInput.split(",").map((i) => i.trim());
		const tags = tagsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		// If it's a product, we use the product name as the single "item" (legacy compat)
		// or we can leave items empty if the system handles it.
		// For safety/backward compat with cart logic that might show items,
		// let's ensure items has at least the product name if type is 'product'.
		const finalItems =
			newCombo.type === "product"
				? items.length > 0
					? items
					: [newCombo.name || "Sản phẩm"]
				: items;

		const comboData = {
			...(newCombo as Omit<Combo, "id">),
			items: finalItems,
			tags: tags.length ? tags : ["Mới"],
			status: newCombo.status || "available",
			variants: newCombo.type === "product" ? tempVariants : [],
			variantCombinationRules: newCombo.type === "product" ? tempCombinationRules : [],
			type: newCombo.type || "combo",
		};

		if (editingComboId) {
			await updateCombo(editingComboId, comboData);
		} else {
			await addCombo(comboData);
		}

		closeComboModal();
		onRefresh();
	};

	const openEditCombo = (combo: Combo) => {
		setNewCombo({ ...combo, type: combo.type || "combo" });
		setItemsInput(combo.items.join(", "));
		setTagsInput(combo.tags.join(", "));
		// Migrate old variant format to new format if needed
		const migratedVariants = ensureNewVariantFormat(combo.variants, combo.variantImages);
		setTempVariants(migratedVariants);
		setTempCombinationRules(combo.variantCombinationRules || []);
		setEditingComboId(combo.id);
		setShowAddCombo(true);
	};

	const closeComboModal = () => {
		setShowAddCombo(false);
		setEditingComboId(null);
		setNewCombo({
			name: "",
			description: "",
			price: 0,
			originalPrice: 0,
			imageUrl: "",
			tags: [],
			items: [],
			status: "available",
			category: "",
			type: "combo",
			variants: [],
			variantImages: {},
		});
		setItemsInput("");
		setTagsInput("");
		setTempVariants([]);
		setTempCombinationRules([]);
	};

	const handleDeleteCombo = async (id: string) => {
		if (confirm("Xóa combo này?")) {
			await deleteCombo(id);
			onRefresh();
		}
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h3 className="font-bold text-lg text-slate-700">Danh Sách Sản Phẩm</h3>
				<button
					type="button"
					onClick={() => setShowAddCombo(true)}
					className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition shadow-sm"
				>
					<Plus size={20} /> Thêm Combo Mới
				</button>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
				<table className="w-full text-left text-sm text-slate-600">
					<thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
						<tr>
							<th className="p-4 w-16">Ảnh</th>
							<th className="p-4">Tên Combo</th>
							<th className="p-4">Danh Mục</th>
							<th className="p-4">Trạng thái</th>
							<th className="p-4 text-right">Giá Bán</th>
							<th className="p-4 text-center">Thao Tác</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{combos.map((combo) => (
							<tr key={combo.id} className="hover:bg-slate-50 group">
								<td className="p-4">
									<img
										src={combo.imageUrl}
										alt=""
										className="w-10 h-10 object-cover rounded bg-slate-100"
									/>
								</td>
								<td className="p-4">
									<div className="font-bold text-slate-800">{combo.name}</div>
									<div className="flex gap-1 mt-1 flex-wrap">
										{combo.tags.map((tag) => (
											<span
												key={tag}
												className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200"
											>
												{tag}
											</span>
										))}
									</div>
								</td>
								<td className="p-4">
									{categories.find((c) => c.id === combo.category)?.name ||
										combo.category ||
										"-"}
								</td>
								<td className="p-4">
									<span
										className={`text-xs font-bold px-2 py-1 rounded uppercase ${combo.status === "out_of_stock"
											? "bg-red-100 text-red-700"
											: combo.status === "hidden"
												? "bg-gray-100 text-gray-600"
												: "bg-green-100 text-green-700"
											}`}
									>
										{combo.status === "out_of_stock"
											? "Hết hàng"
											: combo.status === "hidden"
												? "Ẩn"
												: "Sẵn sàng"}
									</span>
								</td>
								<td className="p-4 text-right font-bold text-orange-600">
									{combo.price.toLocaleString()}đ
								</td>
								<td className="p-4 text-center">
									<div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											type="button"
											onClick={() => openEditCombo(combo)}
											className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
											title="Sửa"
										>
											<Edit size={16} />
										</button>
										<button
											type="button"
											onClick={() => handleDeleteCombo(combo.id)}
											className="p-1.5 text-red-600 hover:bg-red-50 rounded"
											title="Xóa"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Add/Edit Combo Modal */}
			{showAddCombo && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
					<div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
						<h3 className="text-xl font-bold mb-6 flex justify-between items-center">
							{editingComboId ? "Cập Nhật Combo" : "Thêm Combo Mới"}
							<button
								type="button"
								onClick={closeComboModal}
								className="text-slate-400 hover:text-slate-600"
							>
								<XCircle size={24} />
							</button>
						</h3>
						<form onSubmit={handleSaveCombo} className="space-y-4">
							<div className="flex gap-4">
								<div className="flex-1">
									<label
										htmlFor="combo-name"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Tên Sản Phẩm
									</label>
									<input
										id="combo-name"
										required
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										value={newCombo.name}
										onChange={(e) =>
											setNewCombo({ ...newCombo, name: e.target.value })
										}
									/>
								</div>
								<div className="w-1/3">
									<label
										htmlFor="combo-type"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Loại
									</label>
									<select
										id="combo-type"
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50"
										value={newCombo.type || "combo"}
										onChange={(e) =>
											setNewCombo({
												...newCombo,
												type: e.target.value as "combo" | "product",
											})
										}
									>
										<option value="combo">Combo (Nhiều món)</option>
										<option value="product">Sản phẩm đơn</option>
									</select>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="w-1/2">
									<label
										htmlFor="combo-category"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Danh Mục
									</label>
									<select
										id="combo-category"
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										value={newCombo.category || ""}
										onChange={(e) =>
											setNewCombo({ ...newCombo, category: e.target.value })
										}
									>
										<option value="">-- Chọn danh mục --</option>
										{categories.map((c) => (
											<option key={c.id} value={c.id}>
												{c.name}
											</option>
										))}
									</select>
								</div>
								<div className="w-1/2">
									<label
										htmlFor="combo-status"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Trạng thái
									</label>
									<select
										id="combo-status"
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										value={newCombo.status || "available"}
										onChange={(e) =>
											setNewCombo({
												...newCombo,
												status: e.target.value as ComboStatus,
											})
										}
									>
										<option value="available">Sẵn sàng bán</option>
										<option value="out_of_stock">Hết hàng</option>
										<option value="hidden">Ẩn khỏi shop</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="combo-desc"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Mô tả (Markdown)
									</label>
									<textarea
										id="combo-desc"
										required
										rows={6}
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono text-sm"
										value={newCombo.description}
										onChange={(e) =>
											setNewCombo({
												...newCombo,
												description: e.target.value,
											})
										}
										placeholder="Nhập mô tả sản phẩm (hỗ trợ Markdown)..."
									/>
								</div>
								<div>
									<span className="block text-sm font-bold text-slate-700 mb-1">
										Xem trước
									</span>
									<div className="w-full h-full min-h-[150px] p-3 border border-slate-200 rounded-lg bg-slate-50 overflow-y-auto max-h-40 prose prose-sm prose-slate max-w-none dark:prose-invert">
										{newCombo.description ? (
											<MarkdownRenderer content={newCombo.description} />
										) : (
											<span className="text-gray-400 italic">
												Nội dung xem trước sẽ hiện ở đây...
											</span>
										)}
									</div>
								</div>
							</div>

							<div>
								<label
									htmlFor="combo-tags"
									className="block text-sm font-bold text-slate-700 mb-1"
								>
									Tags (phân cách dấu phẩy)
								</label>
								<input
									id="combo-tags"
									className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
									value={tagsInput}
									placeholder="Ví dụ: Hot, Mới, Giảm giá"
									onChange={(e) => setTagsInput(e.target.value)}
								/>
							</div>

							<div className="flex gap-4">
								<div className="w-1/2">
									<label
										htmlFor="combo-price"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Giá bán
									</label>
									<input
										id="combo-price"
										required
										type="number"
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										value={newCombo.price || ""}
										onChange={(e) =>
											setNewCombo({
												...newCombo,
												price: Number(e.target.value),
											})
										}
									/>
								</div>
								<div className="w-1/2">
									<label
										htmlFor="combo-original-price"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Giá gốc (Tùy chọn)
									</label>
									<input
										id="combo-original-price"
										type="number"
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										value={newCombo.originalPrice || ""}
										onChange={(e) =>
											setNewCombo({
												...newCombo,
												originalPrice: Number(e.target.value),
											})
										}
									/>
								</div>
							</div>
							<div>
								<label
									htmlFor="combo-image"
									className="block text-sm font-bold text-slate-700 mb-1"
								>
									URL Hình ảnh
								</label>
								<input
									id="combo-image"
									required
									className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
									value={newCombo.imageUrl}
									onChange={(e) =>
										setNewCombo({
											...newCombo,
											imageUrl: e.target.value,
										})
									}
								/>
							</div>
							{(newCombo.type === "combo" || !newCombo.type) && (
								<div>
									<label
										htmlFor="combo-items"
										className="block text-sm font-bold text-slate-700 mb-1"
									>
										Danh sách món (phân cách bằng dấu phẩy)
									</label>
									<input
										id="combo-items"
										required
										className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
										value={itemsInput}
										onChange={(e) => setItemsInput(e.target.value)}
										placeholder="Ví dụ: Gà rán, Khoai tây, Pepsi"
									/>
								</div>
							)}

							{newCombo.type === "product" && (
								<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-6">
									<VariantManager
										variants={tempVariants}
										onChange={setTempVariants}
										basePrice={newCombo.price || 0}
									/>

									{tempVariants.length > 0 && tempVariants.some(v => v.values.length > 0) && (
										<CombinationRulesManager
											variantOptions={tempVariants}
											rules={tempCombinationRules}
											onChange={setTempCombinationRules}
										/>
									)}
								</div>
							)}

							<div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
								<button
									type="button"
									onClick={closeComboModal}
									className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
								>
									Hủy
								</button>
								<button
									type="submit"
									className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200"
								>
									{editingComboId ? "Cập Nhật" : "Tạo Combo"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
