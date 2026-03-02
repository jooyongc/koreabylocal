import { useEffect, useRef } from "react";
import EmbeddedProductCard from "./EmbeddedProductCard";

interface BlogContentProps {
  html: string;
}

interface Segment {
  type: "html" | "product";
  content: string;
  productId?: number;
}

function parseContent(html: string): Segment[] {
  const regex = /<div\s+data-product-id="(\d+)"\s*><\/div>/gi;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "html",
        content: html.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "product",
      content: "",
      productId: Number(match[1]),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    segments.push({
      type: "html",
      content: html.slice(lastIndex),
    });
  }

  return segments;
}

function HtmlSegment({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const images = ref.current.querySelectorAll("img");
    images.forEach((img) => {
      img.loading = "lazy";
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-accent prose-img:rounded-xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function BlogContent({ html }: BlogContentProps) {
  const segments = parseContent(html);

  return (
    <div>
      {segments.map((segment, i) =>
        segment.type === "html" ? (
          <HtmlSegment key={i} html={segment.content} />
        ) : (
          <EmbeddedProductCard key={i} productId={segment.productId!} />
        )
      )}
    </div>
  );
}
