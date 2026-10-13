import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send, Upload, X, Loader2, Plus, Lock, Paperclip, MessageCircle, UtensilsCrossed, CalendarCheck, Package } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/uploadImage";
import RecentlyAnswered from "@/components/ask/RecentlyAnswered";

type ServiceKey = "general" | "restaurant" | "schedule" | "shipping";

interface Service {
  label: string;
  /** Stored as inquiries.category — also the key the price is looked up by server-side. */
  category: string;
  price: number;
  verb: string;
  tagline: string;
  placeholder: string;
  attachLabel: string;
  icon: typeof MessageCircle;
}

const SERVICES: Record<ServiceKey, Service> = {
  general: {
    label: "Ask Anything",
    category: "General",
    price: 1,
    verb: "Ask a local",
    tagline: "$1 per question, no account needed. A verified Korean host replies — usually within a few hours — with honest, specific advice for your trip.",
    placeholder: "e.g. “4 days in Korea with kids — Seoul + one more city. What would you do?”",
    attachLabel: "Attach a file",
    icon: MessageCircle,
  },
  restaurant: {
    label: "Restaurant Reservation",
    category: "Restaurant Reservation",
    price: 1,
    verb: "Reserve my table",
    tagline: "$1 per booking. Tell us the restaurant (or type of food), date, time and party size — a local calls and books it for you.",
    placeholder: "e.g. “A good samgyeopsal place near Hongdae, tonight at 7pm, for 4 people.”",
    attachLabel: "Attach a screenshot",
    icon: UtensilsCrossed,
  },
  schedule: {
    label: "Trip Schedule Check",
    category: "Schedule Check",
    price: 5,
    verb: "Check my schedule",
    tagline: "$5 per check. Paste your itinerary and a local reviews it — flags anything too tight, too far apart, or closed that day.",
    placeholder: "Paste your day-by-day itinerary here, or attach it below...",
    attachLabel: "Attach your itinerary",
    icon: CalendarCheck,
  },
  shipping: {
    label: "K-Beauty Shipping Request",
    category: "Cosmetics Shipping",
    price: 5,
    verb: "Request shipping",
    tagline: "$5 per request. List the products (brand + name, or a link) and your shipping address — a local buys and ships them to you.",
    placeholder: "e.g. “Beauty of Joseon Relief Sun SPF50+ x2, COSRX Snail Mucin x1 — ship to: ...”",
    attachLabel: "Attach product links/photos",
    icon: Package,
  },
};

