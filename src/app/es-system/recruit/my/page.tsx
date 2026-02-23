"use client";

import React, { useState, useEffect } from "react";
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
  maxParticipants: number;
};

type Application = {
  id: string;
  createdAt: string;
  companyId: string;
  companyName: string;
  email: string;
  discord: string;
  discordId: string;
  minecraftTag: string;
  motivation: string;
  status: string;
  userId?: string;
};

export default function RecruitMyPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCompanyId, setFilterCompanyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [aicMainCompany, setAicMainCompany] = useState<string | null>(null);
  const [aicPartTimeCompanies, setAicPartTimeCompanies] = useState<string[]>([]);
  const [resigning, setResigning] = useState(false);

  useEffect(() => {
    if (!user || !session?.access_token) {
      setLoading(false);
      return;
    }
    const token = session.access_token;
    const headers = { Authorization: `Bearer ${token}` };
    fetch("/api/es-companies?mine=1", { headers, credentials: "include" })
      .then((r) => r.json())
      .then((list) => setCompanies(Array.isArray(list) ? list : []))
      .catch(() => setCompanies([]));
    fetch("/api/es-companies/applications", { headers, credentials: "include" })
      .then((r) => r.json())
      .then((list) => setApplications(Array.isArray(list) ? list : []))
      .catch(() => setApplications([]));
    fetch("/api/aic-company", { headers, credentials: "include" })
      .then((r) => r.json())
      .then((d: { mainCompanyName?: string | null; partTimeCompanyNames?: string[] }) => {
        setAicMainCompany(d.mainCompanyName ?? null);
        setAicPartTimeCompanies(Array.isArray(d.partTimeCompanyNames) ? d.partTimeCompanyNames : []);
      })
      .catch(() => {
        setAicMainCompany(null);
        setAicPartTimeCompanies([]);
      })
      .finally(() => setLoading(false));
  }, [user, session?.access_token]);

  const updateStatus = async (applicationId: string, status: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/es-companies/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      const list = await fetch("/api/es-companies/applications", { headers: { Authorization: `Bearer ${session.access_token}` }, credentials: "include" }).then((r) => r.json());
      setApplications(Array.isArray(list) ? list : []);
    } catch (e) {
      alert(e instanceof Error ? e.message : "ステータスの更新に失敗しました");
    }
  };

  const resign = async () => {
    if (!session?.access_token || !confirm("現在の所属（正社員・アルバイト）をすべて退職しますか？AICカードの表示も更新されます。")) return;
    setResigning(true);
    try {
      const res = await fetch("/api/aic-company/resign", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "退職に失敗しました");
      setAicMainCompany(null);
      setAicPartTimeCompanies([]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "退職に失敗しました");
    } finally {
      setResigning(false);
    }
  };

  const deleteCompany = async (companyId: string) => {
    if (!session?.access_token || !confirm("この募集を削除（非表示）にしますか？")) return;
    setDeletingId(companyId);
    try {
      const res = await fetch(`/api/es-companies/${companyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      setApplications((prev) => prev.filter((a) => a.companyId !== companyId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredApps = filterCompanyId ? applications.filter((a) => a.companyId === filterCompanyId) : applications;

  if (authLoading || (loading && companies.length === 0)) {
    return (
      <div className="apply-login-required-wrap">
        <p style={{ color: "var(--color-text-muted)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="apply-login-required-wrap">
        <div className="apply-login-required-card">
          <p className="apply-login-required-title">ログインが必要です</p>
          <Link href="/login" className="apply-login-required-btn">ログインする</Link>
          <br />
          <Link href="/es-system/companies" className="apply-login-required-back">← 会社一覧へ戻る</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="companies-joblist recruit-my-page" style={{ paddingBottom: 120 }}>
      <div className="back-link" style={{ paddingTop: 24, paddingBottom: 16 }}>
        <Link href="/es-system/companies">← 会社一覧へ戻る</Link>
        <span style={{ marginLeft: 16 }}>
          <Link href="/es-system/recruit/create">募集を作成</Link>
        </span>
      </div>

      <div className="main" style={{ flexDirection: "column", maxWidth: 900, margin: "0 auto" }}>
        <div className="detail-panel" style={{ position: "relative", maxHeight: "none" }}>
          <div className="detail-body">
            <h1 className="detail-title">過去の投稿一覧</h1>
            <p className="section-sub" style={{ marginBottom: 24 }}>
              自分が作成した募集と、その申請一覧です。申請の許可・拒否ができます。
            </p>

            <div className="detail-section-title">現在の所属</div>
            {aicMainCompany || aicPartTimeCompanies.length > 0 ? (
              <div className="info-item" style={{ marginBottom: 24 }}>
                {aicMainCompany && (
                  <p style={{ margin: "0 0 4px 0", fontSize: 15 }}>
                    <strong>正社員:</strong> {aicMainCompany}
                  </p>
                )}
                {aicPartTimeCompanies.length > 0 && (
                  <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "var(--color-text-secondary)" }}>
                    アルバイト中: {aicPartTimeCompanies.join("、")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={resign}
                  disabled={resigning}
                  style={{
                    fontSize: 13,
                    padding: "6px 14px",
                    color: "#c62828",
                    background: "none",
                    border: "1px solid #c62828",
                    borderRadius: 6,
                    cursor: resigning ? "not-allowed" : "pointer",
                  }}
                >
                  {resigning ? "処理中..." : "退職する"}
                </button>
              </div>
            ) : (
              <p className="section-sub" style={{ marginBottom: 24 }}>現在、所属している会社はありません。</p>
            )}

            <hr className="detail-divider" />

            {companies.length === 0 ? (
              <p className="apply-login-required-text">まだ募集を作成していません。<Link href="/es-system/recruit/create" className="apply-login-required-back">募集を作成</Link></p>
            ) : (
              <>
                <div className="detail-section-title">自分の募集</div>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
                  {companies.map((c) => (
                    <li key={c.id} style={{ marginBottom: 12 }}>
                      <div className="info-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <strong>{c.name}</strong>
                          <span style={{ marginLeft: 8, fontSize: 13, color: "var(--color-text-muted)" }}>{c.location || "—"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <Link href={`/es-system/recruit/edit/${c.id}`} className="recruit-create-btn" style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none" }}>
                            編集
                          </Link>
                          <button
                            type="button"
                            className="recruit-create-btn"
                            style={{ fontSize: 12, padding: "6px 12px" }}
                            onClick={() => setFilterCompanyId(filterCompanyId === c.id ? null : c.id)}
                          >
                            {filterCompanyId === c.id ? "すべて表示" : "この募集の申請のみ"}
                          </button>
                          <button
                            type="button"
                            style={{ fontSize: 12, padding: "6px 12px", color: "#c62828", background: "none", border: "1px solid #c62828", borderRadius: 4, cursor: "pointer" }}
                            onClick={() => deleteCompany(c.id)}
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id ? "削除中..." : "削除"}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <hr className="detail-divider" />
                <div className="detail-section-title">申請一覧</div>
                {filteredApps.length === 0 ? (
                  <p className="apply-login-required-text">申請はまだありません。</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="info-item" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <th style={{ textAlign: "left", padding: 8 }}>日時</th>
                          <th style={{ textAlign: "left", padding: 8 }}>募集</th>
                          <th style={{ textAlign: "left", padding: 8 }}>Discord</th>
                          <th style={{ textAlign: "left", padding: 8 }}>Discord ID</th>
                          <th style={{ textAlign: "left", padding: 8 }}>MCID</th>
                          <th style={{ textAlign: "left", padding: 8 }}>志望理由</th>
                          <th style={{ textAlign: "left", padding: 8 }}>ステータス</th>
                          <th style={{ textAlign: "left", padding: 8 }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApps.map((a) => (
                          <tr key={a.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <td style={{ padding: 8, fontSize: 14 }}>{a.createdAt}</td>
                            <td style={{ padding: 8, fontSize: 14 }}>{a.companyName}</td>
                            <td style={{ padding: 8, fontSize: 14 }}>{a.discord}</td>
                            <td style={{ padding: 8, fontSize: 14 }}>{a.discordId || "—"}</td>
                            <td style={{ padding: 8, fontSize: 14 }}>{a.minecraftTag}</td>
                            <td style={{ padding: 8, fontSize: 14, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }} title={a.motivation}>{a.motivation || "—"}</td>
                            <td style={{ padding: 8, fontSize: 14 }}>
                              <span style={{ color: a.status === "approved" ? "#1e7e45" : a.status === "rejected" ? "#c62828" : "var(--color-text-muted)" }}>
                                {a.status === "approved" ? "許可" : a.status === "rejected" ? "拒否" : "未処理"}
                              </span>
                            </td>
                            <td style={{ padding: 8 }}>
                              {a.status === "pending" && (
                                <>
                                  <button type="button" style={{ marginRight: 8, color: "#1e7e45", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }} onClick={() => updateStatus(a.id, "approved")}>許可</button>
                                  <button type="button" style={{ color: "#c62828", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }} onClick={() => updateStatus(a.id, "rejected")}>拒否</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
