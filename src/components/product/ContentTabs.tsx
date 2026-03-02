import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ContentTabsProps {
  content: string | null;
}

interface TabItem {
  label: string;
  key: string;
}

const TABS: TabItem[] = [
  { label: "Description", key: "description" },
  { label: "What's Included", key: "included" },
  { label: "How to Book", key: "booking" },
  { label: "Cancellation Policy", key: "cancellation" },
];

// Parse content into sections by heading markers
// Expected format: ## Description\n...\n## What's Included\n...
function parseContentSections(content: string | null): Record<string, string> {
  if (!content) return {};

  const sections: Record<string, string> = {};
  const lines = content.split("\n");
  let currentKey = "description";
  let currentLines: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      // Save previous section
      if (currentLines.length > 0) {
        sections[currentKey] = currentLines.join("\n").trim();
      }
      // Determine new section key
      const title = heading[1].toLowerCase();
      if (title.includes("included")) currentKey = "included";
      else if (title.includes("book") || title.includes("how")) currentKey = "booking";
      else if (title.includes("cancel") || title.includes("refund"))
        currentKey = "cancellation";
      else currentKey = "description";
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Save last section
  if (currentLines.length > 0) {
    sections[currentKey] = currentLines.join("\n").trim();
  }

  return sections;
}

export default function ContentTabs({ content }: ContentTabsProps) {
  const sections = parseContentSections(content);
  const [activeTab, setActiveTab] = useState("description");
  const [expandedMobile, setExpandedMobile] = useState<string | null>("description");

  // Filter tabs to only those that have content
  // Always show description if any content exists
  const availableTabs = TABS.filter(
    (tab) =>
      sections[tab.key] ||
      (tab.key === "description" && content && !sections.description),
  );

  if (!content && availableTabs.length === 0) return null;

  // If content has no heading markers, treat entire content as description
  const descriptionFallback =
    !sections.description && content ? content : undefined;

  function getContent(key: string): string {
    if (key === "description" && descriptionFallback) return descriptionFallback;
    return sections[key] ?? "";
  }

  return (
    <>
      {/* Desktop tabs */}
      <div className="hidden lg:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:border-gray-300 hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div
          className="prose prose-sm max-w-none pt-6 text-text-secondary"
          dangerouslySetInnerHTML={{
            __html: formatContent(getContent(activeTab)),
          }}
        />
      </div>

      {/* Mobile accordion */}
      <div className="lg:hidden">
        <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
          {availableTabs.map((tab) => {
            const isOpen = expandedMobile === tab.key;
            const tabContent = getContent(tab.key);
            if (!tabContent) return null;

            return (
              <div key={tab.key}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedMobile(isOpen ? null : tab.key)
                  }
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-medium text-primary">
                    {tab.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-text-secondary transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div
                    className="prose prose-sm max-w-none px-4 pb-4 text-text-secondary"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(tabContent),
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Basic markdown-like formatting: convert newlines to <br>, **bold**, *italic*
function formatContent(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