// Kept in sync with the trust row below — FAQPage structured data must match visible content.
const FAQS = [
  { q: "How much does it cost?", a: "$1 for a question or a restaurant reservation, $5 for a schedule check or a shipping request — it goes to the local who helps you. No account needed." },
  { q: "How fast will I get a reply?", a: "Usually within a few hours. Our average reply time is about 3 hours." },
  { q: "Who actually answers my question?", a: "A verified local host in Korea — never a bot or an algorithm." },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

interface InquiryForm {
  name: string;
  email: string;
  message: string;
}

export default function AskALocalPage() {
  const [serviceKey, setServiceKey] = useState<ServiceKey>("general");
  const service = SERVICES[serviceKey];
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryForm>();

  const handleFileUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Only images and PDFs are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file, "product-images");
      setAttachmentUrl(url);
      setAttachmentName(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // The question is saved (unpaid) and a PayPal order is created server-side;
  // capture-inquiry-payment is what marks it paid and notifies the team, once
  // PayPal returns the buyer to /ask-a-local/success.
  const onSubmit = async (data: InquiryForm) => {
    const { data: result, error } = await supabase.functions.invoke("create-inquiry-checkout", {
      body: {
        name: data.name,
        email: data.email,
        category: service.category,
        message: data.message,
        attachment_url: attachmentUrl || null,
      },
    });

    if (error || !result?.url) {
      toast.error("Couldn't start checkout. Please try again in a moment.");
      return;
    }

    window.location.href = result.url;
  };

  // ── Shared field styling (renewal) ──────────────────────────────
  const fieldClass =
    "w-full rounded-[12px] border border-ink/15 bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-muted-3 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink";
  const errorClass = "mt-1 text-[12px] text-coral";

  return (
    <>
      <PageSEO
        title="Ask a Local — Real Answers About Korea Travel"
        description="Have a question about Korea? Ask our local experts for personalized travel recommendations, tips, and custom trip planning."
        path="/ask-a-local"
        jsonLd={FAQ_SCHEMA}
      />

      {/* ── Hero + form card ───────────────────────────────────────── */}
      <section className="mx-auto max-w-[880px] px-4 pt-[clamp(34px,5vw,72px)] text-center sm:px-6 lg:px-8">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-accent">
          Real locals, from $1
        </p>
        <h1 className="mt-3 font-display text-[clamp(32px,5.5vw,60px)] font-extrabold leading-[1.02] tracking-[-0.02em] text-ink">
          Stuck planning?{" "}
          <span className="font-serif-accent font-medium italic">
            Ask a real local.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-[clamp(15px,1.7vw,18px)] text-muted">
          {service.tagline}
        </p>

        {/* Service picker */}
        <div className="mx-auto mt-6 flex max-w-[700px] flex-wrap justify-center gap-2">
          {(Object.keys(SERVICES) as ServiceKey[]).map((key) => {
            const s = SERVICES[key];
            const Icon = s.icon;
            const active = key === serviceKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setServiceKey(key)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-ink/15 bg-white text-ink hover:border-accent hover:text-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {s.label}
                <span className={active ? "text-white/75" : "text-muted-2"}>${s.price}</span>
              </button>
            );
          })}
        </div>

        {/* Question form card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-7 rounded-[20px] bg-white p-[18px] text-left shadow-[0_16px_44px_rgba(26,26,26,0.12)]"
        >
          {/* Message — the prominent "ask" textarea */}
          <div>
            <label htmlFor="ask-message" className="sr-only">
              Your question
            </label>
            <textarea
              id="ask-message"
              {...register("message", { required: "Please share the details" })}
              rows={3}
              className="min-h-[90px] w-full resize-y rounded-[14px] border border-ink/12 bg-white p-4 text-[15px] leading-[1.5] text-ink placeholder:text-muted-3 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder={service.placeholder}
            />
            {errors.message && (
              <p className={errorClass} role="alert">
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Chips row + attachment + submit */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-2">
              {attachmentUrl ? (
                <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[12.5px] text-muted-2">
                  <span className="flex items-center gap-1 truncate">
                    <Paperclip className="h-3 w-3 shrink-0" /> {attachmentName}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    onClick={() => {
                      setAttachmentUrl("");
                      setAttachmentName("");
                    }}
                    className="shrink-0 rounded-full p-0.5 text-muted-2 transition-colors hover:text-coral"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[12.5px] text-muted-2 transition-colors hover:bg-cream-200">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{uploading ? "Uploading…" : service.attachLabel}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="inline-flex items-center gap-2 rounded-[12px] bg-accent px-[26px] py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,46,151,0.35)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? "Redirecting…" : `${service.verb} — $${service.price} →`}
            </button>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted-2">
            <Lock className="h-3 w-3" /> You'll pay ${service.price} on PayPal's secure checkout page. It's sent to a
            local the moment payment goes through.
          </p>

          {/* Contact details */}
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ask-name" className={labelClass}>
                Name <span className="text-accent">*</span>
              </label>
              <input
                id="ask-name"
                {...register("name", { required: "Name is required" })}
                className={fieldClass}
                placeholder="Your name"
              />
              {errors.name && (
                <p className={errorClass} role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ask-email" className={labelClass}>
                Email <span className="text-accent">*</span>
              </label>
              <input
                id="ask-email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
                className={fieldClass}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className={errorClass} role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Trust row */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-[12.5px] text-muted-2">
          <span>Avg reply 3h</span>
          <span>4.9 helpfulness</span>
          <span>60 verified hosts</span>
        </div>

        {/* FAQ (mirrors the FAQPage structured data above) */}
        <AskFaq />
      </section>

      {/* ── Recently answered ──────────────────────────────────────── */}
      <RecentlyAnswered />
    </>
  );
}

function AskFaq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto mt-8 max-w-[560px] text-left">
      <div className="flex flex-col gap-2">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="rounded-[14px] bg-white p-4 px-5 shadow-[0_4px_16px_rgba(26,26,26,0.05)]"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="flex-1 text-[14.5px] font-bold text-ink">{f.q}</span>
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full transition-all duration-200 ${
                    isOpen ? "rotate-45 bg-accent text-white" : "bg-ink/5 text-ink"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </div>
              <div
                className="overflow-hidden text-left text-[13.5px] leading-[1.55] text-muted transition-all duration-300"
                style={isOpen ? { maxHeight: 120, opacity: 1, marginTop: 8 } : { maxHeight: 0, opacity: 0, marginTop: 0 }}
              >
                {f.a}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
