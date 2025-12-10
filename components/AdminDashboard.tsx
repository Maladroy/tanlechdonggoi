import {
  Edit,
  Eye,
  Filter,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  addCombo,
  addCoupon,
  deleteCombo,
  deleteCoupon,
  getCombos,
  getCoupons,
  getOrders,
  getUsers,
  updateCombo,
  updateCoupon,
  updateOrderStatus,
} from "../services/firebase";
import type { Combo, ComboStatus, Coupon, Order, TupleSort, UserProfile } from "../types";

interface Props {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<"orders" | "combos" | "coupons" | "users">(
    "orders"
  );

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Sort State
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [sortConfig, setSortConfig] = useState<{
    key: "createdAt" | "total" | "status" | "customer" | "id";
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Forms State
  const [showAddCombo, setShowAddCombo] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
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

  const refreshData = async () => {
    setLoading(true);
    const [o, c, cp, u] = await Promise.all([
      getOrders(),
      getCombos(),
      getCoupons(),
      getUsers(),
    ]);
    setOrders(o);
    setCombos(c);
    setCoupons(cp);
    setUsers(u);
    setLoading(false);
  };

  // eslint-disable-line react-hooks/exhaustive-deps
  // biome-ignore lint/correctness/useExhaustiveDependencies: <NONE>
  useEffect(() => {
    refreshData();
  }, []);

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
          o.user.phone.includes(lower)
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
    key: "createdAt" | "total" | "status" | "customer" | "id"
  ) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusUpdate = async (
    id: string,
    status: "pending" | "confirmed" | "cancelled"
  ) => {
    await updateOrderStatus(id, status);
    refreshData();
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = itemsInput.split(",").map((i) => i.trim());
    const comboData = {
      ...(newCombo as Omit<Combo, "id">),
      items,
      tags: newCombo.tags?.length ? newCombo.tags : ["Mới"],
      status: newCombo.status || "available",
    };

    if (editingComboId) {
      await updateCombo(editingComboId, comboData);
    } else {
      await addCombo(comboData);
    }

    closeComboModal();
    refreshData();
  };

