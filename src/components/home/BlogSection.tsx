import { useState } from "react";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import SectionHeader from "./SectionHeader";
import BlogCard from "./BlogCard";
import { BlogCardSkeleton } from "@/components/common/Skeleton";
import type { BlogCategory } from "@/types";

const TABS: { label: string; value: BlogCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "NEWS", value: "NEWS" },
  { label: "LOCALS", value: "LOCALS" },
  { label: "KOREAN", value: "KOREAN" },
  { label: "K-CULTURE", value: "K-CULTURE" },
];

export default function BlogSection() {
  const [activeTab, setActiveTab] = useState<BlogCategory | undefined>(undefined);
  const { data: posts, isLoading } = useBlogPosts(activeTab, 8);

  return (
    <section className="bg-background-gray py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          title="Blog"
          subtitle="Festival, Local Travel, How to go, Etc."
          action={{ label: "MORE VIEW", href: "/blog" }}
        />

        {/* Category tabs */}
        <div className="scrollbar-hide -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "bg-white text-text-secondary hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Blog grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))
            : posts?.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
        </div>

        {!isLoading && (!posts || posts.length === 0) && (
          <p className="py-8 text-center text-text-secondary">
            No blog posts found in this category.
          </p>
        )}
      </div>
    </section>
  );
}
