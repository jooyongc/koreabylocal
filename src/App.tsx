import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { AdminLayout } from "@/components/admin";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSiteFont } from "@/hooks/useSiteFont";
import { useSiteAnalytics } from "@/hooks/useSiteAnalytics";

// ── Public pages ──────────────────────────────────────────────
const HomePage = lazy(() => import("@/pages/HomePage"));
const TransfersPage = lazy(() => import("@/pages/transfers/TransfersPage"));
const TransportationPage = lazy(() => import("@/pages/transfers/TransportationPage"));
const TourPlanningPage = lazy(() => import("@/pages/transfers/TourPlanningPage"));
const GuidebookPage = lazy(() => import("@/pages/guidebook/GuidebookPage"));
const GuideDetailPage = lazy(() => import("@/pages/guidebook/GuideDetailPage"));
const AskALocalPage = lazy(() => import("@/pages/ask-a-local/AskALocalPage"));
const EbookPage = lazy(() => import("@/pages/ebook/EbookPage"));
const DestinationPage = lazy(() => import("@/pages/destinations/DestinationPage"));
const SpotDetailPage = lazy(() => import("@/pages/spots/SpotDetailPage"));
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
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

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
const AdminOrderDetail = lazy(() => import("@/pages/admin/AdminOrderDetailPage"));
const AdminInquiries = lazy(() => import("@/pages/admin/AdminInquiriesPage"));
const AdminInquiryDetail = lazy(() => import("@/pages/admin/AdminInquiryDetailPage"));
const AdminMagazines = lazy(() => import("@/pages/admin/AdminMagazinesPage"));
const AdminSettings = lazy(() => import("@/pages/admin/SettingsPage"));
const AdminContentStudio = lazy(() => import("@/pages/admin/ContentStudioPage"));

// ── 404 ───────────────────────────────────────────────────────
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

/** Redirects an old `:slug` route to its new home, preserving the slug (SEO-safe). */
function SlugRedirect({ to }: { to: string }) {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`${to}/${slug ?? ""}`} replace />;
}

function App() {
  const initialize = useAuthStore((s) => s.initialize);
  useSiteFont();
  useSiteAnalytics();

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<Layout />}>
          {/* ── Public ──────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />

          <Route path="/spots/:slug" element={<SpotDetailPage />} />
          <Route path="/destinations/:region" element={<DestinationPage />} />

          <Route path="/getting-there" element={<TransfersPage />} />
          <Route path="/transfers/transportation" element={<TransportationPage />} />
          <Route path="/transfers/tour-planning" element={<TourPlanningPage />} />

          <Route path="/guidebook" element={<GuidebookPage />} />
          <Route path="/guidebook/:slug" element={<GuideDetailPage />} />

          <Route path="/ask-a-local" element={<AskALocalPage />} />

          <Route path="/ebook" element={<EbookPage />} />

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

          {/* ── Legacy redirects (v3 renewal — preserve SEO) ── */}
          <Route path="/blog" element={<Navigate to="/guidebook" replace />} />
          <Route path="/blog/:slug" element={<SlugRedirect to="/guidebook" />} />
          <Route path="/tours" element={<Navigate to="/" replace />} />
          <Route path="/tours/:slug" element={<SlugRedirect to="/spots" />} />
          <Route path="/transfers" element={<Navigate to="/getting-there" replace />} />

          {/* ── Auth ────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Account (requires login) ────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/orders" element={<OrdersPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
          </Route>

          {/* ── 404 ─────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Admin (requires admin role + dedicated layout) ── */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/new" element={<AdminProductNew />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductEdit />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/blog/new" element={<AdminBlogNew />} />
            <Route path="/admin/blog/:id/edit" element={<AdminBlogEdit />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/inquiries" element={<AdminInquiries />} />
            <Route path="/admin/inquiries/:id" element={<AdminInquiryDetail />} />
            <Route path="/admin/magazines" element={<AdminMagazines />} />
            <Route path="/admin/content-studio" element={<AdminContentStudio />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
