"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Trash2, LoaderCircle } from "lucide-react";
import { MissingReport } from "@/types/domain";
import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from "@/lib/adminAuth";

function isBrowser() {
  return typeof window !== "undefined";
}

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    if (window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      void loadReports();
    }
  }, [authenticated]);

  async function loadReports() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/reports", {
        headers: {
          "x-admin-password": ADMIN_PASSWORD,
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
          "x-admin-password": ADMIN_PASSWORD,
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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthenticating(true);
    setError(null);
    setMessage(null);

    try {
      if (password.trim() !== ADMIN_PASSWORD) {
        throw new Error("Invalid admin password.");
      }

      if (isBrowser()) {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      }

      setAuthenticated(true);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setAuthenticating(false);
    }
  }

  function handleLogout() {
    if (isBrowser()) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    setAuthenticated(false);
    setReports([]);
    setPassword("");
    setMessage(null);
    setError(null);
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_40%),linear-gradient(135deg,_#f8fffe,_#eef8ff)] px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-cyan-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4" /> Admin login
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Access the admin console</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Sign in to review and remove reported missing-person cases.
            </p>

            <form onSubmit={handleLogin} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="admin-password">
                Admin password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="submit"
                disabled={authenticating}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {authenticating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Sign in
              </button>
            </form>
          </section>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>
      </main>
    );
  }

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
              <p className="font-medium">Signed in</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">Authenticated for this session.</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <span>Use the control below to refresh the report list.</span>
            <button
              type="button"
              onClick={() => void loadReports()}
              className="rounded-xl bg-teal-600 px-3 py-2 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Load reports"}
            </button>
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
