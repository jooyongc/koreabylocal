import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronRight, MapPin, UserPlus, Users, Library, MessageSquare } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/common/Skeleton";
import { readTriage } from "@/types";

// ── Dashboard stats hook ──────────────────────────────────────
// What the site runs on now: articles, spots, the newsletter list, paid Ask a
// Local questions and e-book sales. The retired shop's orders/revenue/products
// stats are gone — they were 7 of the 13 queries this page fired on every open.
interface RecentQuestion {
  id: number;
  name: string;
  subject: string | null;
  category: string;
  status: string;
  created_at: string;
  ai_triage: unknown;
}

interface DashboardStats {
  publishedPosts: number;
  activeSpots: number;
  activeSubscribers: number;
  newSubscribersWeek: number;
  openQuestions: number;
  ebookSalesTotal: number;
  recentQuestions: RecentQuestion[];
}

const count = (res: { count: number | null }) => res.count ?? 0;

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const weekStart = startOfDay(subDays(new Date(), 7)).toISOString();

      const [posts, spots, subscribers, newSubscribers, openQuestions, ebookSales, recent] = await Promise.all([
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("experiences").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscribers").select("id", { count: "exact", head: true }).gte("subscribed_at", weekStart),
        supabase
          .from("inquiries")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "paid")
          .eq("status", "pending"),
        supabase
          .from("ebook_purchases")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .neq("payment_provider", "free"),
        supabase
          .from("inquiries")
          .select("id, name, subject, category, status, created_at, ai_triage")
          .eq("payment_status", "paid")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      return {
        publishedPosts: count(posts),
        activeSpots: count(spots),
        activeSubscribers: count(subscribers),
        newSubscribersWeek: count(newSubscribers),
        openQuestions: count(openQuestions),
        ebookSalesTotal: count(ebookSales),
        recentQuestions: (recent.data ?? []) as RecentQuestion[],
      };
    },
    staleTime: 30_000,
  });
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, icon, to }: { label: string; value: number; icon: React.ReactNode; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-primary-light hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </Link>
  );
}

// ── Quick Link ──────────────────────────────────────────────────
function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-light hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">{icon}</div>
      <p className="min-w-0 flex-1 text-sm font-semibold text-primary">{label}</p>
      <ChevronRight className="h-4 w-4 text-text-secondary" />
    </Link>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────
export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Korea By Local</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Overview of your site&apos;s activity</p>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading || !stats ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
          ) : (
            <>
              <StatCard
                label="Open paid questions"
                value={stats.openQuestions}
                to="/admin/inquiries?status=pending"
                icon={<MessageSquare className="h-5 w-5 text-accent" />}
              />
              <StatCard
                label="Active subscribers"
                value={stats.activeSubscribers}
                to="/admin/subscribers"
                icon={<Users className="h-5 w-5 text-primary" />}
              />
              <StatCard
                label="New subscribers (7d)"
                value={stats.newSubscribersWeek}
                to="/admin/subscribers"
                icon={<UserPlus className="h-5 w-5 text-emerald-500" />}
              />
              <StatCard
                label="Published articles"
                value={stats.publishedPosts}
                to="/admin/blog"
                icon={<FileText className="h-5 w-5 text-blue-500" />}
              />
              <StatCard
                label="Active spots"
                value={stats.activeSpots}
                to="/admin/spots"
                icon={<MapPin className="h-5 w-5 text-coral" />}
              />
              <StatCard
                label="E-book sales"
                value={stats.ebookSalesTotal}
                to="/admin/ebooks"
                icon={<Library className="h-5 w-5 text-purple" />}
              />
            </>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Latest paid questions */}
          <section className="rounded-xl border border-gray-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-bold text-primary">Latest Ask a Local questions</h2>
              <Link to="/admin/inquiries" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : stats?.recentQuestions.length ? (
              <div className="divide-y divide-gray-50">
                {stats.recentQuestions.map((q) => {
                  const urgent = readTriage(q.ai_triage)?.urgent;
                  return (
                    <Link
                      key={q.id}
                      to={`/admin/inquiries/${q.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {urgent && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                              Urgent
                            </span>
                          )}
                          <span className="truncate text-sm font-medium text-primary">{q.subject || q.category}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {q.name}, {format(new Date(q.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          q.status === "replied" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {q.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-text-secondary">No paid questions yet</p>
            )}
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="mb-4 font-bold text-primary">Quick Links</h2>
            <div className="space-y-3">
              <QuickLink to="/admin/content-studio" icon={<FileText className="h-5 w-5 text-accent" />} label="Write with Content Studio" />
              <QuickLink to="/admin/spots/new" icon={<MapPin className="h-5 w-5 text-coral" />} label="Add a spot" />
              <QuickLink to="/admin/subscribers?tab=newsletters" icon={<Users className="h-5 w-5 text-primary" />} label="Send a newsletter" />
              <QuickLink to="/admin/inquiries" icon={<MessageSquare className="h-5 w-5 text-emerald-500" />} label="Answer questions" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
