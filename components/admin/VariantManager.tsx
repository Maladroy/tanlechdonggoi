import {
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageIcon, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { VariantOption, VariantValue } from "../../types";
import {
	createEmptyVariantOption,
	createEmptyVariantValue,
	formatPriceChange,
} from "../../utils";

interface VariantManagerProps {
	variants: VariantOption[];
	onChange: (variants: VariantOption[]) => void;
	basePrice: number;
}

// Sortable Variant Value Item Component
const SortableValueItem: React.FC<{
	value: VariantValue;
	basePrice: number;
	onUpdate: (valueId: string, updates: Partial<VariantValue>) => void;
	onRemove: (valueId: string) => void;
}> = ({ value, basePrice, onUpdate, onRemove }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: value.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const [priceInput, setPriceInput] = useState(value.priceChange.toString());

	// Sync local state with prop when prop changes
	useEffect(() => {
		setPriceInput(value.priceChange.toString());
	}, [value.priceChange]);

	const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPriceInput(e.target.value);
	};

	const handlePriceBlur = () => {
		let num = Number.parseFloat(priceInput);
		if (Number.isNaN(num)) {
			num = 0;
		}
		onUpdate(value.id, { priceChange: num });
		setPriceInput(num.toString());
	};

	const finalPrice = basePrice + value.priceChange;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 ${isDragging ? "shadow-lg" : ""
				}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
			>
				<GripVertical size={14} />
			</button>

			<input
				type="text"
				value={value.label}
				onChange={(e) => onUpdate(value.id, { label: e.target.value })}
				placeholder="Tên giá trị"
				className="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
			/>

			<div className="relative w-28">
				<input
					type="number"
					value={priceInput}
					onChange={handlePriceChange}
					onBlur={handlePriceBlur}
					className="w-full px-2 py-1 text-sm border border-slate-200 rounded text-right focus:ring-2 focus:ring-orange-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					placeholder="0"
				/>
				<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
					₫
				</span>
			</div>

			<div
				className="text-xs w-24 text-right hidden sm:block"
				title={`Giá cuối: ${finalPrice.toLocaleString("vi-VN")}₫`}
			>
				{value.priceChange !== 0 ? (
					<span
						className={
							value.priceChange > 0 ? "text-green-600" : "text-red-600"
						}
					>
						{formatPriceChange(value.priceChange)}
					</span>
				) : (
					<span className="text-slate-400">
						= {finalPrice.toLocaleString("vi-VN")}₫
					</span>
				)}
			</div>

			<button
				type="button"
				onClick={() => {
					const url = prompt("URL hình ảnh:", value.imageUrl || "");
					if (url !== null) {
						onUpdate(value.id, { imageUrl: url || undefined });
					}
				}}
				className={`p-1.5 rounded transition ${value.imageUrl
						? "bg-blue-50 text-blue-600"
						: "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
					}`}
				title={value.imageUrl || "Thêm ảnh"}
			>
				<ImageIcon size={14} />
			</button>

			{value.imageUrl && (
				<img
					src={value.imageUrl}
					alt=""
					className="w-6 h-6 rounded object-cover border border-slate-200"
				/>
			)}

			<button
				type="button"
				onClick={() => onRemove(value.id)}
				className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
			>
				<Trash2 size={14} />
			</button>
		</div>
	);
};

// Sortable Variant Option Component
const SortableOptionItem: React.FC<{
	option: VariantOption;
	basePrice: number;
	onUpdate: (optionId: string, updates: Partial<VariantOption>) => void;
	onUpdateValue: (
		optionId: string,
		valueId: string,
		updates: Partial<VariantValue>,
	) => void;
	onRemove: (optionId: string) => void;
	onAddValue: (optionId: string) => void;
	onRemoveValue: (optionId: string, valueId: string) => void;
	onReorderValues: (optionId: string, activeId: string, overId: string) => void;
}> = ({
	option,
	basePrice,
	onUpdate,
	onUpdateValue,
	onRemove,
	onAddValue,
	onRemoveValue,
	onReorderValues,
}) => {
		const {
			attributes,
			listeners,
			setNodeRef,
			transform,
			transition,
			isDragging,
		} = useSortable({ id: option.id });

		const sensors = useSensors(
			useSensor(PointerSensor),
			useSensor(KeyboardSensor, {
				coordinateGetter: sortableKeyboardCoordinates,
			}),
		);

		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
			opacity: isDragging ? 0.5 : 1,
		};

		const handleValueDragEnd = (event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over.id) {
				onReorderValues(option.id, active.id as string, over.id as string);
			}
		};

		return (
			<div
				ref={setNodeRef}
				style={style}
				className={`bg-slate-50 rounded-xl border border-slate-200 overflow-hidden ${isDragging ? "shadow-xl" : ""
					}`}
			>
				{/* Option Header */}
				<div className="flex items-center gap-2 p-3 bg-white border-b border-slate-100">
					<button
						type="button"
						{...attributes}
						{...listeners}
						className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
					>
						<GripVertical size={16} />
					</button>

					<input
						type="text"
						value={option.name}
						onChange={(e) => onUpdate(option.id, { name: e.target.value })}
						placeholder="Tên biến thể (VD: Size, Màu)"
						className="flex-1 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
					/>

					<label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
						<input
							type="checkbox"
							checked={option.required}
							onChange={(e) =>
								onUpdate(option.id, { required: e.target.checked })
							}
							className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
						/>
						Bắt buộc
					</label>

					<button
						type="button"
						onClick={() => {
							if (confirm("Xóa biến thể này?")) {
								onRemove(option.id);
							}
						}}
						className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
						title="Xóa biến thể"
					>
						<Trash2 size={16} />
					</button>
				</div>

				{/* Values List */}
				<div className="p-3 space-y-2">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleValueDragEnd}
					>
						<SortableContext
							items={option.values.map((v) => v.id)}
							strategy={verticalListSortingStrategy}
						>
							{option.values.map((value) => (
								<SortableValueItem
									key={value.id}
									value={value}
									basePrice={basePrice}
									onUpdate={(valueId, updates) =>
										onUpdateValue(option.id, valueId, updates)
									}
									onRemove={(valueId) => onRemoveValue(option.id, valueId)}
								/>
							))}
						</SortableContext>
					</DndContext>

					<button
						type="button"
						onClick={() => onAddValue(option.id)}
						className="w-full py-2 text-sm text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-dashed border-slate-300 hover:border-orange-300 transition flex items-center justify-center gap-1"
					>
						<Plus size={14} /> Thêm giá trị
					</button>
				</div>
			</div>
		);
	};