  const openEditCombo = (combo: Combo) => {
    setNewCombo(combo);
    setItemsInput(combo.items.join(", "));
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
    });
    setItemsInput("");
  };

  const handleDeleteCombo = async (id: string) => {
    if (confirm("Xóa combo này?")) {
      await deleteCombo(id);
      refreshData();
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCouponId) {
      await updateCoupon(editingCouponId, newCoupon);
    } else {
      await addCoupon(newCoupon as Omit<Coupon, "id">);
    }
    closeCouponModal();
    refreshData();
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
      refreshData();
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

  const customerList = useMemo(() => {
    const list: Record<string, {
      name: string;
      phone: string;
      type: "Potential" | "Customer" | "Loyal";
      totalOrders: number;
      totalSpent: number;
      lastOrderDate?: string;
    }> = {};

    // 1. Initialize with registered users
    users.forEach(u => {
      if (!u.phone) return;
      list[u.phone] = {
        name: u.name,
        phone: u.phone,
        type: "Customer",
        totalOrders: 0,
        totalSpent: 0
      };
    });

    // 2. Process orders
    orders.forEach(o => {
      const key = o.user.phone;
      if (!key) return;

      if (!list[key]) {
        // New person (must be guest/potential)
        list[key] = {
          name: o.user.name,
          phone: o.user.phone,
          type: "Potential",
          totalOrders: 0,
          totalSpent: 0
        };
      }

      // Update stats
      if (o.status !== "cancelled") {
        list[key].totalOrders += 1;
        list[key].totalSpent += o.total;

        // Track last order date
        if (!list[key].lastOrderDate || new Date(o.createdAt) > new Date(list[key].lastOrderDate)) {
          list[key].lastOrderDate = o.createdAt;
        }
      }

      // Update Status logic
      const isActuallyRegistered = users.some(u => u.phone === key);

      if (isActuallyRegistered) {
        if (list[key].totalOrders > 0) {
          list[key].type = "Loyal";
        } else {
          list[key].type = "Customer";
        }
      } else {
        list[key].type = "Potential";
      }
    });

    return Object.values(list).sort((a, b) => {
      // Sort by loyal > customer > potential, then by spend
      const typeScore = { "Loyal": 3, "Customer": 2, "Potential": 1 };
      const scoreDiff = typeScore[b.type] - typeScore[a.type];
      if (scoreDiff !== 0) return scoreDiff;
      return b.totalSpent - a.totalSpent;
    });
  }, [users, orders]);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-orange-500 tracking-tight">
            Tân Lếch Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "orders"
              ? "bg-orange-600 text-white"
              : "text-slate-400 hover:bg-slate-800"
              }`}
          >
            <ShoppingCart size={20} /> Đơn Hàng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("combos")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "combos"
              ? "bg-orange-600 text-white"
              : "text-slate-400 hover:bg-slate-800"
              }`}
          >
            <Package size={20} /> Quản Lý Combo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "coupons"
              ? "bg-orange-600 text-white"
              : "text-slate-400 hover:bg-slate-800"
              }`}
          >
            <Tag size={20} /> Mã Giảm Giá
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === "users"
              ? "bg-orange-600 text-white"
              : "text-slate-400 hover:bg-slate-800"
              }`}
          >
            <Users size={20} /> Khách Hàng
          </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
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
            {activeTab === "users" && "Danh Sách Khách Hàng"}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshData}
              className="p-2 bg-white rounded-full shadow hover:bg-slate-50 text-slate-600"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
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
                      e.target.value as
                      | "all"
                      | "pending"
                      | "confirmed"
                      | "cancelled"
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
                        <td
                          colSpan={7}
                          className="p-8 text-center text-slate-500"
                        >
                          Không tìm thấy đơn hàng nào.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="p-4 font-mono text-xs">
                            {order.id?.slice(0, 8)}...
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
                            {new Date(order.createdAt).toLocaleDateString()}{" "}
                            <br />
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
                                className={`text-xs border rounded p-1 outline-none font-bold ${order.status === 'confirmed' ? 'text-green-600 border-green-200 bg-green-50' :
                                  order.status === 'cancelled' ? 'text-red-600 border-red-200 bg-red-50' :
                                    'text-yellow-600 border-yellow-200 bg-yellow-50'
                                  }`}
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value as "pending" | "confirmed" | "cancelled")}
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
          </div>
        )}

        {/* COMBOS TAB */}
        {activeTab === "combos" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-700">
                Danh Sách Sản Phẩm
              </h3>
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
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Giá Bán</th>
                    <th className="p-4 text-right">Giá Gốc</th>
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
                        <div className="font-bold text-slate-800">
                          {combo.name}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          {combo.description}
                        </div>
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
                      <td className="p-4 text-right text-slate-400 line-through">
                        {combo.originalPrice > 0
                          ? `${combo.originalPrice.toLocaleString()}đ`
                          : "-"}
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
                <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                    <div>
                      <label
                        htmlFor="combo-name"
                        className="block text-sm font-bold text-slate-700 mb-1"
                      >
                        Tên Combo
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
                    <div>
                      <label
                        htmlFor="combo-desc"
                        className="block text-sm font-bold text-slate-700 mb-1"
                      >
                        Mô tả
                      </label>
                      <textarea
                        id="combo-desc"
                        required
                        rows={3}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        value={newCombo.description}
                        onChange={(e) =>
                          setNewCombo({
                            ...newCombo,
                            description: e.target.value,
                          })
                        }
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
                      />
                    </div>
                    <div>
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
                                (id) =>
                                  combos.find((c) => c.id === id)?.name || id
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
                          placeholder={
                            newCoupon.type === "percent" ? "10" : "50000"
                          }
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
                              checked={newCoupon.applicableCombos?.includes(
                                combo.id
                              )}
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
                        <option value="from-purple-500 to-indigo-600">
                          Tím
                        </option>
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
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Số Điện Thoại</th>
                  <th className="p-4">Loại Khách</th>
                  <th className="p-4 text-right">Tổng Đơn</th>
                  <th className="p-4 text-right">Tổng Chi Tiêu</th>
                  <th className="p-4">Lần Cuối Mua</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerList.map((customer) => (
                  <tr key={customer.phone} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">
                      {customer.name}
                    </td>
                    <td className="p-4 font-mono">
                      {customer.phone}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${customer.type === "Loyal" ? "bg-orange-100 text-orange-700 border-orange-200" :
                        customer.type === "Customer" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }`}>
                        {customer.type === "Loyal" ? "👑 Khách Hàng Thân Thiết" :
                          customer.type === "Customer" ? "👤 Khách Hàng" :
                            "🛍️ Khách Tiềm Năng"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {customer.totalOrders}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">
                      {customer.totalSpent.toLocaleString()}đ
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "Chưa mua"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                Chi Tiết Đơn Hàng #{selectedOrder.id?.slice(0, 8)}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-8">
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
                      <span className="text-gray-500 block text-xs">Họ tên</span>
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
                        <span className="text-gray-500 block text-xs">Email</span>
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
                          <span className="text-gray-500 block text-xs">Địa chỉ</span>
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
                          <span className="text-gray-500 block text-xs">Mã bưu điện</span>
                          <span className="font-mono text-gray-700">
                            {selectedOrder.shippingAddress.zipCode}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Không có địa chỉ giao hàng</p>
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
                                0
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
                <span className="text-sm text-gray-500 font-bold">Cập nhật trạng thái:</span>
                <select
                  className={`text-sm border rounded-lg px-3 py-2 outline-none font-bold cursor-pointer ${selectedOrder.status === 'confirmed' ? 'text-green-600 border-green-200 bg-green-50' :
                    selectedOrder.status === 'cancelled' ? 'text-red-600 border-red-200 bg-red-50' :
                      'text-yellow-600 border-yellow-200 bg-yellow-50'
                    }`}
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value as "pending" | "confirmed" | "cancelled")}
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
