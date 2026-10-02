import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Inquiry } from "@/types";

const PAGE_SIZE = 20;

// Only what the list table shows — the message body and attachments load on the detail page.
const LIST_COLUMNS = "id, name, email, subject, category, status, payment_status, ai_triage, created_at";
export type AdminInquiryListRow = Pick<
  Inquiry,
  "id" | "name" | "email" | "subject" | "category" | "status" | "payment_status" | "ai_triage" | "created_at"
>;

export function useAdminInquiryList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const query = useQuery({
    queryKey: ["admin-inquiries", { search, status, page }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("inquiries")
        .select(LIST_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false });

      if (status) q = q.eq("status", status);
      if (search) {
        q = q.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`
        );
      }

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      return {
        inquiries: (data ?? []) as AdminInquiryListRow[],
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      };
    },
  });

  const setFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  return { ...query, search, status, page, setFilter };
}
