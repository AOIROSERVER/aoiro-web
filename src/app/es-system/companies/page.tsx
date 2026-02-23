"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import "./joblist.css";

type Company = {
  id: string;
  name: string;
  description: string;
  location: string;
  employmentType: string;
  tags: string[];
  formSchema: Record<string, unknown> | null;
  maxParticipants: number;
  imageUrls: string[];
  createdAt: string;
  active: boolean;
  createdByDiscordId?: string;
  createdByDiscordUsername?: string;
  members?: { discordId: string; discordUsername: string }[];
  hourlyWage?: string;
  monthlySalary?: string;
};

type DiscordUser = { avatarUrl: string; displayName: string };

/** 時給表示用: 数字なら「〇〇円」、それ以外はそのまま */
function formatHourlyWage(s: string | undefined): string {
  if (s == null || s === "") return "—";
  const n = parseInt(String(s).replace(/[^0-9]/g, ""), 10);
  if (!isNaN(n)) return `${n.toLocaleString()}円`;
  return s;
}

/** 月給表示用: 数字なら 1万以上は「〇〇万円」、1万未満は「〇〇円」。100000 → 10万円 */
function formatMonthlySalary(s: string | undefined): string {
  if (s == null || s === "") return "—";
  const str = String(s).replace(/[^0-9.eE+-]/g, "");
  const num = parseFloat(str);
  if (isNaN(num) || num < 0) return s;
  const n = Math.round(num);
  if (n >= 10000) return `${(n / 10000).toLocaleString()}万円`;
  if (n > 0) return `${n.toLocaleString()}円`;
  return s;
}

