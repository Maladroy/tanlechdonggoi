import { RefreshCw } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  getCombos,
  getCoupons,
  getOrders,
  getUsers,
} from "../services/firebase";
import type { Combo, Coupon, Order, UserProfile } from "../types";
import { AdminCombos } from "./admin/AdminCombos";
import { AdminCoupons } from "./admin/AdminCoupons";
import { AdminOrders } from "./admin/AdminOrders";
import { AdminSidebar } from "./admin/AdminSidebar";
import { AdminUsers } from "./admin/AdminUsers";

interface Props {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<
    "orders" | "combos" | "coupons" | "users"
  >("orders");

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
      />

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

        {activeTab === "orders" && (
          <AdminOrders orders={orders} onRefresh={refreshData} />
        )}
        {activeTab === "combos" && (
          <AdminCombos combos={combos} onRefresh={refreshData} />
        )}
        {activeTab === "coupons" && (
          <AdminCoupons
            coupons={coupons}
            combos={combos}
            onRefresh={refreshData}
          />
        )}
        {activeTab === "users" && <AdminUsers users={users} orders={orders} />}
      </div>
    </div>
  );
};
