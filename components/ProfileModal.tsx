import { useForm } from "@tanstack/react-form";
import { Mail, Phone, Save, User, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { UserProfile } from "../types";

interface Props {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (data: Partial<UserProfile>) => Promise<boolean>;
    onLogout: () => void;
}

export const ProfileModal: React.FC<Props> = ({
    user,
    isOpen,
    onClose,
    onUpdate,
    onLogout,
}) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const form = useForm({
        defaultValues: {
            name: user.name,
            phone: user.phone,
            email: user.email || "",
            dob: user.dob || "",
            gender: user.gender || "other",
        },
        onSubmit: async ({ value }) => {
            setLoading(true);
            setMessage(null);

            const success = await onUpdate({
                name: value.name,
                phone: value.phone,
                email: value.email,
                dob: value.dob,
                gender: value.gender as "male" | "female" | "other",
            });
            setLoading(false);

            if (success) {
                setMessage({ type: "success", text: "Cập nhật thành công!" });
                setTimeout(() => {
                    setMessage(null);
                    onClose();
                }, 1500);
            } else {
                setMessage({ type: "error", text: "Có lỗi xảy ra. Vui lòng thử lại." });
            }
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User size={24} /> Hồ Sơ Của Bạn
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="hover:bg-orange-700 p-1 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {message && (
                        <div
                            className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === "success"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="space-y-4"
                    >
                        <form.Field
                            name="name"
                            validators={{
                                onChange: ({ value }) =>
                                    value.trim().split(/\s+/).length < 2
                                        ? "Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 từ)."
                                        : undefined,
                            }}
                        >
                            {(field) => (
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Họ và tên
                                    </label>
                                    <div className="relative">
                                        <User
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            id="name"
                                            type="text"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className={`w-full pl-10 p-3 bg-gray-50 border ${field.state.meta.errors.length
                                                ? "border-red-500"
                                                : "border-gray-200"
                                                } rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none`}
                                        />
                                    </div>
                                    {field.state.meta.errors.length > 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {field.state.meta.errors.join(", ")}
                                        </p>
                                    )}
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="phone">
                            {(field) => (
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Số điện thoại
                                    </label>
                                    <div className="relative">
                                        <Phone
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="email">
                            {(field) => (
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </form.Field>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field name="dob">
                                {(field) => (
                                    <div>
                                        <label
                                            htmlFor="dob"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Ngày sinh
                                        </label>
                                        <input
                                            id="dob"
                                            type="date"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="gender">
                                {(field) => (
                                    <div>
                                        <label
                                            htmlFor="gender"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Giới tính
                                        </label>
                                        <select
                                            id="gender"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value as "male" | "female" | "other")}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        >
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                            >
                                {([canSubmit, isSubmitting]) => (
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || loading}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        ) : (
                                            <>
                                                <Save size={20} /> Lưu Thay Đổi
                                            </>
                                        )}
                                    </button>
                                )}
                            </form.Subscribe>

                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                            >
                                Đăng Xuất
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
