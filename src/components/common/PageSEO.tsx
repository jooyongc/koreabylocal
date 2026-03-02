import { Helmet } from "react-helmet-async";

const SITE_URL = "https://koreabylocal.com";
const SITE_NAME = "Korea By Local";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const HREFLANG_KR = "https://localcontentslab.kr";

export interface PageSEOProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: object | object[];
  children?: React.ReactNode;
}

export default function PageSEO({
  title,
  description,
  path,
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd,
  children,
}: PageSEOProps) {
  const canonicalUrl = `${SITE_URL}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="ko" href={`${HREFLANG_KR}${path}`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {jsonLdArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

export { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE };
