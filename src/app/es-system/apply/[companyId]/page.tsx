"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import "@/app/es-system/companies/joblist.css";

type FormField = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
};

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
};

const DEFAULT_FIELDS: FormField[] = [
  { id: "minecraft_tag", label: "Minecraftゲームタグ", type: "text", required: true, placeholder: "例: PlayerName" },
  { id: "motivation", label: "志望理由・意志表明", type: "textarea", required: true, placeholder: "入社の理由や意欲を記入してください" },
];

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const companyId = params?.companyId != null ? String(params.companyId) : null;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
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
      .then((data) => {
        setCompany(data);
        const fields = (data.formSchema?.fields || DEFAULT_FIELDS) as FormField[];
        const initial: Record<string, string> = {};
        fields.forEach((f) => {
          initial[f.id] = "";
        });
        setFormValues(initial);
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    if (!company || !user?.user_metadata) return;
    const tag = (user.user_metadata as Record<string, string>).game_tag;
    if (!tag || typeof tag !== "string") return;
    setFormValues((prev) => {
      const current = prev.minecraft_tag ?? prev["Minecraftゲームタグ"] ?? "";
      if (current.trim()) return prev;
      return { ...prev, minecraft_tag: tag, "Minecraftゲームタグ": tag };
    });
  }, [company, user]);

  const fields: FormField[] = company?.formSchema?.fields?.length
    ? (company.formSchema!.fields as FormField[])
    : DEFAULT_FIELDS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const missing = fields.filter((f) => f.required && !(formValues[f.id] || "").trim());
    if (missing.length > 0) {
      setError(`${missing.map((f) => f.label).join("、")}を入力してください。`);
      return;
    }
    const minecraftTag = formValues.minecraft_tag || formValues["Minecraftゲームタグ"] || "";
    if (!minecraftTag.trim()) {
      setError("Minecraftゲームタグを入力してください。");
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
          formData: formValues,
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
            {fields.map((f) => (
              <div key={f.id} className="form-group">
                <label className="form-label">
                  {f.label}
                  {f.required && <span className="required"> *</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    value={formValues[f.id] ?? ""}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                    placeholder={f.placeholder}
                    rows={4}
                    className="form-textarea"
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                    value={formValues[f.id] ?? ""}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="form-input"
                  />
                )}
              </div>
            ))}
            <div className="form-actions">
              <button type="button" onClick={() => router.push("/es-system/companies")} className="btn-cancel">
                キャンセル
              </button>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? "送信中..." : "申請を送信"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
