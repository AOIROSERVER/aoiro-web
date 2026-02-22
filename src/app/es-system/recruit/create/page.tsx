"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import "@/app/es-system/companies/joblist.css";

const DEFAULT_FORM_SCHEMA = {
  fields: [
    { id: "minecraft_tag", label: "Minecraftゲームタグ", type: "text", required: true },
    { id: "motivation", label: "志望理由・意志表明", type: "textarea", required: true },
  ],
};

export default function RecruitCreatePage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [eyecatchFile, setEyecatchFile] = useState<File | null>(null);
  const [eyecatchPreview, setEyecatchPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    employmentType: "正社員",
    tags: "",
    maxParticipants: "0",
    formSchemaJson: JSON.stringify(DEFAULT_FORM_SCHEMA, null, 2),
  });

  useEffect(() => {
    if (authLoading || !user) return;
    fetch("/api/check-admin-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(!!data.isAdmin);
        setAdminCheckDone(true);
        if (!data.isAdmin) router.push("/es-system/companies");
      })
      .catch(() => setAdminCheckDone(true));
  }, [user, authLoading, router]);

  const handleEyecatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "画像は5MB以下にしてください" });
      return;
    }
    setEyecatchFile(file);
    const url = URL.createObjectURL(file);
    setEyecatchPreview(url);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "会社名・プロジェクト名を入力してください" });
      return;
    }
    let formSchema: Record<string, unknown> = DEFAULT_FORM_SCHEMA;
    try {
      formSchema = JSON.parse(form.formSchemaJson || "{}");
    } catch {
      setMessage({ type: "error", text: "フォームJSONの形式が正しくありません" });
      return;
    }
    if (!session?.access_token) {
      setMessage({ type: "error", text: "ログインし直してください" });
      return;
    }

    setSubmitting(true);
    let imageUrls: string[] = [];

    try {
      if (eyecatchFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", eyecatchFile);
        const uploadRes = await fetch("/api/es-upload-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "画像のアップロードに失敗しました");
        imageUrls = [uploadData.url];
        setUploading(false);
      }

      const res = await fetch("/api/es-companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          location: form.location.trim() || undefined,
          employmentType: form.employmentType || "正社員",
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          maxParticipants: parseInt(form.maxParticipants, 10) || 0,
          imageUrls,
          formSchema,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      setMessage({ type: "ok", text: `募集を作成しました（ID: ${data.id}）。会社一覧に反映されます。` });
      setForm({ ...form, name: "", description: "", location: "" });
      setEyecatchFile(null);
      setEyecatchPreview(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "保存に失敗しました" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!adminCheckDone || authLoading) {
    return (
      <div className="apply-login-required-wrap">
        <p style={{ color: "var(--color-text-muted)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="companies-joblist">
      <div className="back-link" style={{ paddingTop: 24, paddingBottom: 16 }}>
        <Link href="/es-system/companies">← 会社一覧へ戻る</Link>
        <span style={{ marginLeft: 16 }}>
          <Link href="/es-system/company-admin">申請リスト・管理</Link>
        </span>
      </div>

      <div className="main" style={{ flexDirection: "column", maxWidth: 720, margin: "0 auto" }}>
        <div className="detail-panel" style={{ position: "relative", maxHeight: "none" }}>
          <div className="detail-body">
            <h1 className="detail-title">募集作成</h1>
            <p className="section-sub" style={{ marginBottom: 24 }}>
              テキスト情報はGoogleスプレッドシート（GAS）に、アイキャッチ画像はSupabaseに保存されます。
            </p>

            <form onSubmit={handleSubmit}>
              {message && (
                <div
                  className="info-item"
                  style={{
                    marginBottom: 16,
                    background: message.type === "ok" ? "#e6f7ee" : "#ffebee",
                    color: message.type === "ok" ? "#1e7e45" : "#c62828",
                  }}
                >
                  {message.text}
                </div>
              )}

              <div className="detail-section-title">基本情報</div>
              <div className="detail-info-grid" style={{ gridTemplateColumns: "1fr" }}>
                <div className="info-item">
                  <div className="info-item-label">会社名・プロジェクト名 *</div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="例: 建築部 / 〇〇プロジェクト"
                    className="info-item-value"
                    style={{ border: "none", background: "transparent", width: "100%", padding: 0 }}
                  />
                </div>
                <div className="info-item">
                  <div className="info-item-label">説明（GASに保存）</div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="募集内容の説明"
                    rows={4}
                    style={{ width: "100%", border: "none", background: "transparent", resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
                <div className="info-item">
                  <div className="info-item-label">勤務地・場所</div>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="例: AOIROSERVER 内 / 東京都"
                    className="info-item-value"
                    style={{ border: "none", background: "transparent", width: "100%", padding: 0 }}
                  />
                </div>
                <div className="info-item">
                  <div className="info-item-label">雇用形態</div>
                  <input
                    type="text"
                    value={form.employmentType}
                    onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}
                    placeholder="正社員"
                    style={{ width: "100%", border: "none", background: "transparent", padding: 0, fontFamily: "inherit" }}
                  />
                </div>
                <div className="info-item">
                  <div className="info-item-label">タグ（カンマ区切り）</div>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="建築, リモート可, イベント"
                    className="info-item-value"
                    style={{ border: "none", background: "transparent", width: "100%", padding: 0 }}
                  />
                </div>
                <div className="info-item">
                  <div className="info-item-label">参加可能人数</div>
                  <input
                    type="number"
                    min={0}
                    value={form.maxParticipants}
                    onChange={(e) => setForm((p) => ({ ...p, maxParticipants: e.target.value }))}
                    style={{ width: "100%", border: "none", background: "transparent", padding: 0, fontFamily: "inherit" }}
                  />
                </div>
              </div>

              <hr className="detail-divider" />
              <div className="detail-section-title">アイキャッチ画像（Supabaseに保存）</div>
              <p className="section-sub" style={{ marginBottom: 12 }}>
                1枚まで。JPEG/PNG/GIF/WebP、5MB以下。アップロードすると自動でSupabaseに保存され、URLがスプレッドシートに記録されます。
              </p>
              <div className="info-item" style={{ marginBottom: 16 }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleEyecatchChange}
                  style={{ fontSize: 14 }}
                />
                {eyecatchPreview && (
                  <div style={{ marginTop: 12 }}>
                    <img src={eyecatchPreview} alt="プレビュー" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                    <button
                      type="button"
                      onClick={() => {
                        setEyecatchFile(null);
                        setEyecatchPreview(null);
                        if (eyecatchPreview) URL.revokeObjectURL(eyecatchPreview);
                      }}
                      style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-link)" }}
                    >
                      画像を外す
                    </button>
                  </div>
                )}
              </div>

              <hr className="detail-divider" />
              <div className="detail-section-title">応募フォーム定義（JSON・GASに保存）</div>
              <textarea
                value={form.formSchemaJson}
                onChange={(e) => setForm((p) => ({ ...p, formSchemaJson: e.target.value }))}
                rows={12}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: 13,
                  padding: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  marginBottom: 24,
                }}
                placeholder='{"fields":[{"id":"minecraft_tag","label":"Minecraftタグ","type":"text","required":true},...]}'
              />

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button type="submit" className="btn-apply" disabled={submitting || uploading}>
                  {uploading ? "画像アップロード中..." : submitting ? "保存中..." : "募集を作成（GASに保存）"}
                </button>
                <Link href="/es-system/companies" className="apply-login-required-back">
                  キャンセル
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
