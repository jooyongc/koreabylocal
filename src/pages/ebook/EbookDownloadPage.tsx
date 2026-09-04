import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import PageSEO from "@/components/common/PageSEO";
import { supabase } from "@/lib/supabase";

export default function EbookDownloadPage() {
  const { token } = useParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      const { data, error: fnError, response } = await supabase.functions.invoke("download-ebook", {
        body: { token },
      });
      if (cancelled) return;
      if (fnError || !data?.url) {
        let message = "This download link is no longer valid.";
        try {
          const body = await response?.clone().json();
          if (body?.error) message = body.error;
        } catch {
          // Keep the default message if the error body isn't JSON.
        }
        setError(message);
        return;
      }
      window.location.href = data.url;
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <PageSEO title="Download | Korea By Local" description="Downloading your e-book." path="/ebook/download" noindex />

      <div className="mx-auto max-w-[480px] px-4 py-[clamp(48px,8vw,96px)] text-center sm:px-6">
        {error ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-coral/10">
              <AlertCircle className="h-8 w-8 text-coral" />
            </div>
            <h1 className="font-display text-[24px] font-extrabold text-ink">{error}</h1>
            <p className="mt-3 text-[14.5px] text-muted">
              If you believe this is a mistake, email us at{" "}
              <a href="mailto:info@koreabylocal.com" className="font-semibold text-accent hover:underline">
                info@koreabylocal.com
              </a>{" "}
              and we'll sort it out.
            </p>
            <Link to="/ebook" className="mt-6 inline-block text-[14.5px] font-semibold text-accent hover:underline">
              ← Back to the e-book
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
            <h1 className="mt-5 font-display text-[20px] font-extrabold text-ink">Preparing your download…</h1>
          </>
        )}
      </div>
    </>
  );
}
