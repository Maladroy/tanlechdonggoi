import { useForm } from "@tanstack/react-form";
import {
  type ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
} from "firebase/auth";
import { ArrowRight, Loader2, Phone, ShoppingBag, User } from "lucide-react";
import type React from "react";
import { useEffect, useState, useRef } from "react";
import { auth, createUserProfile, getUserProfile } from "../services/firebase";
import type { UserProfile } from "../types";

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
  onGuestAccess: () => void;
}

export const AuthGate: React.FC<Props> = ({
  onLoginSuccess,
  onGuestAccess,
}) => {
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Refs for reCaptcha
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize Recaptcha
    if (!recaptchaVerifierRef.current && auth) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          },
          "expired-callback": () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            setError("ReCAPTCHA hết hạn, vui lòng thử lại.");
          },
        });
      } catch (e) {
        console.error("Recaptcha Init Error", e);
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleSendOtp = async (phone: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Format phone number: +84...
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith("0")) {
        formattedPhone = `+84${formattedPhone.substring(1)}`;
      } else if (!formattedPhone.startsWith("+")) {
        formattedPhone = `+84${formattedPhone}`;
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error("Recaptcha not initialized");
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(confirmation);
      setPhoneNumber(formattedPhone);
      setStep("otp");
    } catch (err: any) {
      console.error("Send OTP Error:", err);
      let msg = "Không thể gửi mã OTP. Vui lòng kiểm tra số điện thoại.";
      if (err.code === "auth/invalid-phone-number") {
        msg = "Số điện thoại không hợp lệ.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Quá nhiều yêu cầu. Vui lòng thử lại sau.";
      }
      setError(msg);
      // Reset recaptcha
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
        // Re-init happens via useEffect dependency? No, need to manually re-init or just reload page logic. 
        // Ideally we just clear it and let the user try again which might trigger re-render if we handled it that way, 
        // but here we just rely on the existing instance or create new one next time?
        // Actually, verifying again usually requires a reset.
        // Let's just create a new one next time the component mounts or just simple reload.
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!confirmationResult) throw new Error("No confirmation result");

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Check if user has profile
      const profile = await getUserProfile(user.uid);

      if (profile) {
        onLoginSuccess(profile);
      } else {
        // New user, go to profile creation
        setStep("profile");
      }
    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      setError("Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (name: string, email?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");

      await updateProfile(user, { displayName: name });

      const newProfile: UserProfile = {
        name,
        phone: phoneNumber,
        email: email || undefined
      };

      const success = await createUserProfile(user.uid, newProfile);
      if (success) {
        onLoginSuccess(newProfile);
      } else {
        throw new Error("Failed to create profile");
      }

    } catch (err) {
      console.error("Profile Update Error", err);
      setError("Không thể cập nhật thông tin. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  // Forms
  const phoneForm = useForm({
    defaultValues: { phone: "" },
    onSubmit: async ({ value }) => handleSendOtp(value.phone),
  });

  const otpForm = useForm({
    defaultValues: { otp: "" },
    onSubmit: async ({ value }) => handleVerifyOtp(value.otp),
  });

  const profileForm = useForm({
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => handleUpdateProfile(value.name, value.email),
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
            {step === "phone" && "Nhập số điện thoại để tiếp tục"}
            {step === "otp" && "Nhập mã OTP vừa được gửi đến bạn"}
            {step === "profile" && "Hoàn tất thông tin của bạn"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200 text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        {/* Recaptcha Container */}
        <div id="recaptcha-container"></div>

        {step === "phone" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              phoneForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <phoneForm.Field
              name="phone"
              validators={{
                onChange: ({ value }) =>
                  !value || value.length < 9
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
                    placeholder="Số điện thoại (VD: 0912345678)"
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
            </phoneForm.Field>

            <phoneForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-300 hover:bg-orange-600 transition transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Gửi Mã OTP <ArrowRight size={20} />
                    </>
                  )}
                </button>
              )}
            </phoneForm.Subscribe>
          </form>
        )}

        {step === "otp" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              otpForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <otpForm.Field
              name="otp"
              validators={{
                onChange: ({ value }) =>
                  value.length !== 6 ? "Mã OTP phải có 6 chữ số" : undefined,
              }}
            >
              {(field) => (
                <div className="text-center">
                  <input
                    type="text"
                    placeholder="------"
                    maxLength={6}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full text-center text-3xl tracking-[1em] font-mono py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-red-500 mt-1 block px-2">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </otpForm.Field>

            <otpForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-300 hover:bg-orange-600 transition transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Xác Nhận"
                  )}
                </button>
              )}
            </otpForm.Subscribe>

            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-center text-sm text-gray-500 hover:text-orange-600 underline"
            >
              Nhập lại số điện thoại
            </button>
          </form>
        )}

        {step === "profile" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              profileForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <profileForm.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  value.trim().length < 2 ? "Vui lòng nhập họ tên" : undefined,
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
                    placeholder="Họ và tên của bạn"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-xs text-red-500 mt-1 block px-2">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </profileForm.Field>

            <profileForm.Field name="email">
              {(field) => (
                <div className="relative">
                  {/* Email icon or similar */}
                  <input
                    type="email"
                    placeholder="Email (không bắt buộc)"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
                  />
                </div>
              )}
            </profileForm.Field>

            <profileForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-300 hover:bg-orange-600 transition transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Hoàn Tất"
                  )}
                </button>
              )}
            </profileForm.Subscribe>
          </form>
        )}

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
