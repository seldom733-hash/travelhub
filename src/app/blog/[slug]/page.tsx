"use client";

import { useState, useEffect, use } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/components/Toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  authorName: string;
  authorAvatar: string | null;
  readTime: number;
  publishedAt: string | null;
}

export default function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useI18n();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) throw new Error("Статья не найдена");
        const data = await res.json();
        setPost(data.post);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-80 bg-gray-200 rounded-3xl" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-secondary mb-2">{error || "Статья не найдена"}</h1>
          <a href="/blog" className="mt-4 inline-block h-12 px-8 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors">
            К блогу
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {post.category}
              </span>
              {post.publishedAt && (
                <span className="text-white/70 text-sm">
                  {new Date(post.publishedAt).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              )}
              <span className="text-white/70 text-sm">· {post.readTime} мин чтения</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  post.authorName.split(" ").map((w) => w[0]).join("")
                )}
              </div>
              <span className="text-white font-medium">{post.authorName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <a href="/" className="hover:text-primary transition-colors">Главная</a>
          <span>/</span>
          <a href="/blog" className="hover:text-primary transition-colors">Блог</a>
          <span>/</span>
          <span className="text-secondary font-medium truncate">{post.title}</span>
        </nav>

        {/* Article */}
        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="prose max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">{post.content}</div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <a href="/blog" className="h-12 px-6 bg-white border-2 border-gray-200 hover:border-primary hover:text-primary text-secondary rounded-xl font-semibold transition-all flex items-center gap-2">
            ← Все статьи
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: post.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast(t("filter.linkCopied"), "success");
              }
            }}
            className="h-12 px-6 bg-white border-2 border-gray-200 hover:border-primary hover:text-primary text-secondary rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            📤 Поделиться
          </button>
        </div>
      </div>
    </div>
  );
}
