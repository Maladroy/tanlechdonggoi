import {
	Layers,
	LogOut,
	Package,
	Settings,
	ShoppingCart,
	Tag,
	Users,
} from "lucide-react";
import type React from "react";

export type AdminTab =
	| "orders"
	| "combos"
	| "coupons"
	| "users"
	| "categories"
	| "settings";

interface Props {
	activeTab: AdminTab;
	setActiveTab: (tab: AdminTab) => void;
	onLogout: () => void;
}

export const AdminSidebar: React.FC<Props> = ({
	activeTab,
	setActiveTab,
	onLogout,
}) => {
	return (
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
					className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
						activeTab === "orders"
							? "bg-orange-600 text-white"
							: "text-slate-400 hover:bg-slate-800"
					}`}
				>
					<ShoppingCart size={20} /> Đơn Hàng
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("combos")}
					className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
						activeTab === "combos"
							? "bg-orange-600 text-white"
							: "text-slate-400 hover:bg-slate-800"
					}`}
				>
					<Package size={20} /> Quản Lý Combo
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("categories")}
					className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
						activeTab === "categories"
							? "bg-orange-600 text-white"
							: "text-slate-400 hover:bg-slate-800"
					}`}
				>
					<Layers size={20} /> Danh Mục
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("coupons")}
					className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
						activeTab === "coupons"
							? "bg-orange-600 text-white"
							: "text-slate-400 hover:bg-slate-800"
					}`}
				>
					<Tag size={20} /> Mã Giảm Giá
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("users")}
					className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
						activeTab === "users"
							? "bg-orange-600 text-white"
							: "text-slate-400 hover:bg-slate-800"
					}`}
				>
					<Users size={20} /> Khách Hàng
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("settings")}
					className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
						activeTab === "settings"
							? "bg-orange-600 text-white"
							: "text-slate-400 hover:bg-slate-800"
					}`}
				>
					<Settings size={20} /> Cài Đặt
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
	);
};
