import {
  CheckCircle,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  addCombo,
  addCoupon,
  deleteCombo,
  deleteCoupon,
  getCombos,
  getCoupons,
  getOrders,
  seedDatabase,
  updateOrderStatus,
} from "../services/firebase";
import type { Combo, Coupon, Order } from "../types";

interface Props {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<"orders" | "combos" | "coupons">(
    "orders",
  );

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms State
  const [showAddCombo, setShowAddCombo] = useState(false);
  const [newCombo, setNewCombo] = useState<Partial<Combo>>({
    name: "",
    description: "",
    price: 0,
    originalPrice: 0,
    imageUrl: "",
    tags: [],
    items: [],
  });
  const [itemsInput, setItemsInput] = useState("");

  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: "",
    desc: "",
    color: "from-blue-500 to-cyan-500",
    expiryDate: "",
  });

  const refreshData = async () => {
    setLoading(true);
    const [o, c, cp] = await Promise.all([
      getOrders(),
      getCombos(),
      getCoupons(),
    ]);
    setOrders(o);
    setCombos(c);
    setCoupons(cp);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleStatusUpdate = async (
    id: string,
    status: "pending" | "confirmed" | "cancelled",
  ) => {
    await updateOrderStatus(id, status);
    refreshData();
  };

  const handleAddCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = itemsInput.split(",").map((i) => i.trim());
    await addCombo({
      ...(newCombo as any),
      items,
      tags: ["Mới"],
    });
    setShowAddCombo(false);
    setNewCombo({
      name: "",
      description: "",
      price: 0,
      originalPrice: 0,
      imageUrl: "",
      tags: [],
      items: [],
    });
    setItemsInput("");
    refreshData();
  };

  const handleDeleteCombo = async (id: string) => {
    if (confirm("Xóa combo này?")) {
      await deleteCombo(id);
      refreshData();
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCoupon(newCoupon as any);
    setShowAddCoupon(false);
    setNewCoupon({
      code: "",
      desc: "",
      color: "from-blue-500 to-cyan-500",
      expiryDate: "",
    });
    refreshData();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Xóa mã này?")) {
      await deleteCoupon(id);
      refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-orange-500 tracking-tight">
            Tấn Lệch Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "orders" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
          >
            <ShoppingCart size={20} /> Đơn Hàng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("combos")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "combos" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
          >
            <Package size={20} /> Quản Lý Combo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "coupons" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
          >
            <Tag size={20} /> Mã Giảm Giá
          </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            type="button"
            onClick={seedDatabase}
            className="text-xs text-slate-500 hover:text-white mb-4 block w-full text-left"
          >
            🛠 Seed Mock Data
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition"
          >
            <LogOut size={18} /> Đăng Xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === "orders" && "Danh Sách Đơn Hàng"}
            {activeTab === "combos" && "Kho Combo Hàng Hóa"}
            {activeTab === "coupons" && "Quản Lý Khuyến Mãi"}
          </h2>
          <button
            type="button"
            onClick={refreshData}
            className="p-2 bg-white rounded-full shadow hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-slate-500">Chưa có đơn hàng nào.</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-slate-800">
                        #{order.id}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          order.status === "confirmed"
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
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>
                        Khách: <strong>{order.user.name}</strong> -{" "}
                        {order.user.phone}
                      </p>
                      <p>
                        Tổng tiền:{" "}
                        <strong className="text-orange-600">
                          {order.total.toLocaleString()}đ
                        </strong>
                        {order.appliedCoupon && (
                          <span className="text-slate-400 ml-2">
                            (Code: {order.appliedCoupon})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3 pl-4 border-l-2 border-slate-100">
                      {order.items.map((item) => (
                        <p key={item.id} className="text-xs text-slate-500">
                          - {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id!, "confirmed")}
                      className="bg-green-50 text-green-600 p-2 rounded hover:bg-green-100"
                      title="Chốt đơn"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id!, "cancelled")}
                      className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100"
                      title="Hủy đơn"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* COMBOS TAB */}
        {activeTab === "combos" && (
          <div>
            <button
              type="button"
              onClick={() => setShowAddCombo(true)}
              className="mb-6 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition"
            >
              <Plus size={20} /> Thêm Combo Mới
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={combo.imageUrl}
                      alt={combo.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteCombo(combo.id)}
                      className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800">{combo.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 my-2">
                      {combo.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-orange-600">
                        {combo.price.toLocaleString()}đ
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        {combo.originalPrice.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Combo Modal */}
            {showAddCombo && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4">Thêm Combo Mới</h3>
                  <form onSubmit={handleAddCombo} className="space-y-4">
                    <input
                      required
                      placeholder="Tên Combo"
                      className="w-full p-2 border rounded"
                      value={newCombo.name}
                      onChange={(e) =>
                        setNewCombo({ ...newCombo, name: e.target.value })
                      }
                    />
                    <textarea
                      required
                      placeholder="Mô tả hấp dẫn"
                      className="w-full p-2 border rounded"
                      value={newCombo.description}
                      onChange={(e) =>
                        setNewCombo({
                          ...newCombo,
                          description: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-4">
                      <input
                        required
                        type="number"
                        placeholder="Giá bán"
                        className="w-1/2 p-2 border rounded"
                        value={newCombo.price || ""}
                        onChange={(e) =>
                          setNewCombo({
                            ...newCombo,
                            price: Number(e.target.value),
                          })
                        }
                      />
                      <input
                        required
                        type="number"
                        placeholder="Giá gốc"
                        className="w-1/2 p-2 border rounded"
                        value={newCombo.originalPrice || ""}
                        onChange={(e) =>
                          setNewCombo({
                            ...newCombo,
                            originalPrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <input
                      required
                      placeholder="URL Hình ảnh"
                      className="w-full p-2 border rounded"
                      value={newCombo.imageUrl}
                      onChange={(e) =>
                        setNewCombo({ ...newCombo, imageUrl: e.target.value })
                      }
                    />
                    <input
                      required
                      placeholder="Các món (cách nhau bởi dấu phẩy)"
                      className="w-full p-2 border rounded"
                      value={itemsInput}
                      onChange={(e) => setItemsInput(e.target.value)}
                    />
                    <div className="flex gap-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddCombo(false)}
                        className="flex-1 py-2 text-slate-500"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-orange-600 text-white py-2 rounded font-bold"
                      >
                        Lưu Combo
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === "coupons" && (
          <div>
            <button
              type="button"
              onClick={() => setShowAddCoupon(true)}
              className="mb-6 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition"
            >
              <Plus size={20} /> Tạo Mã Mới
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`p-4 rounded-xl text-white bg-gradient-to-r ${coupon.color} relative group`}
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(coupon.id!)}
                    className="absolute top-2 right-2 p-1 bg-white/20 rounded-full hover:bg-white/40 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                  <h3 className="font-bold text-xl">{coupon.code}</h3>
                  <p className="opacity-90">{coupon.desc}</p>
                  <p className="text-xs mt-2 opacity-75 font-mono">
                    HSD: {new Date(coupon.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Add Coupon Modal */}
            {showAddCoupon && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">Tạo Mã Giảm Giá</h3>
                  <form onSubmit={handleAddCoupon} className="space-y-4">
                    <input
                      required
                      placeholder="MÃ CODE (VD: TET2024)"
                      className="w-full p-2 border rounded uppercase"
                      value={newCoupon.code}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                    />
                    <input
                      required
                      placeholder="Mô tả ngắn"
                      className="w-full p-2 border rounded"
                      value={newCoupon.desc}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, desc: e.target.value })
                      }
                    />
                    <input
                      required
                      type="date"
                      className="w-full p-2 border rounded"
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

                    <label
                      htmlFor="coupon-color"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Màu sắc thẻ
                    </label>
                    <select
                      id="coupon-color"
                      className="w-full p-2 border rounded"
                      value={newCoupon.color}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, color: e.target.value })
                      }
                    >
                      <option value="from-pink-500 to-rose-500">
                        Hồng - Đỏ
                      </option>
                      <option value="from-blue-400 to-indigo-500">
                        Xanh Dương
                      </option>
                      <option value="from-amber-400 to-orange-500">
                        Cam - Vàng
                      </option>
                      <option value="from-emerald-400 to-teal-500">
                        Xanh Lá
                      </option>
                      <option value="from-purple-500 to-indigo-600">Tím</option>
                    </select>

                    <div className="flex gap-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddCoupon(false)}
                        className="flex-1 py-2 text-slate-500"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-orange-600 text-white py-2 rounded font-bold"
                      >
                        Lưu Mã
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