// Main VariantManager Component
export const VariantManager: React.FC<VariantManagerProps> = ({
	variants,
	onChange,
	basePrice,
}) => {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleAddOption = () => {
		const newOption = createEmptyVariantOption(variants.length);
		onChange([...variants, newOption]);
	};

	const handleRemoveOption = (optionId: string) => {
		onChange(variants.filter((v) => v.id !== optionId));
	};

	const handleUpdateOption = (
		optionId: string,
		updates: Partial<VariantOption>,
	) => {
		onChange(
			variants.map((v) => (v.id === optionId ? { ...v, ...updates } : v)),
		);
	};

	const handleAddValue = (optionId: string) => {
		onChange(
			variants.map((v) => {
				if (v.id === optionId) {
					const newValue = createEmptyVariantValue(v.values.length);
					return { ...v, values: [...v.values, newValue] };
				}
				return v;
			}),
		);
	};

	const handleRemoveValue = (optionId: string, valueId: string) => {
		onChange(
			variants.map((v) => {
				if (v.id === optionId) {
					return { ...v, values: v.values.filter((val) => val.id !== valueId) };
				}
				return v;
			}),
		);
	};

	const handleUpdateValue = (
		optionId: string,
		valueId: string,
		updates: Partial<VariantValue>,
	) => {
		onChange(
			variants.map((v) => {
				if (v.id === optionId) {
					return {
						...v,
						values: v.values.map((val) =>
							val.id === valueId ? { ...val, ...updates } : val,
						),
					};
				}
				return v;
			}),
		);
	};

	const handleReorderOptions = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = variants.findIndex((v) => v.id === active.id);
			const newIndex = variants.findIndex((v) => v.id === over.id);
			const reordered = arrayMove(variants, oldIndex, newIndex).map(
				(v, idx) => ({ ...v, order: idx }),
			);
			onChange(reordered);
		}
	};

	const handleReorderValues = (
		optionId: string,
		activeId: string,
		overId: string,
	) => {
		onChange(
			variants.map((v) => {
				if (v.id === optionId) {
					const oldIndex = v.values.findIndex((val) => val.id === activeId);
					const newIndex = v.values.findIndex((val) => val.id === overId);
					const reordered = arrayMove(v.values, oldIndex, newIndex).map(
						(val, idx) => ({ ...val, order: idx }),
					);
					return { ...v, values: reordered };
				}
				return v;
			}),
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<span className="block text-sm font-bold text-slate-700">
					Biến thể sản phẩm
				</span>
				<button
					type="button"
					onClick={handleAddOption}
					className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
				>
					<Plus size={16} /> Thêm biến thể
				</button>
			</div>

			{variants.length === 0 ? (
				<div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
					<p>Chưa có biến thể nào</p>
					<p className="text-xs mt-1">
						Thêm biến thể như Size, Màu sắc, Chất liệu...
					</p>
				</div>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleReorderOptions}
				>
					<SortableContext
						items={variants.map((v) => v.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-4">
							{variants.map((option) => (
								<SortableOptionItem
									key={option.id}
									option={option}
									basePrice={basePrice}
									onUpdate={handleUpdateOption}
									onUpdateValue={handleUpdateValue}
									onRemove={handleRemoveOption}
									onAddValue={handleAddValue}
									onRemoveValue={handleRemoveValue}
									onReorderValues={handleReorderValues}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			)}

			{variants.length > 0 && (
				<div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
					<strong>💡 Mẹo:</strong> Kéo thả để sắp xếp thứ tự biến thể và giá
					trị. Giá thay đổi sẽ được cộng/trừ vào giá gốc (
					{basePrice.toLocaleString("vi-VN")}₫).
				</div>
			)}
		</div>
	);
};

export default VariantManager;
