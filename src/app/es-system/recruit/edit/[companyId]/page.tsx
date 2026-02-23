"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import "@/app/es-system/companies/joblist.css";

const BUCKET = "recruit-eyecatch";

function dataURLtoBlob(dataUrl: string): { blob: Blob; ext: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mime = (m?.[1] ?? "image/png").trim().toLowerCase();
  const ext = mime === "image/jpeg" ? "jpg" : mime.replace("image/", "") || "png";
  const bstr = atob(m?.[2] ?? "");
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return { blob: new Blob([u8], { type: mime }), ext };
}

type Company = {
  id: string;
  name: string;
  description: string;
  location: string;
  employmentType: string;
  tags: string[];
  maxParticipants: number;
  imageUrls: string[];
};

export default function RecruitEditPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.companyId != null ? String(params.companyId) : null;
  const { user, session, loading: authLoading } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [eyecatchDataUrl, setEyecatchDataUrl] = useState<string | null>(null);
  const [recruitmentKind, setRecruitmentKind] = useState<"正社員" | "アルバイト">("正社員");
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    tags: "",
    maxParticipants: "0",
  });

  useEffect(() => {
    if (!companyId || !user) return;
    fetch(`/api/es-companies/${companyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCompany(data);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          location: data.location ?? "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          maxParticipants: String(data.maxParticipants ?? 0),
        });
        setRecruitmentKind(data.employmentType === "正社員" ? "正社員" : "アルバイト");
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [companyId, user]);

  useEffect(() => {
    if (!user && !authLoading) router.push("/es-system/companies");
  }, [user, authLoading, router]);

  const handleEyecatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "画像は5MB以下にしてください" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "画像ファイルを選択してください" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEyecatchDataUrl((ev.target?.result as string) ?? null);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !session?.access_token) return;
    setMessage(null);
    setSubmitting(true);
    let imageUrls: string[] = company?.imageUrls ?? [];

    try {
      if (eyecatchDataUrl) {
        setUploading(true);
        const { blob, ext } = dataURLtoBlob(eyecatchDataUrl);
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
        if (error) throw new Error(error.message);
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        imageUrls = [urlData.publicUrl];
        setUploading(false);
      }

      const res = await fetch(`/api/es-companies/${companyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          location: form.location.trim() || undefined,
          employmentType: recruitmentKind,
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          maxParticipants: parseInt(form.maxParticipants, 10) || 0,
          imageUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      setMessage({ type: "ok", text: "募集を更新しました。" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "更新に失敗しました" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (authLoading || (loading && !company)) {
    return (
      <div className="apply-login-required-wrap">
        <p style={{ color: "var(--color-text-muted)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!user || !company) {
    return (
      <div className="apply-login-required-wrap">
        <p style={{ color: "var(--color-text-muted)" }}>会社が見つかりません。</p>
        <Link href="/es-system/recruit/my" className="apply-login-required-back">← 自分の投稿へ</Link>
      </div>
    );
  }

  return (
    <div className="companies-joblist recruit-create-page" style={{ paddingBottom: 120 }}>
      <div className="back-link" style={{ paddingTop: 24, paddingBottom: 16 }}>
        <Link href="/es-system/recruit/my">← 自分の投稿へ</Link>
      </div>

      <div className="main" style={{ flexDirection: "column", maxWidth: 720, margin: "0 auto" }}>
        <div className="detail-panel" style={{ position: "relative", maxHeight: "none" }}>
          <div className="detail-body">
            <h1 className="detail-title">募集を編集</h1>
            <p className="section-sub" style={{ marginBottom: 24 }}>{company.name} の内容を変更します。</p>

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

              <div className="detail-section-title">募集種別</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="radio" name="recruitmentKind" checked={recruitmentKind === "正社員"} onChange={() => setRecruitmentKind("正社員")} />
                  <span>正社員募集</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="radio" name="recruitmentKind" checked={recruitmentKind === "アルバイト"} onChange={() => setRecruitmentKind("アルバイト")} />
                  <span>アルバイト・プロジェクト募集</span>
                </label>
              </div>

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
                  <div className="info-item-label">説明</div>
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
                    placeholder="例: AOIROSERVER 内"
                    className="info-item-value"
                    style={{ border: "none", background: "transparent", width: "100%", padding: 0 }}
                  />
                </div>
                <div className="info-item">
                  <div className="info-item-label">タグ（カンマ区切り）</div>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="建築, リモート可"
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
              <div className="detail-section-title">アイキャッチ画像</div>
              <p className="section-sub" style={{ marginBottom: 12 }}>変更する場合のみ選択。5MB以下。</p>
              <div className="info-item" style={{ marginBottom: 16 }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleEyecatchChange}
                  style={{ fontSize: 14 }}
                />
                {eyecatchDataUrl ? (
                  <div style={{ marginTop: 12 }}>
                    <img src={eyecatchDataUrl} alt="プレビュー" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                    <button type="button" onClick={() => setEyecatchDataUrl(null)} style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-link)" }}>画像を外す</button>
                  </div>
                ) : company.imageUrls?.[0] ? (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>現在の画像</p>
                    <img src={company.imageUrls[0]} alt="" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 24 }}>
                <button type="submit" className="btn-apply" disabled={submitting || uploading}>
                  {uploading ? "画像アップロード中..." : submitting ? "更新中..." : "更新する"}
                </button>
                <Link href="/es-system/recruit/my" className="apply-login-required-back">キャンセル</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
