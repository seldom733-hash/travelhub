"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";
import Breadcrumb from "@/components/Breadcrumb";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  authorName: string;
  authorAvatar: string | null;
  readTime: number;
  publishedAt: string | null;
  tags: string[];
}

interface BlogResponse {
  posts: BlogPost[];
  total: number;
}

const categories = ["Все", "Пляжи", "Отели", "Экскурсии", "Советы", "Маршруты"];

export default function BlogPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState("Все");
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const categoryParam = activeCategory !== "Все" ? `&category=${encodeURIComponent(activeCategory)}` : "";
  const url = `/api/blog?limit=12&offset=0${categoryParam}`;

  const { data, loading } = useFetch<BlogResponse>(url, { retries: 1, retryDelay: 2000 });

  // Sync useFetch data into local state when category changes
  useEffect(() => {
    if (data) {
      setAllPosts(data.posts);
      setTotal(data.total);
      setOffset(data.posts.length);
    }
  }, [data]);

  const posts = allPosts;
  const displayTotal = total;

  const handleLoadMore = async () => {
    const next = offset;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/blog?limit=12&offset=${next}${categoryParam}`);
      if (res.ok) {
        const json = await res.json();
        const newPosts = json.posts || [];
        setAllPosts((prev) => [...prev, ...newPosts]);
        setTotal(json.total || 0);
        setOffset(next + newPosts.length);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: t("blog.title") }]} />

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-secondary mb-3">{t("blog.title")}</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t("blog.subtitle")}
          </p>
        </div>

        {/* Categories */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <>
            {/* Featured skeleton */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-10 animate-pulse">
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-80 bg-gray-200" />
                <div className="p-8 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500">{t("blog.empty")}</p>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featured && (
              <a
                href={`/blog/${featured.slug}`}
                className="group block bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all mb-10"
              >
                <div className="grid md:grid-cols-2">
                  <div className="relative h-64 md:h-auto">
                    <img
                      src={featured.coverImage}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {t("blog.featured")}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {featured.category}
                      </span>
                      {featured.publishedAt && (
                        <span className="text-sm text-gray-400">
                          {new Date(featured.publishedAt).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                      <span className="text-sm text-gray-400">· {featured.readTime} мин</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-4 group-hover:text-primary transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-6">{featured.excerpt}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {featured.authorAvatar ? (
                          <img src={featured.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          "TH"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary">{featured.authorName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((article) => (
                <a
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-secondary text-xs font-medium px-2.5 py-1 rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                      {article.publishedAt && (
                        <span>{new Date(article.publishedAt).toLocaleDateString("ru-RU")}</span>
                      )}
                      <span>·</span>
                      <span>{article.readTime} мин чтения</span>
                    </div>
                    <h3 className="font-bold text-secondary mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{article.excerpt}</p>
                    <div className="flex items-center gap-2">
                      {article.authorAvatar ? (
                        <img src={article.authorAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary text-[10px] font-bold">
                          {article.authorName.split(" ").map((w) => w[0]).join("")}
                        </div>
                      )}
                      <span className="text-xs text-gray-500">{article.authorName}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Load More */}
            {posts.length < displayTotal && (
              <div className="text-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="h-12 px-8 bg-white border-2 border-gray-200 hover:border-primary hover:text-primary text-secondary rounded-2xl font-semibold transition-all disabled:opacity-50"
                >
                  {loadingMore ? t("blog.loading") : t("blog.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
