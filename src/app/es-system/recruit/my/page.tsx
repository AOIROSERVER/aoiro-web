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
  const [resigningCompanyName, setResigningCompanyName] = useState<string | null>(null);
  const [discordUsers, setDiscordUsers] = useState<Record<string, { avatarUrl: string; displayName: string }>>({});
  const [detailApplication, setDetailApplication] = useState<Application | null>(null);

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
      .then((list) => {
        const apps = Array.isArray(list) ? list : [];
        setApplications(apps);
        const ids = new Set<string>();
        apps.forEach((a: Application) => a.discordId && ids.add(a.discordId));
        if (ids.size > 0) {
          Promise.all(
            Array.from(ids).map((id) =>
              fetch(`/api/discord-user/${id}`)
                .then((res) => res.json())
                .then((u) => ({ id, avatarUrl: u.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png", displayName: u.globalName || u.username || "—" }))
                .catch(() => ({ id, avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png", displayName: "—" }))
            )
          ).then((results) => {
            const next: Record<string, { avatarUrl: string; displayName: string }> = {};
            results.forEach((r) => { next[r.id] = { avatarUrl: r.avatarUrl, displayName: r.displayName }; });
            setDiscordUsers(next);
          });
        }
      })
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
      setDetailApplication(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "ステータスの更新に失敗しました");
    }
  };

  const resign = async (companyName?: string) => {
    if (!session?.access_token) return;
    const isSingle = typeof companyName === "string" && companyName.trim();
    const msg = isSingle
      ? `「${companyName}」から退職しますか？`
      : "現在の所属（正社員・アルバイト）をすべて退職しますか？AICカードの表示も更新されます。";
    if (!confirm(msg)) return;
    setResigning(true);
    if (isSingle) setResigningCompanyName(companyName!.trim());
    try {
      const res = await fetch("/api/aic-company/resign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: isSingle ? JSON.stringify({ companyName: companyName!.trim() }) : undefined,
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
      setResigningCompanyName(null);
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
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {aicMainCompany && (
                  <div className="info-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginRight: 8 }}>正社員</span>
                      <strong style={{ fontSize: 15 }}>{aicMainCompany}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => resign(aicMainCompany)}
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
                      {resigning && resigningCompanyName === aicMainCompany ? "処理中..." : "退職する"}
                    </button>
                  </div>
                )}
                {aicPartTimeCompanies.map((name) => (
                  <div key={name} className="info-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginRight: 8 }}>アルバイト</span>
                      <strong style={{ fontSize: 15 }}>{name}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => resign(name)}
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
                      {resigning && resigningCompanyName === name ? "処理中..." : "退職する"}
                    </button>
                  </div>
                ))}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredApps.map((a) => (
                      <div
                        key={a.id}
                        className="info-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <img
                            src={a.discordId && discordUsers[a.discordId] ? discordUsers[a.discordId].avatarUrl : "https://cdn.discordapp.com/embed/avatars/0.png"}
                            alt=""
                            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {a.discordId && discordUsers[a.discordId] ? discordUsers[a.discordId].displayName : a.discord || "—"}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{a.companyName}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="recruit-create-btn"
                          style={{ fontSize: 13, padding: "6px 14px", flexShrink: 0 }}
                          onClick={() => setDetailApplication(a)}
                        >
                          詳細
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {detailApplication && (
                  <div className="application-detail-overlay" onClick={() => setDetailApplication(null)}>
                    <div className="application-detail-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="application-detail-modal-header">
                        <h3>申請詳細</h3>
                        <button
                          type="button"
                          className="detail-members-modal-close"
                          onClick={() => setDetailApplication(null)}
                          aria-label="閉じる"
                        >
                          ×
                        </button>
                      </div>
                      <div className="application-detail-modal-body">
                        <table className="application-detail-table">
                          <tbody>
                            <tr>
                              <th>日時</th>
                              <td>{detailApplication.createdAt}</td>
                            </tr>
                            <tr>
                              <th>募集</th>
                              <td>{detailApplication.companyName}</td>
                            </tr>
                            <tr>
                              <th>Discord</th>
                              <td>{detailApplication.discord || "—"}</td>
                            </tr>
                            <tr>
                              <th>Discord ID</th>
                              <td>{detailApplication.discordId || "—"}</td>
                            </tr>
                            <tr>
                              <th>MCID</th>
                              <td>{detailApplication.minecraftTag || "—"}</td>
                            </tr>
                            <tr>
                              <th>志望理由</th>
                              <td style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{detailApplication.motivation || "—"}</td>
                            </tr>
                            <tr>
                              <th>ステータス</th>
                              <td>
                                <span style={{ color: detailApplication.status === "approved" ? "#1e7e45" : detailApplication.status === "rejected" ? "#c62828" : "var(--color-text-muted)", fontWeight: 600 }}>
                                  {detailApplication.status === "approved" ? "許可" : detailApplication.status === "rejected" ? "拒否" : "未処理"}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {detailApplication.status === "pending" && (
                        <div className="application-detail-modal-actions">
                          <button type="button" className="btn-approve" onClick={() => updateStatus(detailApplication.id, "approved")}>
                            許可
                          </button>
                          <button type="button" className="btn-reject" onClick={() => updateStatus(detailApplication.id, "rejected")}>
                            拒否
                          </button>
                        </div>
                      )}
                    </div>
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
