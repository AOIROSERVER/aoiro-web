"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type Application = {
  id: string;
  createdAt: string;
  companyId: string;
  companyName: string;
  email: string;
  discord: string;
  minecraftTag: string;
  formDataJson: string;
  status: string;
};

const DEFAULT_FORM_SCHEMA = {
  fields: [
    { id: "minecraft_tag", label: "Minecraftゲームタグ", type: "text", required: true },
    { id: "motivation", label: "志望理由・意志表明", type: "textarea", required: true },
  ],
};

export default function CompanyAdminPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [tab, setTab] = useState<"register" | "applications">("applications");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    employmentType: "正社員",
    tags: "",
    maxParticipants: "0",
    imageUrls: "",
    formSchemaJson: JSON.stringify(DEFAULT_FORM_SCHEMA, null, 2),
  });

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
        if (!data.isAdmin) router.push("/");
      })
      .catch(() => setAdminCheckDone(true));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!isAdmin || !session?.access_token) return;
    fetch("/api/es-companies")
      .then((r) => r.json())
      .then((list) => setCompanies(Array.isArray(list) ? list : []))
      .catch(() => setCompanies([]));
  }, [isAdmin, session]);

  const fetchApplications = () => {
    if (!session?.access_token) return;
    setLoadingApps(true);
    fetch("/api/es-companies/applications", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("取得に失敗しました");
        return r.json();
      })
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoadingApps(false));
  };

  useEffect(() => {
    if (isAdmin && tab === "applications") fetchApplications();
  }, [isAdmin, tab]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMessage("");
    if (!form.name.trim()) {
      setRegisterMessage("会社名を入力してください");
      return;
    }
    let formSchema: Record<string, unknown> = DEFAULT_FORM_SCHEMA;
    try {
      formSchema = JSON.parse(form.formSchemaJson || "{}");
    } catch {
      setRegisterMessage("フォームJSONの形式が正しくありません");
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/es-companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          location: form.location.trim() || undefined,
          employmentType: form.employmentType || "正社員",
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          maxParticipants: parseInt(form.maxParticipants, 10) || 0,
          imageUrls: form.imageUrls.split(",").map((s) => s.trim()).filter(Boolean),
          formSchema,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登録に失敗しました");
      setRegisterMessage("登録しました。ID: " + data.id);
      setForm((prev) => ({ ...prev, name: "", description: "", location: "" }));
      fetch("/api/es-companies").then((r) => r.json()).then((list) => setCompanies(Array.isArray(list) ? list : []));
    } catch (err) {
      setRegisterMessage(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setRegisterLoading(false);
    }
  };

  const updateStatus = async (applicationId: string, status: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/es-companies/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("更新に失敗しました");
      fetchApplications();
    } catch {
      alert("ステータスの更新に失敗しました");
    }
  };

  if (!adminCheckDone || authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <p className="text-[#718096]">読み込み中...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-[#1a56db] hover:underline text-sm mb-4 inline-block">
          ← 管理画面へ戻る
        </Link>
        <h1 className="text-2xl font-bold text-[#1a202c] mb-6">入社申請・カンパニー管理</h1>
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab("applications")}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === "applications" ? "bg-[#1a56db] text-white" : "bg-white border border-[#e2e8f0] text-[#4a5568]"
            }`}
          >
            申請リスト
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === "register" ? "bg-[#1a56db] text-white" : "bg-white border border-[#e2e8f0] text-[#4a5568]"
            }`}
          >
            会社を登録
          </button>
        </div>

        {tab === "register" && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1a202c] mb-4">会社を登録</h2>
            <p className="text-sm text-[#718096] mb-4">
              会社名・説明・勤務地・参加可能人数・フォーム（JSON）を紐づけて登録します。画像はSupabaseなどにアップロードしたURLをカンマ区切りで入力できます。
            </p>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">会社名 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg"
                  placeholder="例: 株式会社サンプル"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">説明</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg"
                  rows={3}
                  placeholder="会社の説明"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">勤務地</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg"
                  placeholder="例: 東京都 港区"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">雇用形態</label>
                <input
                  value={form.employmentType}
                  onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg"
                  placeholder="正社員"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">タグ（カンマ区切り）</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg"
                  placeholder="建築, リモート可"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">参加可能人数</label>
                <input
                  type="number"
                  value={form.maxParticipants}
                  onChange={(e) => setForm((p) => ({ ...p, maxParticipants: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">画像URL（カンマ区切り・Supabase等）</label>
                <input
                  value={form.imageUrls}
                  onChange={(e) => setForm((p) => ({ ...p, imageUrls: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a202c] mb-1">フォーム定義（JSON）</label>
                <textarea
                  value={form.formSchemaJson}
                  onChange={(e) => setForm((p) => ({ ...p, formSchemaJson: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg font-mono text-sm"
                  rows={10}
                  placeholder='{"fields":[{"id":"minecraft_tag","label":"Minecraftタグ","type":"text","required":true},...]}'
                />
              </div>
              {registerMessage && (
                <p className={registerMessage.startsWith("登録") ? "text-green-600" : "text-red-600"}>{registerMessage}</p>
              )}
              <button
                type="submit"
                disabled={registerLoading}
                className="px-6 py-2.5 bg-[#1a56db] text-white font-bold rounded-lg hover:bg-[#1447b3] disabled:opacity-60"
              >
                {registerLoading ? "登録中..." : "登録"}
              </button>
            </form>
          </div>
        )}

        {tab === "applications" && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
            <h2 className="text-lg font-bold text-[#1a202c] p-4 border-b border-[#e2e8f0]">申請リスト</h2>
            {loadingApps ? (
              <p className="p-6 text-[#718096]">読み込み中...</p>
            ) : applications.length === 0 ? (
              <p className="p-6 text-[#718096]">申請はまだありません。スプレッドシートに「CompanyApplications」シートがあるか確認してください。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f7fa] border-b border-[#e2e8f0]">
                      <th className="text-left p-3">日時</th>
                      <th className="text-left p-3">会社</th>
                      <th className="text-left p-3">Discord</th>
                      <th className="text-left p-3">MCID</th>
                      <th className="text-left p-3">ステータス</th>
                      <th className="text-left p-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a) => (
                      <tr key={a.id} className="border-b border-[#e2e8f0] hover:bg-[#f8faff]">
                        <td className="p-3">{a.createdAt}</td>
                        <td className="p-3">{a.companyName}</td>
                        <td className="p-3">{a.discord}</td>
                        <td className="p-3">{a.minecraftTag}</td>
                        <td className="p-3">
                          <span
                            className={
                              a.status === "approved" ? "text-green-600" : a.status === "rejected" ? "text-red-600" : "text-[#718096]"
                            }
                          >
                            {a.status === "approved" ? "許可" : a.status === "rejected" ? "拒否" : "未処理"}
                          </span>
                        </td>
                        <td className="p-3">
                          {a.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatus(a.id, "approved")}
                                className="mr-2 text-green-600 hover:underline font-medium"
                              >
                                許可
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(a.id, "rejected")}
                                className="text-red-600 hover:underline font-medium"
                              >
                                拒否
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
