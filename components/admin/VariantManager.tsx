import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { VariantOption, VariantValue } from '../../types';
import { Plus, X, GripVertical, Image as ImageIcon, Trash2 } from 'lucide-react';

interface VariantManagerProps {
    variants: VariantOption[];
    onChange: (variants: VariantOption[]) => void;
}

// --- Sortable Variant Value Item ---
interface SortableValueItemProps {
    value: VariantValue;
    variantId: string;
    onUpdate: (variantId: string, valueId: string, updates: Partial<VariantValue>) => void;
    onRemove: (variantId: string, valueId: string) => void;
}

const SortableValueItem = ({ value, variantId, onUpdate, onRemove }: SortableValueItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: value.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 bg-white p-2 border rounded-md shadow-sm mb-2"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={16} />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                    type="text"
                    value={value.label}
                    onChange={(e) => onUpdate(variantId, value.id, { label: e.target.value })}
                    placeholder="Value name (e.g. Red)"
                    className="border rounded px-2 py-1 text-sm w-full"
                />

                <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm whitespace-nowrap">Price ±:</span>
                    <input
                        type="number"
                        value={value.priceChange}
                        onChange={(e) => onUpdate(variantId, value.id, { priceChange: Number(e.target.value) })}
                        className="border rounded px-2 py-1 text-sm w-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Add Image"
                    // Image upload logic would go here, for now just placeholder or text input
                    onClick={() => {
                        const url = prompt("Enter image URL for this variant value:", value.imageUrl || "");
                        if (url !== null) {
                            onUpdate(variantId, value.id, { imageUrl: url });
                        }
                    }}
                >
                    <ImageIcon size={16} className={value.imageUrl ? "text-blue-500" : ""} />
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(variantId, value.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Remove Value"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

// --- Sortable Variant Option Item ---
interface SortableVariantItemProps {
    variant: VariantOption;
    onUpdate: (id: string, updates: Partial<VariantOption>) => void;
    onRemove: (id: string) => void;
    onUpdateValue: (variantId: string, valueId: string, updates: Partial<VariantValue>) => void;
    onRemoveValue: (variantId: string, valueId: string) => void;
    onAddValue: (variantId: string) => void;
    onReorderValues: (variantId: string, activeId: string, overId: string) => void;
}

const SortableVariantItem = ({
    variant,
    onUpdate,
    onRemove,
    onUpdateValue,
    onRemoveValue,
    onAddValue,
    onReorderValues
}: SortableVariantItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: variant.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1, // Ensure dragging item is on top
        position: 'relative' as const, // Needed for zIndex
    };

    // Sensor for internal DndContext (Values)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorderValues(variant.id, active.id as string, over.id as string);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-gray-50 border rounded-lg p-4 mb-4 shadow-sm"
        >
            {/* Variant Header */}
            <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                </div>

                <div className="flex-1 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 flex-1">
                        <label className="text-sm font-medium text-gray-700">Option Name:</label>
                        <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => onUpdate(variant.id, { name: e.target.value })}
                            placeholder="e.g. Size, Color"
                            className="border rounded px-3 py-1.5 flex-1"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id={`required-${variant.id}`}
                            type="checkbox"
                            checked={variant.required}
                            onChange={(e) => onUpdate(variant.id, { required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <label htmlFor={`required-${variant.id}`} className="cursor-pointer text-sm text-gray-700">
                            Required
                        </label>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onRemove(variant.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                    title="Remove Variant Option"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Variant Values List */}
            <div className="pl-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={variant.values.map(v => v.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {variant.values.map((value) => (
                            <SortableValueItem
                                key={value.id}
                                value={value}
                                variantId={variant.id}
                                onUpdate={onUpdateValue}
                                onRemove={onRemoveValue}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <button
                    type="button"
                    onClick={() => onAddValue(variant.id)}
                    className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded"
                >
                    <Plus size={16} />
                    Add Value
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function VariantManager({ variants, onChange }: VariantManagerProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = variants.findIndex((v) => v.id === active.id);
            const newIndex = variants.findIndex((v) => v.id === over.id);

            const newVariants = arrayMove(variants, oldIndex, newIndex).map((v, idx) => ({
                ...v,
                order: idx
            }));
            onChange(newVariants);
        }
    };

    const addVariant = () => {
        const newVariant: VariantOption = {
            id: uuidv4(),
            name: `Option ${variants.length + 1}`,
            values: [],
            order: variants.length,
            required: true
        };
        onChange([...variants, newVariant]);
    };

    const removeVariant = (id: string) => {
        if (window.confirm('Are you sure you want to delete this variant option? All associated values will be lost.')) {
            onChange(variants.filter(v => v.id !== id));
        }
    };

    const updateVariant = (id: string, updates: Partial<VariantOption>) => {
        onChange(variants.map(v => v.id === id ? { ...v, ...updates } : v));
    };

    const addValue = (variantId: string) => {
        const variant = variants.find(v => v.id === variantId);
        if (!variant) return;

        const newValue: VariantValue = {
            id: uuidv4(),
            label: `Value ${variant.values.length + 1}`,
            priceChange: 0,
            order: variant.values.length
        };

        onChange(variants.map(v => {
            if (v.id === variantId) {
                return { ...v, values: [...v.values, newValue] };
            }
            return v;
        }));
    };

    const removeValue = (variantId: string, valueId: string) => {
        onChange(variants.map(v => {
            if (v.id === variantId) {
                return { ...v, values: v.values.filter(val => val.id !== valueId) };
            }
            return v;
        }));
    };

    const updateValue = (variantId: string, valueId: string, updates: Partial<VariantValue>) => {
        onChange(variants.map(v => {
            if (v.id === variantId) {
                return {
                    ...v,
                    values: v.values.map(val => val.id === valueId ? { ...val, ...updates } : val)
                };
            }
            return v;
        }));
    };

    const reorderValues = (variantId: string, activeId: string, overId: string) => {
        const variantIndex = variants.findIndex(v => v.id === variantId);
        if (variantIndex === -1) return;

        const variant = variants[variantIndex];
        const oldIndex = variant.values.findIndex(v => v.id === activeId);
        const newIndex = variant.values.findIndex(v => v.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newValues = arrayMove(variant.values, oldIndex, newIndex).map((v, idx) => ({
                ...v,
                order: idx
            }));

            const newVariants = [...variants];
            newVariants[variantIndex] = { ...variant, values: newValues };
            onChange(newVariants);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
                <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                    <Plus size={16} />
                    Add Variant Option
                </button>
            </div>

            <div className="space-y-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={variants.map(v => v.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {variants.map((variant) => (
                            <SortableVariantItem
                                key={variant.id}
                                variant={variant}
                                onUpdate={updateVariant}
                                onRemove={removeVariant}
                                onUpdateValue={updateValue}
                                onRemoveValue={removeValue}
                                onAddValue={addValue}
                                onReorderValues={reorderValues}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            {variants.length === 0 && (
                <div className="text-center py-8 bg-gray-50 border border-dashed rounded-lg text-gray-500">
                    <p>No variants configured.</p>
                    <p className="text-sm mt-1">Add options like "Size" or "Color" to create product variations.</p>
                </div>
            )}
        </div>
    );
}
