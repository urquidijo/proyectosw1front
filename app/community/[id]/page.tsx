"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken, getStoredUser } from "@/app/lib/auth";
import { AuthUser } from "@/app/types/auth";
import { useEffect, useState, FormEvent, use } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ✅ FIX: Next.js 16 requires params to be unwrapped with React.use()
export default function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    loadPost();
  }, [id]);

  async function loadPost() {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/community/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setPost(await res.json());
      else router.push("/community");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/community/posts/${id}/download`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { url } = await res.json();
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        loadPost();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }

  async function handleUpvote() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setUpvoting(true);
    try {
      await fetch(`${API_URL}/community/posts/${id}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadPost();
    } catch (e) {
      console.error(e);
    } finally {
      setUpvoting(false);
    }
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/community/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: comment }),
      });
      if (res.ok) {
        setComment("");
        loadPost();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("¿Eliminar este comentario?")) return;
    const token = getToken();
    await fetch(`${API_URL}/community/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadPost();
  }

  async function handleDeletePost() {
    if (!confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    const token = getToken();
    const res = await fetch(`${API_URL}/community/posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) router.push("/community");
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="mx-auto max-w-4xl px-4 py-12">
            <div className="h-64 animate-pulse rounded-2xl bg-slate-200 mb-6" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!post) return null;

  const isAuthor = user?.id === post.authorId;
  const isAdmin = user?.role === "SUPERADMIN";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* Back button */}
          <button
            onClick={() => router.push("/community")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver a la comunidad
          </button>

          {/* Post Card */}
          <article className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {/* Cover Image — signed URL from backend */}
            {post.imageUrl && (
              <div className="relative group cursor-pointer" onClick={() => setIsImageOpen(true)}>
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-56 object-cover"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setIsImageOpen(true); }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/80 opacity-0 group-hover:opacity-100 shadow-md"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  Ver imagen completa
                </button>
              </div>
            )}

            {/* Gradient Bar */}
            <div className="h-1.5 bg-linear-to-r from-violet-500 to-indigo-600" />

            <div className="p-6 sm:p-8">
              {/* Author and Date */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {post.author?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{post.author?.name}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                {/* Author or Admin controls */}
                <div className="ml-auto flex items-center gap-3">
                  {(isAuthor || isAdmin) && (
                    <button
                      onClick={handleDeletePost}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition flex items-center gap-1"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {isAdmin && !isAuthor ? "Eliminar (Admin)" : "Eliminar post"}
                    </button>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
                {post.title}
              </h1>

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-violet-50 px-3 py-0.5 text-xs font-semibold text-violet-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">
                {post.description}
              </p>

              {/* Actions Bar */}
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                {/* Download — only shown if fileKey exists */}
                {post.fileKey && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50 active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    {downloading ? "Preparando descarga..." : `Descargar SQL · ${post.downloads} ${post.downloads === 1 ? "descarga" : "descargas"}`}
                  </button>
                )}

                {/* Upvote */}
                <button
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${post.userHasUpvoted ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600"}`}
                >
                  <svg className="h-4 w-4" fill={post.userHasUpvoted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  {post.upvoteCount} {post.upvoteCount === 1 ? "voto" : "votos"}
                </button>

                <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                  {post.comments?.length ?? 0} comentarios
                </span>
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
              Comentarios ({post.comments?.length ?? 0})
            </h2>

            {/* Comment form */}
            <form onSubmit={handleComment} className="mb-6 flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  placeholder="Escribe un comentario..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!comment.trim() || submittingComment}
                    className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition disabled:opacity-40"
                  >
                    {submittingComment ? "Enviando..." : "Comentar"}
                  </button>
                </div>
              </div>
            </form>

            {/* Comment List */}
            <div className="space-y-4">
              {post.comments?.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-6">Aún no hay comentarios. ¡Sé el primero!</p>
              )}
              {post.comments?.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {c.author?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-800">{c.author?.name}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {(user?.id === c.authorId || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="ml-auto text-xs text-rose-400 hover:text-rose-600 transition"
                        >
                          {isAdmin && user?.id !== c.authorId ? "Eliminar (Admin)" : "Eliminar"}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Fullscreen Image Modal */}
      {isImageOpen && post.imageUrl && (
        <div 
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsImageOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-slate-300 transition bg-slate-800/50 rounded-full p-2"
            onClick={() => setIsImageOpen(false)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </AuthGuard>
  );
}
