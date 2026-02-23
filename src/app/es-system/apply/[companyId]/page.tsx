"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import "@/app/es-system/companies/joblist.css";

type Company = {
  id: string;
  name: string;
  description: string;
  location: string;
  employmentType: string;
  tags: string[];
  formSchema: { fields?: unknown[] } | null;
  maxParticipants: number;
  imageUrls: string[];
  createdAt: string;
  active: boolean;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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
    setSubmitting(true);
    try {
      const token = session?.access_token;
      const res = await fetch("/api/es-apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          companyId: company!.id,
          minecraftTag: minecraftTag.trim(),
          formData: { motivation: motivation.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "送信に失敗しました");
      setSent(true);
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

  if (sent) {
    return (
      <div className="apply-success-wrap">
        <div className="apply-success-card">
          <div className="icon">✅</div>
          <h1 className="title">申請を送信しました</h1>
          <p className="text">
            {company.name} への入社申請を受け付けました。審査結果はしばらくお待ちください。
          </p>
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
