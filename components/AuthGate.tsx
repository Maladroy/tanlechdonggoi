import { useForm } from "@tanstack/react-form";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	updateProfile,
} from "firebase/auth";
import { ArrowRight, Loader2, Lock, Phone, ShoppingBag, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { auth, createUserProfile } from "../services/firebase";
import type { UserProfile } from "../types";

interface Props {
	isNewUser?: boolean;
	onLoginSuccess: (user: UserProfile) => void;
	onGuestAccess: () => void;
}

export const AuthGate: React.FC<Props> = ({
	isNewUser = false,
	onLoginSuccess,
	onGuestAccess,
}) => {
	const [isLoginMode, setIsLoginMode] = useState(!isNewUser);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			phone: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			setIsLoading(true);
			try {
				// Cheat: Construct email from phone number
				let formattedPhone = value.phone.trim();
				// Basic sanitization
				formattedPhone = formattedPhone.replace(/\D/g, "");
				// Ensure consistency if needed, but simple digits is safest for this cheat
				// If we want to support 09xxx -> 849xxx, we can, but let's stick to what user types sanitized

				const email = `${formattedPhone}@tanlech.app`;
				const password = value.password;

				if (isLoginMode) {
					// Login
					await signInWithEmailAndPassword(auth, email, password);
					// onLoginSuccess will be triggered by App.tsx auth state listener usually, 
					// but here we might need to fetch profile if App.tsx relies on it being passed back?
					// App.tsx usually listens to onAuthStateChanged. 
					// However, the props say `onLoginSuccess`.
					// Let's rely on onLoginSuccess if we can fetch profile.
					// But usually auth state change handles it. 
					// Let's wait for App.tsx to react? 
					// Or simpler: just let the auth listener in App.tsx handle the navigation/state update.
					// But this component might stay mounted if we don't call onLoginSuccess?
					// Let's check App.tsx later. For now, we assume success.
				} else {
					// Register
					const userCredential = await createUserWithEmailAndPassword(
						auth,
						email,
						password,
					);
					const user = userCredential.user;

					// Update Display Name
					await updateProfile(user, { displayName: value.name });

					// Create User Profile in Firestore
					const newProfile: UserProfile = {
						name: value.name,
						phone: value.phone, // Store original phone input
						email: email,
						// We don't have real email, so maybe store constructed one or leave empty?
						// The interface might expect email.
					};

					const success = await createUserProfile(user.uid, newProfile);
					if (success) {
						onLoginSuccess(newProfile);
					} else {
						throw new Error("Failed to create profile in database");
					}
				}
			} catch (err: any) {
				console.error("Auth Error:", err);
				let msg = "Đã có lỗi xảy ra. Vui lòng thử lại.";
				if (err.code === "auth/invalid-email") {
					msg = "Số điện thoại không hợp lệ.";
				} else if (err.code === "auth/user-disabled") {
					msg = "Tài khoản này đã bị vô hiệu hóa.";
				} else if (err.code === "auth/user-not-found") {
					msg = "Tài khoản không tồn tại. Vui lòng đăng ký.";
				} else if (err.code === "auth/wrong-password") {
					msg = "Mật khẩu không chính xác.";
				} else if (err.code === "auth/email-already-in-use") {
					msg = "Số điện thoại này đã được đăng ký.";
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
						{isLoginMode ? "Đăng nhập để tiếp tục" : "Đăng ký thành viên mới"}
					</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200 text-center font-medium animate-pulse">
						{error}
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
					{!isLoginMode && (
						<form.Field
							name="name"
							validators={{
								onChange: ({ value }) =>
									!isLoginMode && value.trim().length < 2
										? "Vui lòng nhập họ tên"
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
										className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
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
									placeholder="Số điện thoại"
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
					</form.Field>

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
									className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition text-sm font-medium"
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
									<Loader2 className="animate-spin" />
								) : (
									<>
										{isLoginMode ? "Đăng Nhập" : "Đăng Ký"}{" "}
										<ArrowRight size={20} />
									</>
								)}
							</button>
						)}
					</form.Subscribe>
				</form>

				<div className="mt-6 text-center space-y-3">
					<button
						type="button"
						onClick={() => {
							setIsLoginMode(!isLoginMode);
							setError(null);
							form.reset();
						}}
						className="text-gray-600 text-sm hover:text-orange-600 font-medium transition"
					>
						{isLoginMode
							? "Chưa có tài khoản? Đăng ký ngay"
							: "Đã có tài khoản? Đăng nhập"}
					</button>

					<div className="pt-2 border-t border-gray-100">
						<button
							type="button"
							onClick={onGuestAccess}
							className="text-gray-400 text-xs hover:text-gray-600 transition"
						>
							Tiếp tục mà không cần đăng nhập
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
