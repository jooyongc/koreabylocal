import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  DollarSign,
  Package,
  FileText,
  BookOpen,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  UserPlus,
  Library,
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/common/Skeleton";
import type { Order } from "@/types";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-700",
  paid: "bg-emerald-100 text-emerald-700",
  refunded: "bg-red-100 text-red-700",
  partial_refund: "bg-orange-100 text-orange-700",
};

// ── Dashboard stats hook ──────────────────────────────────────
interface DashboardStats {
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueLastMonth: number;
  productCounts: { active: number; hidden: number; soldOut: number };
  blogCount: number;
  magazineCount: number;
  activeSpots: number;
  newSubscribersWeek: number;
  ebookSalesTotal: number;
  recentOrders: Order[];
}

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfDay(subDays(now, 7)).toISOString();
      const monthStart = startOfDay(subDays(now, 30)).toISOString();
      const lastMonthStart = startOfDay(subDays(now, 60)).toISOString();

      const [
        ordersToday,
        ordersWeek,
        ordersMonth,
        ordersLastMonth,
        productsActive,
        productsHidden,
        productsSoldOut,
        blogPosts,
        magazines,
        activeSpots,
        newSubscribersWeek,
        ebookSalesTotal,
        recentOrders,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("total_amount", { count: "exact", head: false })
          .gte("created_at", todayStart),
        supabase
          .from("orders")
          .select("total_amount", { count: "exact", head: false })
          .gte("created_at", weekStart),
        supabase
          .from("orders")
          .select("total_amount", { count: "exact", head: false })
          .gte("created_at", monthStart),
        supabase
          .from("orders")
          .select("total_amount", { count: "exact", head: false })
          .gte("created_at", lastMonthStart)
          .lt("created_at", monthStart),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "hidden"),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "sold_out"),
        supabase
          .from("blog_posts")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase
          .from("digital_magazines")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("experiences")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("subscribers")
          .select("id", { count: "exact", head: true })
          .gte("subscribed_at", weekStart),
        supabase
          .from("ebook_purchases")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const sumAmount = (data: { total_amount: number }[] | null) =>
        (data ?? []).reduce((s, o) => s + o.total_amount, 0);

      return {
        ordersToday: ordersToday.count ?? 0,
        ordersWeek: ordersWeek.count ?? 0,
        ordersMonth: ordersMonth.count ?? 0,
        revenueToday: sumAmount(ordersToday.data),
        revenueWeek: sumAmount(ordersWeek.data),
        revenueMonth: sumAmount(ordersMonth.data),
        revenueLastMonth: sumAmount(ordersLastMonth.data),
        productCounts: {
          active: productsActive.count ?? 0,
          hidden: productsHidden.count ?? 0,
          soldOut: productsSoldOut.count ?? 0,
        },
        blogCount: blogPosts.count ?? 0,
        magazineCount: magazines.count ?? 0,
        activeSpots: activeSpots.count ?? 0,
        newSubscribersWeek: newSubscribersWeek.count ?? 0,
        ebookSalesTotal: ebookSalesTotal.count ?? 0,
        recentOrders: (recentOrders.data ?? []) as Order[],
      };
    },
    staleTime: 30_000,
  });
}

// ── Stat Card ──────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
}

function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
      {trend && (
        <p
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${
            trend.value >= 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {trend.value >= 0 ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}

// ── Quick Link ──────────────────────────────────────────────────
interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

function QuickLink({ to, icon, label, count }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-light hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-primary">{label}</p>
        {count !== undefined && (
          <p className="text-xs text-text-secondary">{count} total</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-text-secondary" />
    </Link>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────
export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const revenueTrend =
    stats && stats.revenueLastMonth > 0
      ? Math.round(
          ((stats.revenueMonth - stats.revenueLastMonth) /
            stats.revenueLastMonth) *
            100,
        )
      : undefined;

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Korea By Local</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of your site&apos;s activity
        </p>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                label="Orders Today"
                value={String(stats?.ordersToday ?? 0)}
                icon={
                  <ShoppingCart className="h-5 w-5 text-primary" />
                }
              />
              <StatCard
                label="Orders This Week"
                value={String(stats?.ordersWeek ?? 0)}
                icon={
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                }
              />
              <StatCard
                label="Revenue (30d)"
                value={formatPrice(stats?.revenueMonth ?? 0)}
                icon={
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                }
                trend={
                  revenueTrend !== undefined
                    ? { value: revenueTrend, label: "vs prev 30d" }
                    : undefined
                }
              />
              <StatCard
                label="Revenue Today"
                value={formatPrice(stats?.revenueToday ?? 0)}
                icon={
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                }
              />
              <StatCard
                label="Active Spots"
                value={String(stats?.activeSpots ?? 0)}
                icon={<MapPin className="h-5 w-5 text-coral" />}
              />
              <StatCard
                label="New Subscribers (7d)"
                value={String(stats?.newSubscribersWeek ?? 0)}
                icon={<UserPlus className="h-5 w-5 text-emerald-500" />}
              />
              <StatCard
                label="E-book Sales"
                value={String(stats?.ebookSalesTotal ?? 0)}
                icon={<Library className="h-5 w-5 text-purple" />}
              />
            </>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-primary">Recent Orders</h2>
              <Link
                to="/admin/orders"
                className="text-xs font-medium text-accent hover:underline"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : stats?.recentOrders.length ? (
              <div className="divide-y divide-gray-50">
                {stats.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/orders`}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">
                          {order.order_number}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            STATUS_COLORS[order.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            PAYMENT_COLORS[order.payment_status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {order.guest_name ?? order.guest_email ?? "Member"} &middot;{" "}
                        {format(new Date(order.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {formatPrice(order.total_amount)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-text-secondary">
                No orders yet
              </p>
            )}
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="mb-4 font-bold text-primary">Quick Links</h2>
            <div className="space-y-3">
              <QuickLink
                to="/admin/spots"
                icon={<MapPin className="h-5 w-5 text-coral" />}
                label="Spots"
                count={stats?.activeSpots}
              />
              <QuickLink
                to="/admin/products"
                icon={<Package className="h-5 w-5 text-primary" />}
                label="Products"
                count={
                  stats
                    ? stats.productCounts.active +
                      stats.productCounts.hidden +
                      stats.productCounts.soldOut
                    : undefined
                }
              />
              <QuickLink
                to="/admin/blog"
                icon={<FileText className="h-5 w-5 text-blue-500" />}
                label="Blog Posts"
                count={stats?.blogCount}
              />
              <QuickLink
                to="/admin/magazines"
                icon={<BookOpen className="h-5 w-5 text-purple-500" />}
                label="Digital Magazines"
                count={stats?.magazineCount}
              />
              <QuickLink
                to="/admin/subscribers"
                icon={<UserPlus className="h-5 w-5 text-emerald-500" />}
                label="Subscribers"
              />
              <QuickLink
                to="/admin/ebooks"
                icon={<Library className="h-5 w-5 text-purple" />}
                label="E-books"
                count={stats?.ebookSalesTotal}
              />
              <QuickLink
                to="/admin/orders"
                icon={<ShoppingCart className="h-5 w-5 text-emerald-500" />}
                label="All Orders"
                count={stats?.ordersMonth}
              />
            </div>

            {/* Product status breakdown */}
            {stats && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-bold text-primary">
                  Product Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Active</span>
                    <span className="font-medium text-emerald-600">
                      {stats.productCounts.active}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Hidden</span>
                    <span className="font-medium text-yellow-600">
                      {stats.productCounts.hidden}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Sold Out</span>
                    <span className="font-medium text-red-500">
                      {stats.productCounts.soldOut}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
