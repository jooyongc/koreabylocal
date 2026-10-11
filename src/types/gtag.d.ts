// gtag() is defined by the inline GA4 snippet useSiteAnalytics injects once a
// GA4 id is configured; until then (or with GA blocked) it does not exist.
interface Window {
  gtag?: (...args: unknown[]) => void;
}
