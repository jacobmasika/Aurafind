"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, Trash2, LoaderCircle } from "lucide-react";
import { MissingReport } from "@/types/domain";

function isBrowser() {
  return typeof window !== "undefined";
}

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAccess = useMemo(() => {
    if (!isBrowser()) {
      return false;
    }

    const stored = window.localStorage.getItem("aurafind-admin-password");
    return Boolean(stored && stored.trim());
  }, []);

  useEffect(() => {
    const stored = isBrowser() ? window.localStorage.getItem("aurafind-admin-password") : "";
    if (stored) {
      setPassword(stored);
    }
  }, []);

  async function loadReports() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/reports", {
        headers: {
          "x-admin-password": password,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load reports.");
      }

      setReports(payload.items || []);
      setMessage(`Loaded ${payload.items?.length || 0} report(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteReport(reportId: string) {
    if (!window.confirm("Delete this reported case permanently?")) {
      return;
    }

    setBusyId(reportId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/reports?id=${encodeURIComponent(reportId)}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": password,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete report.");
      }

      setReports((current) => current.filter((item) => item.id !== reportId));
      setMessage("Report deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete report.");
    } finally {
      setBusyId(null);
    }
  }

  const persistPassword = () => {
    if (isBrowser()) {
      window.localStorage.setItem("aurafind-admin-password", password.trim());
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_40%),linear-gradient(135deg,_#f8fffe,_#eef8ff)] px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-cyan-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300">
                <ShieldCheck className="h-4 w-4" /> Admin console
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">Remove reported cases</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Use this page to review submitted missing-person cases and remove them when a report is resolved or should be withdrawn.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/70">
              <p className="font-medium">Access key</p>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Admin password"
                className="mt-2 w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={() => {
                  persistPassword();
                  void loadReports();
                }}
                className="mt-3 w-full rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Load reports
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
            {message}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-cyan-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Pending reports</h2>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No reports are currently available. If you expected cases, check the admin password and try loading again.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article key={report.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {report.person.fullName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Reported by {report.reporterName} • {report.lastKnownLocationName || "Unknown location"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                        Created {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteReport(report.id)}
                      disabled={busyId === report.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                    >
                      {busyId === report.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
