import { onAuthStateChanged } from "firebase/auth";
import type { Unsubscribe } from "firebase/firestore";
import type React from "react";
import { useEffect, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { CouponDisplay } from "./components/CouponDisplay";
import { AuthGate } from "./components/AuthGate";
import { Cart } from "./components/Cart";
import { OrderSuccessModal } from "./components/OrderSuccessModal";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ProfileModal } from "./components/ProfileModal";
import { PromoPopup } from "./components/PromoPopup";
import { Shop } from "./components/Shop";
import {
	auth,
	getCategories,
	getCombos,
	getCoupons,
	signOutUser,
	subscribeToUserProfile,
	updateUserProfile,
} from "./services/firebase";
import type { CartItem, Category, Combo, Coupon, UserProfile } from "./types";
import { AppView } from "./types";
import "./font.css";
import "./style.css";

const App: React.FC = () => {
	const [view, setView] = useState<AppView>(AppView.AUTH);
	const [combos, setCombos] = useState<Combo[]>([]);
	const [loading, setLoading] = useState(true);
	const [authLoading, setAuthLoading] = useState(true);

	// User State
	const [user, setUser] = useState<UserProfile | null>(null);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isNewUser, setIsNewUser] = useState(false);

	// Cart State
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [cart, setCart] = useState<CartItem[]>(() => {
		try {
			const saved = localStorage.getItem("tanlech_cart");
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	});
	const [appliedCode, setAppliedCode] = useState<string | null>(null);
	const [isSuccessOpen, setIsSuccessOpen] = useState(false);

	// Persist Cart
	useEffect(() => {
		localStorage.setItem("tanlech_cart", JSON.stringify(cart));
	}, [cart]);
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedComboId, setSelectedComboId] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			const [comboData, couponData, categoryData] = await Promise.all([
				getCombos(),
				getCoupons(),
				getCategories(),
			]);
			setCombos(comboData);
			setCoupons(couponData);
			setCategories(categoryData);
			setLoading(false);

			// Check URL for product
			const params = new URLSearchParams(window.location.search);
			const productId = params.get("product");
			if (productId) {
				setSelectedComboId(productId);
			}
		};
		fetchData();

		// Listen for Auth Changes
		let unsubscribeProfile: Unsubscribe | undefined;

		const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
			// Unsubscribe from previous profile listener
			if (unsubscribeProfile) {
				unsubscribeProfile();
				unsubscribeProfile = undefined;
			}

			if (firebaseUser) {
				// Subscribe to user profile
				unsubscribeProfile = subscribeToUserProfile(
					firebaseUser.uid,
					(profile) => {
						if (profile) {
							setUser(profile);
							setIsNewUser(false);

							// Handle View Transitions
							if (profile.isAdmin) {
								setView(AppView.ADMIN);
							} else {
								setView((prev) => {
									// If currently in Auth or Admin, switch to Shop
									if (prev === AppView.AUTH || prev === AppView.ADMIN) {
										return AppView.SHOP;
									}
									return prev;
								});
							}
						} else {
							// New user (or missing profile) -> Go to Auth/Register
							setIsNewUser(true);
							setUser(null);
							setView(AppView.AUTH);
						}
						setAuthLoading(false);
					},
				);
			} else {
				setIsNewUser(false);
				setUser(null);
				setView(AppView.SHOP);
				setAuthLoading(false);
			}
		});

		return () => {
			unsubscribeAuth();
			if (unsubscribeProfile) unsubscribeProfile();
		};
	}, []); // Remove dependency on [view] to avoid infinite loops, but keep fetching data on mount

	// Auth Handlers
	const handleLogin = (userProfile: UserProfile) => {
		setUser(userProfile);
		if (userProfile.isAdmin) {
			setView(AppView.ADMIN);
		} else {
			setView(AppView.SHOP);
		}
	};

	const handleLogout = async () => {
		await signOutUser();
		setUser(null);
		setView(AppView.SHOP);
		setCart([]);
		setIsProfileOpen(false);
	};

	const handleUpdateProfile = async (data: Partial<UserProfile>) => {
		if (user && auth.currentUser) {
			const success = await updateUserProfile(auth.currentUser.uid, data);
			if (success) {
				setUser({ ...user, ...data });
				return true;
			}
		}
		return false;
	};

	// Cart Handlers
	const addToCart = (
		combo: Combo & { selectedVariants?: Record<string, string>; computedPrice?: number },
		options: { openCart?: boolean } = { openCart: true },
	) => {
		setCart((prev) => {
			// Find existing item with same ID AND same selected variants
			const existing = prev.find((item) => {
				const isSameId = item.id === combo.id;
				const isSameVariants =
					JSON.stringify(item.selectedVariants || {}) ===
					JSON.stringify(combo.selectedVariants || {});
				return isSameId && isSameVariants;
			});

			if (existing) {
				return prev.map((item) => {
					// Compare logic again for map
					const isSameId = item.id === combo.id;
					const isSameVariants =
						JSON.stringify(item.selectedVariants || {}) ===
						JSON.stringify(combo.selectedVariants || {});

					return isSameId && isSameVariants
						? { ...item, quantity: item.quantity + 1 }
						: item;
				});
			}

			// Add new item with quantity 1
			// Ensure we spread selectedVariants and computedPrice into the cart item
			const newItem: CartItem = {
				...combo,
				quantity: 1,
				selectedVariants: combo.selectedVariants,
				computedPrice: combo.computedPrice,
			};
			return [...prev, newItem];
		});
		if (options.openCart) {
			setIsCartOpen(true);
		}
	};

	const removeFromCart = (
		id: string,
		selectedVariants?: Record<string, string>,
	) => {
		setCart((prev) =>
			prev.filter((item) => {
				const isSameId = item.id === id;
				// If variants provided, check them. If item has variants but we didn't pass specific ones (legacy call), maybe remove all?
				// But best to match exactly.
				// However, removeFromCart usually just passed ID.
				// We need to update removeFromCart to pass variants too if we want to remove specific variant item.
				// For now, let's assume we need to update the caller too.
				// But wait, the ID is not unique anymore in the cart list if we have multiple variants of same product.
				// So we really should generate a unique cartItemId or pass variants to remove.
				// To keep it simple without changing CartItem ID structure (which matches Product ID),
				// we will compare variants.
				const isSameVariants =
					JSON.stringify(item.selectedVariants || {}) ===
					JSON.stringify(selectedVariants || {});

				// Remove if ID matches AND Variants match
				return !(isSameId && isSameVariants);
			}),
		);
	};

	const updateQuantity = (
		id: string,
		delta: number,
		selectedVariants?: Record<string, string>,
	) => {
		setCart((prev) =>
			prev.map((item) => {
				const isSameId = item.id === id;
				const isSameVariants =
					JSON.stringify(item.selectedVariants || {}) ===
					JSON.stringify(selectedVariants || {});

				if (isSameId && isSameVariants) {
					const newQuantity = Math.max(1, item.quantity + delta);
					return { ...item, quantity: newQuantity };
				}
				return item;
			}),
		);
	};

	const clearCart = () => {
		setCart([]);
		setAppliedCode(null);
	};

	const handleOrderSuccess = () => {
		setIsCartOpen(false);
		setIsSuccessOpen(true);
	};

	// Coupon Logic
	const handleApplyCode = (code: string) => {
		setAppliedCode(code);
		setView(AppView.SHOP);
		setIsCartOpen(true);
	};

	const handleViewProduct = (combo: Combo) => {
		setSelectedComboId(combo.id);
		const url = new URL(window.location.href);
		url.searchParams.set("product", combo.id);
		window.history.pushState({}, "", url);
	};

	const handleCloseProductModal = () => {
		setSelectedComboId(null);
		const url = new URL(window.location.href);
		url.searchParams.delete("product");
		window.history.pushState({}, "", url);
	};

	const selectedCombo = combos.find((c) => c.id === selectedComboId) || null;

	const renderView = () => {
		if (
			authLoading ||
			(loading && view !== AppView.AUTH && view !== AppView.ADMIN)
		) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
				</div>
			);
		}

		switch (view) {
			case AppView.AUTH:
				return (
					<AuthGate
						isNewUser={isNewUser}
						onLoginSuccess={handleLogin}
						onGuestAccess={() => setView(AppView.SHOP)}
					/>
				);

			case AppView.ADMIN:
				return <AdminDashboard onLogout={handleLogout} />;

			case AppView.COUPON_LIST:
				return (
					<CouponDisplay
						onBack={() => setView(AppView.SHOP)}
						onGoToShop={() => setView(AppView.SHOP)}
						onApply={handleApplyCode}
					/>
				);

			default:
				return (
					<>
						<PromoPopup />
						<Shop
							combos={combos}
							categories={categories}
							onOpenCouponPage={() => {
								if (user) {
									setView(AppView.COUPON_LIST);
								} else {
									setView(AppView.AUTH);
								}
							}}
							onViewProduct={handleViewProduct}
							onAddToCart={addToCart}
							cartItemCount={cart.length}
							onOpenCart={() => setIsCartOpen(true)}
							user={user}
							onOpenProfile={() => {
								if (user) {
									setIsProfileOpen(true);
								} else {
									setView(AppView.AUTH);
								}
							}}
						/>

						<Cart
							isOpen={isCartOpen}
							onClose={() => setIsCartOpen(false)}
							cart={cart}
							user={user}
							onRemove={removeFromCart}
							onUpdateQuantity={updateQuantity}
							coupons={coupons}
							initialCouponCode={appliedCode}
							onClearCart={clearCart}
							onOrderSuccess={handleOrderSuccess}
							onLoginRedirect={() => {
								setView(AppView.AUTH);
								// Cart will close automatically because it's not rendered in AUTH view
								// But to be clean, we can close it, or let it stay open state so it reopens on return
								// Based on user flow "return to cart", keeping it open is better.
								// So we DON'T setIsCartOpen(false) here.
							}}
						/>

						<OrderSuccessModal
							isOpen={isSuccessOpen}
							onClose={() => setIsSuccessOpen(false)}
							user={user}
						/>

						<ProductDetailModal
							isOpen={!!selectedComboId}
							combo={selectedCombo}
							onClose={handleCloseProductModal}
							onAddToCart={(combo, options) => {
								addToCart(combo, options);
								handleCloseProductModal();
							}}
						/>

						{user && (
							<ProfileModal
								user={user}
								isOpen={isProfileOpen}
								onClose={() => setIsProfileOpen(false)}
								onUpdate={handleUpdateProfile}
								onLogout={handleLogout}
							/>
						)}
					</>
				);
		}
	};

	return <>{renderView()}</>;
};

export default App;