export default function CompaniesPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const avatarUrl = user?.user_metadata?.picture ?? user?.user_metadata?.avatar_url ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [discordUsers, setDiscordUsers] = useState<Record<string, DiscordUser>>({});
  const [showMembersModal, setShowMembersModal] = useState(false);
  /** カードに表示するメンバー数（幅に応じて1〜3） */
  const [visibleMemberCount, setVisibleMemberCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [filterChip, setFilterChip] = useState("all");
  /** 正社員募集 | アルバイト・プロジェクト募集 */
  const [recruitmentTab, setRecruitmentTab] = useState<"正社員" | "アルバイト">("正社員");

  useEffect(() => {
    fetch("/api/es-companies")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter((c) => {
    const matchTab = recruitmentTab === "正社員" ? c.employmentType === "正社員" : c.employmentType !== "正社員";
    const kw = keyword.toLowerCase();
    const loc = locationFilter.toLowerCase();
    const matchKw = !kw || c.name.toLowerCase().includes(kw) || (c.description || "").toLowerCase().includes(kw) || c.tags.some((t) => t.toLowerCase().includes(kw));
    const matchLoc = !loc || (c.location || "").toLowerCase().includes(loc);
    const matchChip = filterChip === "all" || c.employmentType === filterChip;
    return matchTab && matchKw && matchLoc && matchChip;
  });

  const displayDetail = selectedId && filtered.find((c) => c.id === selectedId) ? filtered.find((c) => c.id === selectedId)! : filtered[0] || null;

  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.find((c) => c.id === selectedId))) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    const updateVisibleMembers = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1280;
      setVisibleMemberCount(w < 400 ? 1 : w < 600 ? 2 : 3);
    };
    updateVisibleMembers();
    window.addEventListener("resize", updateVisibleMembers);
    return () => window.removeEventListener("resize", updateVisibleMembers);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetailCompany(null);
      setDiscordUsers({});
      setShowMembersModal(false);
      return;
    }
    setDetailLoading(true);
    setDetailCompany(null);
    setDiscordUsers({});
    setShowMembersModal(false);
    fetch(`/api/es-companies/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDetailCompany(data);
        const ids = new Set<string>();
        if (data.createdByDiscordId) ids.add(data.createdByDiscordId);
        (data.members || []).forEach((m: { discordId: string }) => m.discordId && ids.add(m.discordId));
        if (ids.size === 0) return;
        Promise.all(
          Array.from(ids).map((id) =>
            fetch(`/api/discord-user/${id}`)
              .then((res) => res.json())
              .then((u) => ({ id, ...u }))
              .catch(() => ({ id, avatarUrl: null, username: null, globalName: null }))
          )
        ).then((results) => {
          const next: Record<string, DiscordUser> = {};
          results.forEach((r) => {
            const displayName = r.globalName || r.username || "";
            next[r.id] = {
              avatarUrl: r.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png",
              displayName: displayName || "—",
            };
          });
          setDiscordUsers((prev) => ({ ...prev, ...next }));
        });
      })
      .catch(() => setDetailCompany(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const handleShare = async () => {
    if (!displayDetail) return;
    const url = typeof window !== "undefined" ? `${window.location.origin}/es-system/apply/${displayDetail.id}` : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: displayDetail.name,
          text: `${displayDetail.name} への応募`,
          url,
        });
      } else {
        await navigator.clipboard?.writeText(url);
        alert("リンクをコピーしました");
      }
    } catch (e) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        alert("リンクをコピーしました");
      }
    }
  };

  if (loading && companies.length === 0) {
    return (
      <div className="companies-joblist" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
        <div className="companies-loading-spinner" aria-hidden />
        <p style={{ color: "var(--color-text-muted)" }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="companies-joblist">
      <div className="search-bar-wrapper">
        <div className="search-bar-wrapper-inner">
          <div className="search-bar">
            <div className="search-field">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="職種、キーワード、会社名"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="search-field">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                placeholder="都道府県、市区町村、郵便番号"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <button type="button" className="search-btn" onClick={() => {}}>
              検索
            </button>
          </div>
          {user && (
            <>
              <Link href="/es-system/recruit/create" className="recruit-create-btn">
                <span aria-hidden>➕</span>
                募集作成
              </Link>
              <Link href="/es-system/recruit/my" className="recruit-create-btn" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" width={20} height={20} style={{ borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <span aria-hidden>👤</span>
                )}
                過去の投稿一覧
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="recruitment-tabs" style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid var(--color-border)", paddingLeft: 0 }}>
        <button
          type="button"
          onClick={() => setRecruitmentTab("正社員")}
          className={recruitmentTab === "正社員" ? "recruitment-tab active" : "recruitment-tab"}
          style={{
            padding: "12px 20px",
            border: "none",
            background: recruitmentTab === "正社員" ? "var(--color-surface)" : "transparent",
            color: recruitmentTab === "正社員" ? "var(--color-primary)" : "var(--color-text-secondary)",
            fontWeight: recruitmentTab === "正社員" ? 700 : 500,
            borderBottom: recruitmentTab === "正社員" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: "-2px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 15,
          }}
        >
          正社員募集
        </button>
        <button
          type="button"
          onClick={() => setRecruitmentTab("アルバイト")}
          className={recruitmentTab === "アルバイト" ? "recruitment-tab active" : "recruitment-tab"}
          style={{
            padding: "12px 20px",
            border: "none",
            background: recruitmentTab === "アルバイト" ? "var(--color-surface)" : "transparent",
            color: recruitmentTab === "アルバイト" ? "var(--color-primary)" : "var(--color-text-secondary)",
            fontWeight: recruitmentTab === "アルバイト" ? 700 : 500,
            borderBottom: recruitmentTab === "アルバイト" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: "-2px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 15,
          }}
        >
          アルバイト・プロジェクト募集
        </button>
      </div>

      <div className="main">
        <div className="sidebar">
          <h2 className="section-title">会社一覧</h2>
          <p className="section-sub" id="result-label">
            {loading ? "読み込み中..." : `${filtered.length} 件の会社`}
          </p>

          <div className="filter-chips">
            <div className={`chip ${filterChip === "all" ? "active" : ""}`} onClick={() => setFilterChip("all")}>
              すべて
            </div>
            <div className={`chip ${filterChip === "正社員" ? "active" : ""}`} onClick={() => setFilterChip("正社員")}>
              正社員
            </div>
            <div className={`chip ${filterChip === "契約社員" ? "active" : ""}`} onClick={() => setFilterChip("契約社員")}>
              契約社員
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 200 }}>
              <div className="icon">🏢</div>
              <p>条件に一致する会社がありません</p>
            </div>
          ) : (
            <div className="job-list">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  className={`job-card ${displayDetail?.id === c.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(c.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedId(c.id)}
                >
                  <div className="job-card-header">
                    <div style={{ flex: 1 }}>
                      <div className="job-title">{c.name}</div>
                    </div>
                    <button type="button" className="more-btn" onClick={(e) => e.stopPropagation()}>
                      ···
                    </button>
                  </div>
                  <div className="job-company">{c.location || "—"}</div>
                  <div className="job-location">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {c.employmentType}
                  </div>
                  <div className="tags">
                    <span className="tag">{c.employmentType}</span>
                    {c.tags.slice(0, 2).map((t) => (
                      <span key={t} className={/リモート|remote/i.test(t) ? "tag orange" : "tag"}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-wrap" style={{ flex: 1, minWidth: 0 }}>
          {!displayDetail ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p>会社を選択すると詳細が表示されます</p>
            </div>
          ) : detailLoading ? (
            <div className="detail-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
              <div className="companies-loading-spinner" aria-hidden />
            </div>
          ) : !detailCompany ? (
            <div className="empty-state">
              <p>詳細を読み込めませんでした</p>
            </div>
          ) : (
            <div className="detail-panel">
              <div className="detail-hero">
                {detailCompany.imageUrls[0] ? (
                  <img src={detailCompany.imageUrls[0]} alt="" />
                ) : (
                  <div className="detail-hero-placeholder">🏢</div>
                )}
              </div>
              <div className="detail-body">
                <div className="detail-title">{detailCompany.name}</div>
                <div className="detail-company">{detailCompany.name}</div>
                <div className="detail-location-row">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {detailCompany.location || "—"}
                </div>
                <div className="detail-salary">
                  {detailCompany.employmentType}
                  {detailCompany.maxParticipants > 0 ? ` ・ 参加可能人数: ${detailCompany.maxParticipants}名` : ""}
                </div>
                {(detailCompany.createdByDiscordUsername || detailCompany.createdByDiscordId) && (
                  <div className="detail-owner-row">
                    <img
                      src={
                        detailCompany.createdByDiscordId && discordUsers[detailCompany.createdByDiscordId]
                          ? discordUsers[detailCompany.createdByDiscordId].avatarUrl
                          : "https://cdn.discordapp.com/embed/avatars/0.png"
                      }
                      alt=""
                      className="detail-owner-avatar"
                    />
                    <span className="detail-owner-name">
                      {detailCompany.createdByDiscordId && discordUsers[detailCompany.createdByDiscordId]
                        ? discordUsers[detailCompany.createdByDiscordId].displayName
                        : detailCompany.createdByDiscordUsername || "社長"}
                    </span>
                  </div>
                )}

                <div className="detail-actions">
                  <button
                    type="button"
                    className="btn-apply"
                    onClick={() => router.push(`/es-system/apply/${detailCompany.id}`)}
                  >
                    応募画面に進む
                  </button>
                  <button type="button" className="btn-icon btn-share" title="リンクを共有" onClick={handleShare}>
                    ↗
                  </button>
                </div>

                {(detailCompany.members?.length ?? 0) > 0 && (
                  <>
                    <hr className="detail-divider" />
                    <div className="detail-section-title">👥 メンバー一覧</div>
                    <div className="detail-members-list">
                      {detailCompany.members!.slice(0, visibleMemberCount).map((m, i) => (
                        <div key={m.discordId || m.discordUsername || `m-${i}`} className="detail-member-row">
                          <img
                            src={
                              m.discordId && discordUsers[m.discordId]
                                ? discordUsers[m.discordId].avatarUrl
                                : "https://cdn.discordapp.com/embed/avatars/0.png"
                            }
                            alt=""
                            className="detail-member-avatar"
                          />
                          <span className="detail-member-name">
                            {m.discordId && discordUsers[m.discordId]
                              ? discordUsers[m.discordId].displayName
                              : m.discordUsername || "—"}
                          </span>
                        </div>
                      ))}
                      {detailCompany.members!.length >= 1 && (
                        <button
                          type="button"
                          className="detail-members-more"
                          onClick={() => setShowMembersModal(true)}
                          title="メンバー全員を表示"
                        >
                          ›
                        </button>
                      )}
                    </div>
                    {showMembersModal && detailCompany.members && detailCompany.members.length > 0 && (
                      <div className="detail-members-overlay" onClick={() => setShowMembersModal(false)}>
                        <div className="detail-members-modal" onClick={(e) => e.stopPropagation()}>
                          <div className="detail-members-modal-header">
                            <h3>👥 メンバー一覧</h3>
                            <button type="button" className="detail-members-modal-close" onClick={() => setShowMembersModal(false)} aria-label="閉じる">
                              ×
                            </button>
                          </div>
                          <div className="detail-members-modal-body">
                            {detailCompany.members.map((m, i) => (
                              <div key={m.discordId || m.discordUsername || `m-${i}`} className="detail-member-row">
                                <img
                                  src={
                                    m.discordId && discordUsers[m.discordId]
                                      ? discordUsers[m.discordId].avatarUrl
                                      : "https://cdn.discordapp.com/embed/avatars/0.png"
                                  }
                                  alt=""
                                  className="detail-member-avatar"
                                />
                                <span className="detail-member-name">
                                  {m.discordId && discordUsers[m.discordId]
                                    ? discordUsers[m.discordId].displayName
                                    : m.discordUsername || "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <hr className="detail-divider" />

                <div className="detail-section-title">📋 勤務情報</div>
                <div className="detail-info-grid">
                  <div className="info-item">
                    <div className="info-item-label">雇用形態</div>
                    <div className="info-item-value">{detailCompany.employmentType}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">時給</div>
                    <div className="info-item-value">{formatHourlyWage(detailCompany.hourlyWage)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">月給</div>
                    <div className="info-item-value">{formatMonthlySalary(detailCompany.monthlySalary)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">参加可能人数</div>
                    <div className="info-item-value">{detailCompany.maxParticipants || "—"}名</div>
                  </div>
                </div>

                <hr className="detail-divider" />

                <div className="detail-section-title">📝 会社説明</div>
                <div
                  className="detail-description"
                  dangerouslySetInnerHTML={{
                    __html: detailCompany.description
                      ? detailCompany.description.replace(/\n/g, "<br/>")
                      : "説明はありません。",
                  }}
                />

                {detailCompany.tags.length > 0 && (
                  <>
                    <hr className="detail-divider" />
                    <div className="detail-section-title">✅ タグ</div>
                    <div className="detail-tags">
                      {detailCompany.tags.map((t) => (
                        <span key={t} className="detail-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
