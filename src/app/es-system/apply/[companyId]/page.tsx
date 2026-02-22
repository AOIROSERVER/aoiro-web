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
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-[#718096]">読み込み中...</div>
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
      <div className="min-h-screen bg-[#f5f7fa] flex flex-col items-center justify-center p-4">
        <p className="text-[#4a5568] mb-4">会社が見つかりません。</p>
        <Link href="/es-system/companies" className="text-[#1a56db] hover:underline">
          ← 会社一覧へ戻る
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-[#1a202c] mb-2">申請を送信しました</h1>
          <p className="text-[#4a5568] mb-6">
            {company.name} への入社申請を受け付けました。審査結果はしばらくお待ちください。
          </p>
          <Link
            href="/es-system/companies"
            className="inline-block px-6 py-3 bg-[#1a56db] text-white font-bold rounded-lg hover:bg-[#1447b3]"
          >
            会社一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/es-system/companies" className="inline-flex items-center gap-1 text-[#1a56db] hover:underline text-sm mb-4">
          ← 会社一覧へ戻る
        </Link>
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-[#e8f0fe] to-[#c7d9fa] flex items-center justify-center">
            <span className="text-4xl">🏢</span>
          </div>
          <div className="p-6">
            <h1 className="text-xl font-bold text-[#1a202c] mb-1">{company.name} への入社申請</h1>
            <p className="text-sm text-[#718096] mb-6">{company.location || "—"}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              {fields.map((f) => (
                <div key={f.id}>
                  <label className="block text-sm font-semibold text-[#1a202c] mb-1">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      value={formValues[f.id] ?? ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={4}
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:ring-2 focus:ring-[#1a56db] focus:border-[#1a56db] outline-none"
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                      value={formValues[f.id] ?? ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:ring-2 focus:ring-[#1a56db] focus:border-[#1a56db] outline-none"
                    />
                  )}
                </div>
              ))}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/es-system/companies")}
                  className="px-5 py-2.5 border border-[#e2e8f0] rounded-lg font-semibold text-[#4a5568] hover:bg-[#f5f7fa]"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#1a56db] text-white font-bold rounded-lg hover:bg-[#1447b3] disabled:opacity-60"
                >
                  {submitting ? "送信中..." : "申請を送信"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
