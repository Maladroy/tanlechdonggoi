import { Download } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import type { Order, UserProfile } from "../../types";

interface Props {
	users: UserProfile[];
	orders: Order[];
}

export const AdminUsers: React.FC<Props> = ({ users, orders }) => {
	const customerList = useMemo(() => {
		const list: Record<
			string,
			{
				name: string;
				phone: string;
				type: "Potential" | "Customer" | "Loyal";
				totalOrders: number;
				totalSpent: number;
				lastOrderDate?: string;
			}
		> = {};

		// 1. Initialize with registered users (excluding admins)
		users.forEach((u) => {
			if (!u.phone || u.isAdmin) return; // Filter out admins
			list[u.phone] = {
				name: u.name,
				phone: u.phone,
				type: "Customer",
				totalOrders: 0,
				totalSpent: 0,
			};
		});

		// 2. Process orders
		orders.forEach((o) => {
			const key = o.user.phone;
			if (!key) return;

			if (!list[key]) {
				// New person (must be guest/potential)
				// Check if this potential user matches an admin (unlikely but safe to check)
				const isAdmin = users.some((u) => u.phone === key && u.isAdmin);
				if (isAdmin) return;

				list[key] = {
					name: o.user.name,
					phone: o.user.phone,
					type: "Potential",
					totalOrders: 0,
					totalSpent: 0,
				};
			}

			// Update stats
			if (o.status !== "cancelled") {
				list[key].totalOrders += 1;
				list[key].totalSpent += o.total;

				// Track last order date
				if (
					!list[key].lastOrderDate ||
					new Date(o.createdAt) > new Date(list[key].lastOrderDate)
				) {
					list[key].lastOrderDate = o.createdAt;
				}
			}

			// Update Status logic
			const isActuallyRegistered = users.some((u) => u.phone === key);

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
			const typeScore = { Loyal: 3, Customer: 2, Potential: 1 };
			const scoreDiff = typeScore[b.type] - typeScore[a.type];
			if (scoreDiff !== 0) return scoreDiff;
			return b.totalSpent - a.totalSpent;
		});
	}, [users, orders]);

	const handleExportCSV = () => {
		const headers = [
			"Tên,Số Điện Thoại,Loại Khách,Tổng Đơn,Tổng Chi Tiêu,Lần Cuối Mua",
		];
		const rows = customerList.map((c) =>
			[
				`"${c.name}"`,
				`"${c.phone}"`,
				c.type === "Loyal"
					? "Khách Hàng Thân Thiết"
					: c.type === "Customer"
						? "Khách Hàng"
						: "Khách Tiềm Năng",
				c.totalOrders,
				c.totalSpent,
				c.lastOrderDate
					? new Date(c.lastOrderDate).toLocaleDateString("vi-VN")
					: "Chưa mua",
			].join(","),
		);

		const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // Add BOM for Excel
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute(
			"download",
			`danh_sach_khach_hang_${new Date().toISOString().slice(0, 10)}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div>
			<div className="flex justify-end mb-4">
				<button
					type="button"
					onClick={handleExportCSV}
					className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
				>
					<Download size={20} /> Xuất Excel/CSV
				</button>
			</div>
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
								<td className="p-4 font-mono">{customer.phone}</td>
								<td className="p-4">
									<span
										className={`px-2 py-1 rounded-full text-xs font-bold border ${
											customer.type === "Loyal"
												? "bg-orange-100 text-orange-700 border-orange-200"
												: customer.type === "Customer"
													? "bg-blue-100 text-blue-700 border-blue-200"
													: "bg-gray-100 text-gray-700 border-gray-200"
										}`}
									>
										{customer.type === "Loyal"
											? "👑 Khách Hàng Thân Thiết"
											: customer.type === "Customer"
												? "👤 Khách Hàng"
												: "🛍️ Khách Tiềm Năng"}
									</span>
								</td>
								<td className="p-4 text-right">{customer.totalOrders}</td>
								<td className="p-4 text-right font-bold text-slate-700">
									{customer.totalSpent.toLocaleString()}đ
								</td>
								<td className="p-4 text-xs text-slate-500">
									{customer.lastOrderDate
										? new Date(customer.lastOrderDate).toLocaleDateString()
										: "Chưa mua"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
