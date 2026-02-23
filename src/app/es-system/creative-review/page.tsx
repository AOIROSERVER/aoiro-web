"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type Company = {
  id: string;
  name: string;
  creativeRequired?: boolean;
  creativeStatus?: string;
};

export default function CreativeReviewPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!adminCheckDone || !isAdmin) return;
    setLoading(true);
    fetch("/api/es-companies")
      .then((r) => r.json())
      .then((list: Company[]) => {
        const pending = (Array.isArray(list) ? list : []).filter(
          (c) => c.creativeRequired && (c.creativeStatus || "").toLowerCase() === "pending"
        );
        setCompanies(pending);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [adminCheckDone, isAdmin]);

  const updateStatus = (companyId: string, status: "approved" | "rejected") => {
    if (!session?.access_token) return;
    setUpdatingId(companyId);
    fetch(`/api/es-companies/${companyId}/creative-status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      })
      .catch((e) => alert(e instanceof Error ? e.message : "更新に失敗しました"))
      .finally(() => setUpdatingId(null));
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
    <div className="companies-joblist" style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div className="back-link" style={{ paddingBottom: 16 }}>
        <Link href="/es-system/companies">← 会社一覧へ戻る</Link>
        <span style={{ marginLeft: 16 }}>
          <Link href="/es-system/company-admin">申請リスト・管理</Link>
        </span>
      </div>
      <h1 className="detail-title" style={{ marginBottom: 8 }}>クリエイティブ申請審査</h1>
      <p className="section-sub" style={{ marginBottom: 24 }}>
        管理者アカウントでログインしている場合のみ、許可・拒否ができます。
      </p>
      {loading ? (
        <p style={{ color: "var(--color-text-muted)" }}>読み込み中...</p>
      ) : companies.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>審査待ちのクリエイティブ申請はありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {companies.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 16,
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn-apply"
                  disabled={updatingId === c.id}
                  onClick={() => updateStatus(c.id, "approved")}
                  style={{ background: "#2e7d32", color: "#fff" }}
                >
                  {updatingId === c.id ? "処理中..." : "許可"}
                </button>
                <button
                  type="button"
                  disabled={updatingId === c.id}
                  onClick={() => updateStatus(c.id, "rejected")}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #c62828",
                    color: "#c62828",
                    background: "transparent",
                    borderRadius: 6,
                    cursor: updatingId === c.id ? "not-allowed" : "pointer",
                  }}
                >
                  拒否
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
