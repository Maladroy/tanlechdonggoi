import { Check, Phone } from "lucide-react";
import type React from "react";
import type { UserProfile } from "../types";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	user: UserProfile | null;
}

export const OrderSuccessModal: React.FC<Props> = ({
	isOpen,
	onClose,
	user,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-70 flex items-center justify-center p-4">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm w-full h-full border-none cursor-default"
				onClick={onClose}
				aria-label="Close modal"
			/>

			<div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-float pointer-events-auto">
				<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<Check size={40} className="text-green-600" />
				</div>
				<h2 className="text-2xl font-black text-gray-900 mb-2">
					Đặt Hàng Thành Công!
				</h2>
				<p className="text-gray-500 mb-6">
					Cảm ơn <strong>{user?.name}</strong>. Nhân viên Tân Lếch Đóng Gói sẽ
					liên hệ qua số điện thoại{" "}
					<strong className="text-orange-600">{user?.phone}</strong> để chốt đơn
					trong ít phút nữa.
				</p>

				<div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
					<p className="text-xs text-orange-800 font-bold flex items-center justify-center gap-2">
						<Phone size={14} /> Hỗ trợ: 090.123.4567
					</p>
				</div>

				<button
					type="button"
					onClick={onClose}
					className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
				>
					Đã Hiểu, Cảm Ơn Shop!
				</button>
			</div>
		</div>
	);
};
