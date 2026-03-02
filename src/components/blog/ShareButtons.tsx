import { useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export default function ShareButtons({
  url,
  title,
  description,
  imageUrl,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareKakao = () => {
    if (!window.Kakao?.Share) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: imageUrl ?? "",
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: "Read More",
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "facebook-share",
      "width=580,height=400"
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      "twitter-share",
      "width=580,height=400"
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-sm text-text-secondary">
        <Share2 className="inline h-4 w-4" />
      </span>

      {/* KakaoTalk */}
      <button
        onClick={shareKakao}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEE500] transition-opacity hover:opacity-80"
        aria-label="Share on KakaoTalk"
        title="KakaoTalk"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000000">
          <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6l-.95 3.52c-.08.3.25.55.52.38L10 18.9c.65.1 1.32.15 2 .15 5.52 0 10-3.58 10-7.95S17.52 3 12 3z" />
        </svg>
      </button>

      {/* Facebook */}
      <button
        onClick={shareFacebook}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white transition-opacity hover:opacity-80"
        aria-label="Share on Facebook"
        title="Facebook"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      {/* Twitter / X */}
      <button
        onClick={shareTwitter}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
        aria-label="Share on X"
        title="X (Twitter)"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      {/* Copy Link */}
      <button
        onClick={copyLink}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-text-secondary transition-colors hover:bg-gray-300"
        aria-label="Copy link"
        title="Copy link"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <LinkIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
