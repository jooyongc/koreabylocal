import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// ── Public pages ──────────────────────────────────────────────
const HomePage = lazy(() => import("@/pages/HomePage"));
const ToursPage = lazy(() => import("@/pages/tours/ToursPage"));
const TourDetailPage = lazy(() => import("@/pages/tours/TourDetailPage"));
const TransfersPage = lazy(() => import("@/pages/transfers/TransfersPage"));
const TransportationPage = lazy(() => import("@/pages/transfers/TransportationPage"));
const TourPlanningPage = lazy(() => import("@/pages/transfers/TourPlanningPage"));
const BlogPage = lazy(() => import("@/pages/blog/BlogPage"));
const BlogDetailPage = lazy(() => import("@/pages/blog/BlogDetailPage"));
const AskALocalPage = lazy(() => import("@/pages/ask-a-local/AskALocalPage"));
const ShopPage = lazy(() => import("@/pages/shop/ShopPage"));
const MagazinePage = lazy(() => import("@/pages/shop/MagazinePage"));
const KGoodsPage = lazy(() => import("@/pages/shop/KGoodsPage"));
const PrintPage = lazy(() => import("@/pages/shop/PrintPage"));
const ProductDetailPage = lazy(() => import("@/pages/shop/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/cart/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/cart/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("@/pages/cart/OrderConfirmationPage"));
const AboutPage = lazy(() => import("@/pages/about/AboutPage"));
const PrivacyPage = lazy(() => import("@/pages/legal/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/legal/TermsPage"));

// ── Auth pages ────────────────────────────────────────────────
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));

// ── Account pages (requires auth) ────────────────────────────
const AccountPage = lazy(() => import("@/pages/account/AccountPage"));
const OrdersPage = lazy(() => import("@/pages/account/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/account/OrderDetailPage"));

// ── Admin pages (requires admin role) ─────────────────────────
const AdminDashboard = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminProducts = lazy(() => import("@/pages/admin/ProductsPage"));
const AdminProductNew = lazy(() => import("@/pages/admin/ProductNewPage"));
const AdminProductEdit = lazy(() => import("@/pages/admin/ProductEditPage"));
const AdminBlog = lazy(() => import("@/pages/admin/AdminBlogPage"));
const AdminBlogNew = lazy(() => import("@/pages/admin/BlogNewPage"));
const AdminBlogEdit = lazy(() => import("@/pages/admin/BlogEditPage"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminSettings = lazy(() => import("@/pages/admin/SettingsPage"));

// ── 404 ───────────────────────────────────────────────────────
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<Layout />}>
          {/* ── Public ──────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />

          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:slug" element={<TourDetailPage />} />

          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/transfers/transportation" element={<TransportationPage />} />
          <Route path="/transfers/tour-planning" element={<TourPlanningPage />} />

          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />

          <Route path="/ask-a-local" element={<AskALocalPage />} />

          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/magazine" element={<MagazinePage />} />
          <Route path="/shop/k-goods" element={<KGoodsPage />} />
          <Route path="/shop/print" element={<PrintPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />

          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/confirmation" element={<OrderConfirmationPage />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* ── Auth ────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* ── Account (requires login) ────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/orders" element={<OrdersPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
          </Route>

          {/* ── Admin (requires admin role) ──────────────── */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/new" element={<AdminProductNew />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductEdit />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/blog/new" element={<AdminBlogNew />} />
            <Route path="/admin/blog/:id/edit" element={<AdminBlogEdit />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* ── 404 ─────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
