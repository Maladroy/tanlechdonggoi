import { useForm } from "@tanstack/react-form";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ArrowRight, Lock, Mail, Phone, ShoppingBag, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  auth,
  createUserProfile,
  getUserProfile,
} from "../services/firebase";
import type { UserProfile } from "../types";

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
  onGuestAccess: () => void;
}

export const AuthGate: React.FC<Props> = ({ onLoginSuccess, onGuestAccess }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if input is a phone number
  const isPhoneNumber = (input: string) => /^[0-9+]{9,15}$/.test(input);

  // Helper to format phone as dummy email
  const getPhoneAsEmail = (phoneNum: string) => `${phoneNum}@tanlech.app`;

  const form = useForm({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);
      setIsLoading(true);

      try {
        if (isRegister) {
          // --- REGISTRATION FLOW ---
          if (!isPhoneNumber(value.phone)) {
            throw { code: "custom/invalid-phone" };
          }
          const emailToRegister = getPhoneAsEmail(value.phone);

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            emailToRegister,
            value.password
          );
          const user = userCredential.user;

          await updateProfile(user, {
            displayName: value.name,
          });

          const userProfile: UserProfile = {
            name: value.name,
            phone: value.phone,
          };

          if (value.email) {
            userProfile.email = value.email.toLowerCase().trim();
          }

          const success = await createUserProfile(user.uid, userProfile);
          if (success) {
            onLoginSuccess(userProfile);
          } else {
            throw { code: "custom/create-profile-failed" };
          }
        } else {
          // --- LOGIN FLOW ---
          let loginEmail = "";

          if (isPhoneNumber(value.phone)) {
            loginEmail = getPhoneAsEmail(value.phone);
          } else {
            throw { code: "custom/invalid-phone" };
          }

          const userCredential = await signInWithEmailAndPassword(
            auth,
            loginEmail,
            value.password
          );
          const user = userCredential.user;

          const profile = await getUserProfile(user.uid);

          if (profile) {
            onLoginSuccess(profile);
          } else {
            onLoginSuccess({
              name: user.displayName || "Khách hàng",
              phone: value.phone,
            });
          }
        }
      } catch (err: any) {
        console.error("Auth Error:", err);
        let msg = "Đã có lỗi xảy ra. Vui lòng thử lại.";

        if (err.code === "custom/invalid-phone") {
          msg = "Số điện thoại không hợp lệ.";
        } else if (err.code === "custom/create-profile-failed") {
          msg = "Không thể tạo hồ sơ người dùng. Vui lòng thử lại.";
        } else if (err.code === "custom/user-not-found") {
          msg = "Email này chưa được đăng ký.";
        } else if (err.code === "auth/email-already-in-use") {
          msg = "Số điện thoại này đã được đăng ký.";
        } else if (
          err.code === "auth/user-not-found" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/invalid-credential"
        ) {
          msg = "Tài khoản hoặc mật khẩu không chính xác.";
        } else if (err.code === "auth/weak-password") {
          msg = "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
        }
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <div className="relative bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-orange-600">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-orange-600 w-24 h-24 rounded-full flex items-center justify-center border-4 border-orange-600 shadow-lg">
          <ShoppingBag size={40} />
        </div>

        <div className="mt-12 text-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            Tân Lếch <span className="text-orange-600">Đóng Gói</span>
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            {isRegister
              ? "Đăng ký thành viên để săn Combo giá sốc!"
              : "Đăng nhập để xem đơn hàng và ưu đãi"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200 text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
              form.reset();
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isRegister
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Đăng Ký
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
              form.reset();
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isRegister
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Đăng Nhập
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {isRegister ? (
            <>
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
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${field.state.meta.errors.length
                        ? "border-red-500"
                        : "border-gray-200"
                        } rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium`}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-xs text-red-500 mt-1 block px-2">
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      placeholder="Email (Tùy chọn)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="phone"
                validators={{
                  onChange: ({ value }) =>
                    !isPhoneNumber(value)
                      ? "Số điện thoại không hợp lệ"
                      : undefined,
                }}
              >
                {(field) => (
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại (Bắt buộc)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${field.state.meta.errors.length
                        ? "border-red-500"
                        : "border-gray-200"
                        } rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium`}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-xs text-red-500 mt-1 block px-2">
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </form.Field>
            </>
          ) : (
            <form.Field
              name="phone"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Vui lòng nhập số điện thoại" : undefined,
              }}
            >
              {(field) => (
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="tel"
                    placeholder="Số điện thoại"
                    autoComplete={isRegister ? "" : "on"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${field.state.meta.errors.length
                      ? "border-red-500"
                      : "border-gray-200"
                      } rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium`}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-red-500 mt-1 block px-2">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </form.Field>
          )}

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value.length < 6
                  ? "Mật khẩu phải có ít nhất 6 ký tự"
                  : undefined,
            }}
          >
            {(field) => (
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${field.state.meta.errors.length
                    ? "border-red-500"
                    : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium`}
                />
                {field.state.meta.errors.length > 0 && (
                  <span className="text-xs text-red-500 mt-1 block px-2">
                    {field.state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit]) => (
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-300 hover:bg-orange-600 transition transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <>
                    {isRegister ? "Hoàn Tất Đăng Ký" : "Đăng Nhập Ngay"}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            )}
          </form.Subscribe>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onGuestAccess}
            className="text-gray-500 text-sm hover:text-orange-600 font-medium underline transition"
          >
            Tiếp tục mà không cần đăng ký
          </button>
        </div>
      </div>
    </div>
  );
};
