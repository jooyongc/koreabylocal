import { useState } from "react";
import { X, Mail, Loader2, Download } from "lucide-react";

interface EmailDownloadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  magazineTitle: string;
  isLoading: boolean;
}

export default function EmailDownloadModal({
  open,
  onClose,
  onSubmit,
  magazineTitle,
  isLoading,
}: EmailDownloadModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    await onSubmit(email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">
            Free Download
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary/5 p-3">
            <Download className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-gray-700">
              <span className="font-medium">{magazineTitle}</span>
            </p>
          </div>

          <p className="mb-4 text-sm text-text-secondary">
            Enter your email to receive the download link. We'll also send a
            copy to your inbox.
          </p>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          {error && (
            <p className="mt-1.5 text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isLoading ? "Preparing download..." : "Download for Free"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            We respect your privacy. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
}
