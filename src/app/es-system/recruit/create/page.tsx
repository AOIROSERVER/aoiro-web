"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import "@/app/es-system/companies/joblist.css";

const BUCKET = "recruit-eyecatch";

/** DataURL を Blob に変換（クライアント直接アップロード用） */
function dataURLtoBlob(dataUrl: string): { blob: Blob; ext: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mime = (m?.[1] ?? "image/png").trim().toLowerCase();
  const ext = mime === "image/jpeg" ? "jpg" : mime.replace("image/", "") || "png";
  const bstr = atob(m?.[2] ?? "");
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return { blob: new Blob([u8], { type: mime }), ext };
}

const BASE_FORM_FIELDS = [
  { id: "minecraft_tag", label: "Minecraftゲームタグ", type: "text", required: true },
  { id: "motivation", label: "志望理由・意志表明", type: "textarea", required: true },
] as const;

function buildFormSchema(skillImageRequired: boolean) {
  return {
    fields: [
      ...BASE_FORM_FIELDS,
      { id: "skill_image", label: "技術確認用画像（技術レベル確認用）", type: "image", required: skillImageRequired },
    ],
  };
}

export default function RecruitCreatePage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  /** クエスト作成と同じ: FileReader.readAsDataURL で Base64 DataURL を保持 */
  const [eyecatchDataUrl, setEyecatchDataUrl] = useState<string | null>(null);
  /** 募集種別: 正社員 or アルバイト・プロジェクト（雇用形態の元になる） */
  const [recruitmentKind, setRecruitmentKind] = useState<"正社員" | "アルバイト">("正社員");
  /** 技術確認用画像を必須にするか（応募作成で変更可能） */
  const [skillImageRequired, setSkillImageRequired] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    employmentType: "正社員",
    tags: "",
    maxParticipants: "0",
  });

  useEffect(() => {
    if (authLoading) return;
    setAdminCheckDone(true);
    if (!user) router.push("/es-system/companies");
  }, [user, authLoading, router]);

  /** クエスト作成と同じ: 画像を Base64 DataURL で保持（保存先は Supabase） */
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
      const result = ev.target?.result as string;
      setEyecatchDataUrl(result ?? null);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "会社名・プロジェクト名を入力してください" });
      return;
    }
    if (!session?.access_token) {
      setMessage({ type: "error", text: "ログインし直してください" });
      return;
    }

    setSubmitting(true);
    let imageUrls: string[] = [];

    try {
      if (eyecatchDataUrl) {
        setUploading(true);
        // SERVICE_ROLE_KEY 不要: クライアントの Supabase（anon + セッション）で Storage に直接アップロード
        const { blob, ext } = dataURLtoBlob(eyecatchDataUrl);
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType: blob.type,
          upsert: false,
        });
        if (error) throw new Error(error.message);
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        imageUrls = [urlData.publicUrl];
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
          employmentType: recruitmentKind === "正社員" ? "正社員" : "アルバイト",
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          maxParticipants: parseInt(form.maxParticipants, 10) || 0,
          imageUrls,
          formSchema: buildFormSchema(skillImageRequired),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      setMessage({ type: "ok", text: `募集を作成しました（ID: ${data.id}）。会社一覧に反映されます。` });
      setForm({ ...form, name: "", description: "", location: "" });
      setEyecatchDataUrl(null);
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

  if (!user) {
    return null;
  }

  return (
    <div className="companies-joblist recruit-create-page" style={{ paddingBottom: 120 }}>
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

              <div className="detail-section-title">募集種別</div>
              <p className="section-sub" style={{ marginBottom: 12, fontSize: 13 }}>
                正社員募集か、アルバイト・プロジェクト募集かを選びます。会社一覧でタブ分けされて表示されます。
              </p>
              <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="recruitmentKind"
                    checked={recruitmentKind === "正社員"}
                    onChange={() => setRecruitmentKind("正社員")}
                  />
                  <span>正社員募集</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="recruitmentKind"
                    checked={recruitmentKind === "アルバイト"}
                    onChange={() => setRecruitmentKind("アルバイト")}
                  />
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
                    placeholder="例: AOIROSERVER 内 / 東京都"
                    className="info-item-value"
                    style={{ border: "none", background: "transparent", width: "100%", padding: 0 }}
                  />
                </div>
                <div className="info-item">
                  <div className="info-item-label">雇用形態（募集種別から自動）</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                    {recruitmentKind === "正社員" ? "正社員" : "アルバイト"}
                  </div>
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
              <div className="detail-section-title">アイキャッチ画像</div>
              <p className="section-sub" style={{ marginBottom: 12 }}>
                1枚まで。JPEG/PNG/GIF/WebP、5MB以下
              </p>
              <div className="info-item" style={{ marginBottom: 16 }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleEyecatchChange}
                  style={{ fontSize: 14 }}
                />
                {eyecatchDataUrl && (
                  <div style={{ marginTop: 12 }}>
                    <img src={eyecatchDataUrl} alt="プレビュー" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                    <button
                      type="button"
                      onClick={() => setEyecatchDataUrl(null)}
                      style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-link)" }}
                    >
                      画像を外す
                    </button>
                  </div>
                )}
              </div>

              <div className="detail-section-title" style={{ marginTop: 16 }}>応募フォーム設定</div>
              <p className="section-sub" style={{ marginBottom: 12 }}>
                応募フォームには「Minecraftゲームタグ」「志望理由・意志表明」に加え、技術レベル確認用の画像アップロードを追加できます。
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={skillImageRequired}
                  onChange={(e) => setSkillImageRequired(e.target.checked)}
                />
                <span>技術確認用画像を必須にする</span>
              </label>
              <p className="section-sub" style={{ marginTop: 8, fontSize: 13, color: "var(--color-text-muted)" }}>
                応募者はMCID認証済みならゲームタグが自動入力されます。技術確認用画像は社長のDiscord DMに送られ、ダッシュボード（自分の投稿）で許可・拒否できます。
              </p>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 24 }}>
                <button type="submit" className="btn-apply" disabled={submitting || uploading}>
                  {uploading ? "画像アップロード中..." : submitting ? "保存中..." : "募集を作成"}
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
