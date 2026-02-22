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
};

export default function CompaniesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [filterChip, setFilterChip] = useState("all");

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
    const kw = keyword.toLowerCase();
    const loc = locationFilter.toLowerCase();
    const matchKw = !kw || c.name.toLowerCase().includes(kw) || (c.description || "").toLowerCase().includes(kw) || c.tags.some((t) => t.toLowerCase().includes(kw));
    const matchLoc = !loc || (c.location || "").toLowerCase().includes(loc);
    const matchChip = filterChip === "all" || c.employmentType === filterChip || (filterChip === "remote" && c.tags.some((t) => /リモート|remote/i.test(t)));
    return matchKw && matchLoc && matchChip;
  });

  const displayDetail = selectedId && filtered.find((c) => c.id === selectedId) ? filtered.find((c) => c.id === selectedId)! : filtered[0] || null;

  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.find((c) => c.id === selectedId))) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  if (loading && companies.length === 0) {
    return (
      <div className="companies-joblist" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
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
          {isAdmin && (
            <Link href="/es-system/recruit/create" className="recruit-create-btn">
              <span aria-hidden>➕</span>
              募集作成
            </Link>
          )}
        </div>
      </div>

      <div className="back-link">
        <Link href="/more">← もっとへ戻る</Link>
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
            <div className={`chip ${filterChip === "remote" ? "active" : ""}`} onClick={() => setFilterChip("remote")}>
              リモート可
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

        <div style={{ flex: 1, minWidth: 0 }}>
          {!displayDetail ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p>会社を選択すると詳細が表示されます</p>
            </div>
          ) : (
            <div className="detail-panel">
              <div className="detail-hero">
                {displayDetail.imageUrls[0] ? (
                  <img src={displayDetail.imageUrls[0]} alt="" />
                ) : (
                  <div className="detail-hero-placeholder">🏢</div>
                )}
              </div>
              <div className="detail-body">
                <div className="detail-title">{displayDetail.name}</div>
                <div className="detail-company">{displayDetail.name}</div>
                <div className="detail-location-row">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {displayDetail.location || "—"}
                </div>
                <div className="detail-salary">
                  {displayDetail.employmentType}
                  {displayDetail.maxParticipants > 0 ? ` ・ 参加可能人数: ${displayDetail.maxParticipants}名` : ""}
                </div>

                <div className="detail-actions">
                  <button
                    type="button"
                    className="btn-apply"
                    onClick={() => router.push(`/es-system/apply/${displayDetail.id}`)}
                  >
                    応募画面に進む
                  </button>
                  <div className="btn-icon" title="保存">
                    🔖
                  </div>
                  <div className="btn-icon" title="シェア">
                    ↗
                  </div>
                </div>

                <hr className="detail-divider" />

                <div className="detail-section-title">📋 勤務情報</div>
                <div className="detail-info-grid">
                  <div className="info-item">
                    <div className="info-item-label">雇用形態</div>
                    <div className="info-item-value">{displayDetail.employmentType}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-item-label">参加可能人数</div>
                    <div className="info-item-value">{displayDetail.maxParticipants || "—"}名</div>
                  </div>
                </div>

                <hr className="detail-divider" />

                <div className="detail-section-title">📝 会社説明</div>
                <div
                  className="detail-description"
                  dangerouslySetInnerHTML={{
                    __html: displayDetail.description
                      ? displayDetail.description.replace(/\n/g, "<br/>")
                      : "説明はありません。",
                  }}
                />

                {displayDetail.tags.length > 0 && (
                  <>
                    <hr className="detail-divider" />
                    <div className="detail-section-title">✅ タグ</div>
                    <div className="detail-tags">
                      {displayDetail.tags.map((t) => (
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
