import { Edit, Plus, Trash2, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
    addCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from "../../services/firebase";
import type { Category } from "../../types";

interface Props {
    onRefresh: () => void; // Optional if we want to refresh parent but we manage local state mostly
}

export const AdminCategories: React.FC<Props> = ({ onRefresh }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>({
        name: "",
        description: "",
    });

    const fetchCategories = async () => {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setLoading(false);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: idk
    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editingId) {
            await updateCategory(editingId, formData);
        } else {
            await addCategory(formData as Omit<Category, "id">);
        }

        setShowModal(false);
        setEditingId(null);
        setFormData({ name: "", description: "" });
        fetchCategories();
        onRefresh(); // Trigger parent refresh if needed
    };

    const handleEdit = (category: Category) => {
        setFormData({ name: category.name, description: category.description || "" });
        setEditingId(category.id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc muốn xóa danh mục này?")) {
            await deleteCategory(id);
            fetchCategories();
            onRefresh();
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: "", description: "" });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-700">Quản Lý Danh Mục</h3>
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition shadow-sm"
                >
                    <Plus size={20} /> Thêm Danh Mục
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4">Tên Danh Mục</th>
                            <th className="p-4">Mô Tả</th>
                            <th className="p-4 text-center w-32">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="p-4 text-center">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-slate-400">
                                    Chưa có danh mục nào.
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50 group">
                                    <td className="p-4 font-bold text-slate-800">{cat.name}</td>
                                    <td className="p-4 text-slate-500">{cat.description}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(cat)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Sửa"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 flex justify-between items-center">
                            {editingId ? "Cập Nhật Danh Mục" : "Thêm Danh Mục Mới"}
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <XCircle size={24} />
                            </button>
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="cat-name"
                                    className="block text-sm font-bold text-slate-700 mb-1"
                                >
                                    Tên Danh Mục
                                </label>
                                <input
                                    id="cat-name"
                                    required
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="cat-desc"
                                    className="block text-sm font-bold text-slate-700 mb-1"
                                >
                                    Mô Tả
                                </label>
                                <textarea
                                    id="cat-desc"
                                    rows={3}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </div>

                            <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200"
                                >
                                    {editingId ? "Cập Nhật" : "Tạo Mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
