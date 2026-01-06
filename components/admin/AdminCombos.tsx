import {
	CheckCircleIcon,
	EyeSlashIcon,
	NoSymbolIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
	XCircleIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import type React from "react";
import { useEffect, useState } from "react";
import {
	addCombo,
	deleteCombo,
	getCategories,
	updateCombo,
} from "../../services/firebase";
import type { Category, Combo, ComboStatus, VariantCombinationRule, VariantOption } from "../../types";
import { calculateSimilarity, ensureNewVariantFormat } from "../../utils";
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
	const [nameWarning, setNameWarning] = useState<{
		type: "warning" | "soft";
		message: string;
	} | null>(null);

	// Image Preview Modal State
	const [previewImage, setPreviewImage] = useState<string | null>(null);

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 12;

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

	// Pagination Logic
	const totalPages = Math.ceil(combos.length / ITEMS_PER_PAGE);
	const currentCombos = combos.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	const checkNameSimilarity = (name: string) => {
		if (!name || name.trim() === "") {
			setNameWarning(null);
			return;
		}

		let maxSim = 0;
		let similarName = "";

		for (const combo of combos) {
			// Skip self when editing
			if (editingComboId && combo.id === editingComboId) continue;

			const sim = calculateSimilarity(name, combo.name);
			if (sim > maxSim) {
				maxSim = sim;
				similarName = combo.name;
			}
		}

		if (maxSim >= 0.7) {
			setNameWarning({
				type: "warning",
				message: `Cảnh báo: Tên sản phẩm quá giống "${similarName}" (${Math.round(
					maxSim * 100,
				)}%)`,
			});
		} else if (maxSim >= 0.4) {
			setNameWarning({
				type: "soft",
				message: `Lưu ý: Tên sản phẩm có nét giống "${similarName}" (${Math.round(
					maxSim * 100,
				)}%)`,
			});
		} else {
			setNameWarning(null);
		}
	};

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
		// Don't warn about name similarity when just opening edit for the existing name
		setNameWarning(null);
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
		setNameWarning(null);
	};

	const handleDeleteCombo = async (id: string) => {
		if (confirm("Xóa combo này?")) {
			await deleteCombo(id);
			onRefresh();
		}
	};

	const getStatusConfig = (status: ComboStatus) => {
		switch (status) {
			case "available":
				return {
					icon: <CheckCircleIcon className="w-4 h-4" />,
					text: "Sẵn sàng",
					className: "bg-green-50 text-green-700 border-green-100",
				};
			case "out_of_stock":
				return {
					icon: <NoSymbolIcon className="w-4 h-4" />,
					text: "Hết hàng",
					className: "bg-red-50 text-red-700 border-red-100",
				};
			case "hidden":
				return {
					icon: <EyeSlashIcon className="w-4 h-4" />,
					text: "Ẩn",
					className: "bg-gray-50 text-gray-600 border-gray-200",
				};
			default:
				return {
					icon: <CheckCircleIcon className="w-4 h-4" />,
					text: "Sẵn sàng",
					className: "bg-green-50 text-green-700 border-green-100",
				};
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
					<PlusIcon className="w-5 h-5" /> Thêm Combo Mới
				</button>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
				<table className="w-full text-left text-sm text-slate-600">
					<thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
						<tr>
							<th className="p-4 w-24">Ảnh</th>
							<th className="p-4">Tên Combo</th>
							<th className="p-4">Danh Mục</th>
							<th className="p-4">Trạng thái</th>
							<th className="p-4 text-right">Giá Bán</th>
							<th className="p-4 text-center">Thao Tác</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{currentCombos.map((combo) => {
							const statusConfig = getStatusConfig(combo.status as ComboStatus);
							return (
								<tr key={combo.id} className="hover:bg-slate-50 group">
									<td className="p-4">
										<button
											type="button"
											className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group/img cursor-pointer block p-0"
											onClick={() => setPreviewImage(combo.imageUrl)}
										>
											<img
												src={combo.imageUrl}
												alt=""
												className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
											/>
										</button>
									</td>
									<td className="p-4 align-top">
										<div className="group/tooltip relative">
											<div className="font-bold text-slate-800 text-base mb-1 truncate max-w-[500px]">
												{combo.name}
											</div>
											<div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity delay-200 z-50 pointer-events-none bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-normal min-w-[200px] max-w-[300px]">
												{combo.name}
												<div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-slate-800" />
											</div>
										</div>
										<div className="flex gap-1 flex-wrap">
											{combo.tags.map((tag) => (
												<span
													key={tag}
													className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 border border-slate-200 font-medium"
												>
													{tag}
												</span>
											))}
										</div>
									</td>
									<td className="p-4 align-top">
										<span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
											{categories.find((c) => c.id === combo.category)?.name ||
												combo.category ||
												"-"}
										</span>
									</td>
									<td className="p-4 align-top">
										<span
											className={`flex items-center gap-1.5 w-fit text-xs font-bold px-2 py-1 rounded-full border ${statusConfig.className}`}
										>
											{statusConfig.icon}
											{statusConfig.text}
										</span>
									</td>
									<td className="p-4 text-right font-bold text-orange-600 align-top text-base">
										{combo.price.toLocaleString()}đ
									</td>
									<td className="p-4 text-center align-top">
										<div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
											<button
												type="button"
												onClick={() => openEditCombo(combo)}
												className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
												title="Sửa"
											>
												<PencilSquareIcon className="w-5 h-5" />
											</button>
											<button
												type="button"
												onClick={() => handleDeleteCombo(combo.id)}
												className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
												title="Xóa"
											>
												<TrashIcon className="w-5 h-5" />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{/* Pagination Controls */}
				{totalPages > 1 && (
					<div className="flex justify-center items-center gap-2 p-4 bg-slate-50 border-t border-slate-200">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="px-3 py-1 rounded bg-white border border-slate-300 disabled:opacity-50 hover:bg-slate-50 text-slate-600"
						>
							Trước
						</button>
						<span className="text-sm font-medium text-slate-600">
							Trang {currentPage} / {totalPages}
						</span>
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="px-3 py-1 rounded bg-white border border-slate-300 disabled:opacity-50 hover:bg-slate-50 text-slate-600"
						>
							Sau
						</button>
					</div>
				)}
			</div>

			{/* Image Preview Modal */}
			{previewImage && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop click to close
				// biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop click to close
				<div
					className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
					onClick={() => setPreviewImage(null)}
				>
					<div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Prevent click propagation */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: Prevent click propagation */}
						<img
							src={previewImage}
							alt="Preview"
							className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
							onClick={(e) => e.stopPropagation()}
						/>
						<button
							type="button"
							onClick={() => setPreviewImage(null)}
							className="absolute -top-4 -right-4 md:top-4 md:right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition backdrop-blur-md border border-white/20"
						>
							<XMarkIcon className="w-8 h-8" />
						</button>
					</div>
				</div>
			)}

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
								<XCircleIcon className="w-6 h-6" />
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
										className={`w-full p-2 border rounded-lg focus:ring-2 focus:outline-none ${nameWarning?.type === "warning"
											? "border-red-300 focus:ring-red-500 bg-red-50"
											: nameWarning?.type === "soft"
												? "border-yellow-300 focus:ring-yellow-500 bg-yellow-50"
												: "border-slate-300 focus:ring-orange-500"
											}`}
										value={newCombo.name}
										onChange={(e) => {
											setNewCombo({ ...newCombo, name: e.target.value });
											checkNameSimilarity(e.target.value);
										}}
									/>
									{nameWarning && (
										<p
											className={`text-xs mt-1 font-medium ${nameWarning.type === "warning"
												? "text-red-600"
												: "text-yellow-600"
												}`}
										>
											{nameWarning.message}
										</p>
									)}
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
