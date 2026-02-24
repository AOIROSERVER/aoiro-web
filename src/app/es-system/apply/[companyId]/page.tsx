"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import "@/app/es-system/companies/joblist.css";

type FormField = { id: string; type: string; required?: boolean; label?: string };
type Company = {
  id: string;
  name: string;
  description: string;
  location: string;
  employmentType: string;
  tags: string[];
  formSchema: { fields?: FormField[] } | null;
  maxParticipants: number;
  imageUrls: string[];
  createdAt: string;
  active: boolean;
  creativeRequired?: boolean;
  creativeStatus?: string;
  members?: { discordId: string; discordUsername: string }[];
};

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const companyId = params?.companyId != null ? String(params.companyId) : null;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [mcid, setMcid] = useState<string | null>(null);
  const [mcidLoading, setMcidLoading] = useState(true);
  const [motivation, setMotivation] = useState("");
  const [skillImageFile, setSkillImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [dmSent, setDmSent] = useState<boolean | null>(null);

  const skillImageField = company?.formSchema?.fields?.find((f) => f.id === "skill_image") as FormField | undefined;
  const skillImageRequired = skillImageField?.required === true;

  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/es-companies/${encodeURIComponent(companyId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("会社が見つかりません");
        return res.json();
      })
      .then((data) => setCompany(data))
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    if (!user) {
      setMcidLoading(false);
      return;
    }
    const fromMetadata = (user.user_metadata as Record<string, string> | undefined)?.game_tag;
    if (fromMetadata && typeof fromMetadata === "string" && fromMetadata.trim()) {
      setMcid(fromMetadata.trim());
      setMcidLoading(false);
      return;
    }
    fetch("/api/mcid-for-current-user", { credentials: "include", headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
      .then((r) => r.json())
      .then((d: { mcid?: string | null }) => {
        setMcid(d.mcid && typeof d.mcid === "string" ? d.mcid.trim() : null);
      })
      .catch(() => setMcid(null))
      .finally(() => setMcidLoading(false));
  }, [user?.id, user?.user_metadata, session?.access_token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const minecraftTag = mcid ?? "";
    if (!minecraftTag.trim()) {
      setError("MCID認証を完了してください。");
      return;
    }
    if (!motivation.trim()) {
      setError("志望理由・意志表明を入力してください。");
      return;
    }
    if (skillImageRequired && !skillImageFile) {
      setError("技術確認用画像をアップロードしてください。");
      return;
    }
    if (skillImageFile && skillImageFile.size > 8 * 1024 * 1024) {
      setError("画像は8MB以下にしてください。");
      return;
    }
    setSubmitting(true);
    try {
      const token = session?.access_token;
      const formData = new FormData();
      formData.append("companyId", company!.id);
      formData.append("minecraftTag", minecraftTag.trim());
      formData.append("formData", JSON.stringify({ motivation: motivation.trim() }));
      if (skillImageFile) formData.append("skillImage", skillImageFile);
      const res = await fetch("/api/es-apply", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送信に失敗しました");
      setSent(true);
      setDmSent(data.dmSent === true ? true : data.dmSent === false ? false : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (!companyId) {
    return (
      <div className="apply-login-required-wrap">
        <div className="apply-login-required-card">
          <p className="apply-login-required-title">会社が見つかりません</p>
          <p className="apply-login-required-text">URLが正しいか確認するか、会社一覧から再度お選びください。</p>
          <Link href="/es-system/companies" className="apply-login-required-btn">
            会社一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="apply-login-required-wrap">
        <p className="apply-login-required-text" style={{ marginBottom: 0 }}>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    const loginUrl = `/login?redirect=${encodeURIComponent(`/es-system/apply/${companyId}`)}`;
    return (
      <div className="apply-login-required-wrap">
        <div className="apply-login-required-card">
          <div className="apply-login-required-icon">🔐</div>
          <h1 className="apply-login-required-title">入社申請にはAOIRO IDでのログインが必要です</h1>
          <p className="apply-login-required-text">ログイン後、この応募画面に戻ります。</p>
          <Link href={loginUrl} className="apply-login-required-btn">
            ログインする
          </Link>
          <br />
          <Link href="/es-system/companies" className="apply-login-required-back">
            ← 会社一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="apply-login-required-wrap">
        <div className="apply-login-required-card">
          <p className="apply-login-required-title">会社が見つかりません</p>
          <p className="apply-login-required-text">URLを確認するか、会社一覧から再度お選びください。</p>
          <Link href="/es-system/companies" className="apply-login-required-btn">会社一覧へ戻る</Link>
        </div>
      </div>
    );
  }

  const creativePending = company.creativeRequired && (company.creativeStatus || "").toLowerCase() !== "approved";
  const maxReached = company.maxParticipants > 0 && (company.members?.length ?? 0) >= company.maxParticipants;
  if (creativePending) {
    return (
      <div className="apply-login-required-wrap">
        <div className="apply-login-required-card">
          <p className="apply-login-required-title">クリエイティブ申請審査中です</p>
          <p className="apply-login-required-text">
            {company.name} はクリエイティブ申請の審査中のため、現在は応募できません。運営の承認後に応募が可能になります。
          </p>
          <Link href="/es-system/companies" className="apply-login-required-btn">会社一覧へ戻る</Link>
        </div>
      </div>
    );
  }
  if (maxReached) {
    return (
      <div className="apply-login-required-wrap">
        <div className="apply-login-required-card">
          <p className="apply-login-required-title">参加可能人数の上限に達しています</p>
          <p className="apply-login-required-text">
            {company.name} は参加可能人数の上限に達したため、現在は応募できません。
          </p>
          <Link href="/es-system/companies" className="apply-login-required-btn">会社一覧へ戻る</Link>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="apply-success-wrap">
        <div className="apply-success-card">
          <div className="icon">✅</div>
          <h1 className="title">申請を送信しました</h1>
          <p className="text">
            {company.name} への入社申請を受け付けました。審査結果はしばらくお待ちください。
          </p>
          {dmSent === false && (
            <p className="text" style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-secondary)" }}>
              社長へのDiscord通知は送れていません。申請は管理者・社長が申請一覧から確認できます。
            </p>
          )}
          <Link href="/es-system/companies" className="btn-back">会社一覧へ戻る</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-form-wrap">
      <div className="back-link">
        <Link href="/es-system/companies">← 会社一覧へ戻る</Link>
      </div>
      <div className="detail-panel">
        <div className="detail-body">
          <h1 className="detail-title">{company.name} への入社申請</h1>
          <p className="section-sub">{company.location || "—"}</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Minecraftゲームタグ <span className="required">*</span></label>
              {mcidLoading ? (
                <p className="section-sub" style={{ margin: 0 }}>読み込み中...</p>
              ) : mcid ? (
                <input type="text" value={mcid} readOnly disabled className="form-input" style={{ backgroundColor: "var(--color-bg)", cursor: "not-allowed" }} />
              ) : (
                <div>
                  <p className="section-sub" style={{ marginBottom: 12 }}>MCID認証が完了していません。認証するとDiscord IDとMinecraft IDが連携され、ここに自動で表示されます。</p>
                  <Link href={`/minecraft-auth?redirect=${encodeURIComponent(`/es-system/apply/${companyId}`)}`} className="apply-login-required-btn" style={{ display: "inline-block" }}>
                    MCID認証をする
                  </Link>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">志望理由・意志表明 <span className="required">*</span></label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="入社の理由や意欲を記入してください"
                rows={4}
                className="form-textarea"
              />
            </div>

            {skillImageField && (
              <div className="form-group">
                <label className="form-label">
                  技術確認用画像（技術レベル確認用）
                  {skillImageRequired && <span className="required"> *</span>}
                </label>
                <p className="section-sub" style={{ marginBottom: 8, fontSize: 12 }}>
                  スキルや実績が分かる画像をアップロードしてください。画像は社長のDiscord DMに送られ、DBには保存されません。
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => setSkillImageFile(e.target.files?.[0] ?? null)}
                  className="form-input"
                  style={{ padding: 8 }}
                />
                {skillImageFile && (
                  <p className="section-sub" style={{ marginTop: 4, fontSize: 12 }}>
                    {skillImageFile.name}（{(skillImageFile.size / 1024).toFixed(1)} KB）
                  </p>
                )}
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={() => router.push("/es-system/companies")} className="btn-cancel">
                キャンセル
              </button>
              <button type="submit" disabled={submitting || !mcid || mcidLoading} className="btn-submit">
                {submitting ? "送信中..." : "申請を送信"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
