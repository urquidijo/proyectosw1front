"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { getToken, getStoredUser } from "@/app/lib/auth";
import { AuthUser } from "@/app/types/auth";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TAG_OPTIONS = [
  "PostgreSQL", "MySQL", "SQLite", "E-commerce", "Auth",
  "Blog", "CRM", "Inventario", "Finanzas", "HR", "Educación", "Salud"
];

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sqlFile, setSqlFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    loadPosts();
  }, [search, activeTag]);

  async function loadPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeTag) params.set("tag", activeTag);
      const res = await fetch(`${API_URL}/community/posts?${params}`);
      if (res.ok) setPosts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpvote(postId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    try {
      await fetch(`${API_URL}/community/posts/${postId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadPosts();
    } catch (e) { console.error(e); }
  }

  async function handleSubmitPost(e: FormEvent) {
    e.preventDefault();
    if (!title || !description) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      selectedTags.forEach(t => fd.append("tags", t));
      if (sqlFile) fd.append("sqlFile", sqlFile);
      if (imageFile) fd.append("imageFile", imageFile);

      const res = await fetch(`${API_URL}/community/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        setIsModalOpen(false);
        setTitle(""); setDescription(""); setSelectedTags([]); setSqlFile(null); setImageFile(null);
        loadPosts();
      } else {
        const err = await res.json();
        alert(err.message || "Error al publicar");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Comunidad de Plantillas
              </h1>
              <p className="mt-1 text-slate-500">
                Comparte y descarga esquemas SQL creados por la comunidad.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nueva Publicación
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar plantillas por nombre o descripción..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Tag Filters */}
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag("")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${!activeTag ? "bg-violet-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300"}`}
            >
              Todos
            </button>
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${activeTag === tag ? "bg-violet-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300"}`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" /></svg>
              </div>
              <p className="text-slate-500 font-medium">No se encontraron plantillas.</p>
              <p className="text-slate-400 text-sm mt-1">¡Sé el primero en compartir!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <article
                  key={post.id}
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  {/* Gradient Top */}
                  <div className="h-2 bg-linear-to-r from-violet-500 to-indigo-600" />
                  
                  <div className="flex flex-1 flex-col p-5">
                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {post.author?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{post.author?.name || "Anónimo"}</span>
                      <span className="ml-auto text-xs text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-slate-500 line-clamp-2 flex-1">
                      {post.description}
                    </p>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Stats */}
                    <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
                      <button
                        onClick={(e) => handleUpvote(post.id, e)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        {post.upvoteCount ?? 0}
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                        {post.commentCount ?? 0}
                      </span>
                      <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        {post.downloads}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* New Post Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">Nueva Publicación</h2>
                <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSubmitPost} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Título *</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Esquema completo para E-commerce con PostgreSQL"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción *</label>
                  <textarea
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe tu plantilla: qué incluye, para qué tipo de proyecto es ideal, cómo usarla..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Etiquetas</label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${selectedTags.includes(tag) ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Archivo SQL</label>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-5 cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition">
                      <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
                      <span className="text-xs text-slate-500 text-center">
                        {sqlFile ? sqlFile.name : "Haz clic para subir .sql"}
                      </span>
                      <input type="file" accept=".sql,.txt,.zip" className="hidden" onChange={e => setSqlFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Imagen de portada (opcional)</label>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-5 cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition">
                      <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                      <span className="text-xs text-slate-500 text-center">
                        {imageFile ? imageFile.name : "PNG, JPG hasta 5MB"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 pb-1">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-violet-600 px-6 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50"
                  >
                    {submitting ? "Publicando..." : "Publicar Plantilla"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
