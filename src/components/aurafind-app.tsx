"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { parse as parseExif } from "exifr";
import jsPDF from "jspdf";
import Image from "next/image";
import Link from "next/link";
import {
  BellRing,
  Bot,
  Compass,
  Fingerprint,
  Globe,
  LoaderCircle,
  MapPin,
  Mic,
  Moon,
  Search,
  Send,
  X,
  Sun,
  Trees,
  UserRoundSearch,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { clsx } from "clsx";
import { MatchResult, MissingReport } from "@/types/domain";

type Section = "report" | "sighting" | "found" | "discover" | "intel";

type ReportDraft = {
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  fullName: string;
  age: string;
  heightCm: string;
  eyeColor: string;
  hairColor: string;
  distinguishingMarks: string;
  clothingDescription: string;
  languages: string;
  lastSeenAt: string;
  lastLocation: string;
  voiceTranscript: string;
};

const initialDraft: ReportDraft = {
  reporterName: "",
  reporterEmail: "",
  reporterPhone: "",
  fullName: "",
  age: "",
  heightCm: "",
  eyeColor: "",
  hairColor: "",
  distinguishingMarks: "",
  clothingDescription: "",
  languages: "",
  lastSeenAt: "",
  lastLocation: "",
  voiceTranscript: "",
};

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callApi<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } finally {
    window.clearTimeout(timeout);
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, payload, getApiErrorMessage(payload));
  }

  return payload as T;
}

function Card({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-white/35 bg-white/70 p-6 shadow-xl shadow-cyan-900/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/65",
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-3 text-slate-900 dark:text-cyan-50">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300">
          {icon}
        </span>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean; errorMessage?: string }) {
  const { error, errorMessage, ...inputProps } = props;
  return (
    <div>
      <input
        {...inputProps}
        className={clsx(
          "w-full rounded-xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none ring-teal-500 transition focus:ring-2 dark:bg-slate-900/90 dark:text-slate-100",
          error ? "border-red-500 dark:border-red-500" : "border-slate-300/80 dark:border-slate-700",
          props.className,
        )}
      />
      {error && errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
}

function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean; errorMessage?: string }) {
  const { error, errorMessage, ...textareaProps } = props;
  return (
    <div>
      <textarea
        {...textareaProps}
        className={clsx(
          "w-full rounded-xl border bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none ring-teal-500 transition focus:ring-2 dark:bg-slate-900/90 dark:text-slate-100",
          error ? "border-red-500 dark:border-red-500" : "border-slate-300/80 dark:border-slate-700",
          props.className,
        )}
      />
      {error && errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
}

class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown, message: string) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function getApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "Request failed";
  }

  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Request failed";
}

function getApiFieldErrors(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {} as Record<string, string>;
  }

  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") {
    return {} as Record<string, string>;
  }

  const fieldErrors = (error as { fieldErrors?: unknown }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return {} as Record<string, string>;
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fieldErrors as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) {
      result[key] = value;
      continue;
    }

    if (Array.isArray(value) && value[0] && typeof value[0] === "string") {
      result[key] = value[0];
    }
  }

  return result;
}

export function AuraFindApp() {
  const { resolvedTheme, setTheme } = useTheme();
  const [section, setSection] = useState<Section>("report");
  const [lowBandwidth, setLowBandwidth] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("aurafind-low-bandwidth") === "true";
  });

  const [reportDraft, setReportDraft] = useState<ReportDraft>(() => {
    if (typeof window === "undefined") {
      return initialDraft;
    }

    const stored = window.localStorage.getItem("aurafind-report-draft");
    if (!stored) {
      return initialDraft;
    }

    try {
      return { ...initialDraft, ...(JSON.parse(stored) as ReportDraft) };
    } catch {
      return initialDraft;
    }
  });
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [reportExif, setReportExif] = useState<Record<string, unknown> | undefined>(undefined);
  const [reportPhotoInputKey, setReportPhotoInputKey] = useState(0);

  const [sightingNotes, setSightingNotes] = useState("");
  const [sightingSeenAt, setSightingSeenAt] = useState("");
  const [sightingLat, setSightingLat] = useState("");
  const [sightingLng, setSightingLng] = useState("");
  const [sightingCountry, setSightingCountry] = useState("");
  const [sightingPhotos, setSightingPhotos] = useState<string[]>([]);

  const [foundOrg, setFoundOrg] = useState("");
  const [foundContact, setFoundContact] = useState("");
  const [foundNotes, setFoundNotes] = useState("");
  const [foundLat, setFoundLat] = useState("");
  const [foundLng, setFoundLng] = useState("");
  const [foundAge, setFoundAge] = useState("");

  const [discoverAuthor, setDiscoverAuthor] = useState("");
  const [discoverStory, setDiscoverStory] = useState("");
  const [discoverLocationHint, setDiscoverLocationHint] = useState("");

  const [reports, setReports] = useState<MissingReport[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [latestReportId, setLatestReportId] = useState<string>("");

  const [statusMessage, setStatusMessage] = useState<string>("Ready to help.");
  const [working, setWorking] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadDashboard = useCallback(async () => {
    try {
      setLoadingBoard(true);
      const reportData = await callApi<{ items: MissingReport[] }>("/api/reports");
      setReports(reportData.items);
      if (!latestReportId && reportData.items[0]) {
        setLatestReportId(reportData.items[0].id);
      }
    } catch {
      setStatusMessage("Connection timed out. Please refresh and try again.");
    } finally {
      setLoadingBoard(false);
    }
  }, [latestReportId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    localStorage.setItem("aurafind-report-draft", JSON.stringify(reportDraft));
  }, [reportDraft]);

  useEffect(() => {
    localStorage.setItem("aurafind-low-bandwidth", String(lowBandwidth));
    document.body.classList.toggle("low-bandwidth", lowBandwidth);
  }, [lowBandwidth]);

  async function handleReportPhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const list = Array.from(files);
    const encoded = await Promise.all(list.map((file) => toBase64(file)));
    setReportPhotos(encoded.slice(0, 6));
    setReportPhotoInputKey((value) => value + 1);

    if (list[0]) {
      const exif = await parseExif(list[0]).catch(() => undefined);
      if (exif && typeof exif === "object") {
        setReportExif(exif as Record<string, unknown>);
      }
    }
  }

  function removeReportPhoto(index: number) {
    setReportPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setReportExif(undefined);
    setReportPhotoInputKey((value) => value + 1);
  }

  async function handleSightingPhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const encoded = await Promise.all(Array.from(files).map((file) => toBase64(file)));
    setSightingPhotos(encoded.slice(0, 3));
  }

  async function fillGeolocation(setLat: (value: string) => void, setLng: (value: string) => void) {
    if (!navigator.geolocation) {
      setStatusMessage("This browser cannot get your location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
      },
      () => setStatusMessage("Location access was turned off. You can type the location yourself."),
    );
  }

  function startVoiceCapture() {
    const SpeechRecognition =
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ||
      window.SpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage("This browser does not support speech input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setReportDraft((prev) => ({ ...prev, voiceTranscript: transcript }));
      setStatusMessage("Voice note saved.");
    };

    recognition.onerror = () => {
      setStatusMessage("Voice note could not be saved. Please try again.");
    };

    recognition.start();
  }

  function validateReportForm(): boolean {
    const errors: Record<string, string> = {};

    // Check missing person name
    if (!reportDraft.fullName.trim()) {
      errors.fullName = "Missing person name is required.";
    }

    // Check reporter name
    if (!reportDraft.reporterName.trim()) {
      errors.reporterName = "Reporter name is required.";
    }

    // Check reporter email
    if (!reportDraft.reporterEmail.trim()) {
      errors.reporterEmail = "Reporter email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportDraft.reporterEmail)) {
      errors.reporterEmail = "Invalid email!";
    }

    // Check age if provided (must be a positive number)
    if (reportDraft.age && Number.isNaN(Number(reportDraft.age))) {
      errors.age = "Invalid age!";
    } else if (reportDraft.age && Number(reportDraft.age) <= 0) {
      errors.age = "Invalid age!";
    }

    // Check height if provided (must be a positive number)
    if (reportDraft.heightCm && Number.isNaN(Number(reportDraft.heightCm))) {
      errors.heightCm = "Invalid height!";
    } else if (reportDraft.heightCm && Number(reportDraft.heightCm) <= 0) {
      errors.heightCm = "Invalid height!";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submitReport() {
    setWorking(true);

    try {
      // Validate form before submission
      if (!validateReportForm()) {
        setStatusMessage("Please fix the errors above before sending.");
        setWorking(false);
        return;
      }
      const parsedAge = Number(reportDraft.age);
      const parsedHeight = Number(reportDraft.heightCm);

      const payload = {
        reporterName: reportDraft.reporterName,
        reporterEmail: reportDraft.reporterEmail,
        reporterPhone: reportDraft.reporterPhone || undefined,
        lastKnownLocationName: reportDraft.lastLocation || undefined,
        lastSeenAt: reportDraft.lastSeenAt || undefined,
        person: {
          fullName: reportDraft.fullName,
          age: reportDraft.age && Number.isFinite(parsedAge) ? parsedAge : undefined,
          heightCm: reportDraft.heightCm && Number.isFinite(parsedHeight) ? parsedHeight : undefined,
          eyeColor: reportDraft.eyeColor || undefined,
          hairColor: reportDraft.hairColor || undefined,
          distinguishingMarks: reportDraft.distinguishingMarks || undefined,
          clothingDescription: reportDraft.clothingDescription || undefined,
          languages: reportDraft.languages
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        },
        photos: reportPhotos,
        voiceTranscript: reportDraft.voiceTranscript || undefined,
        exif: reportExif,
      };

      const response = await callApi<{ item: MissingReport }>("/api/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLatestReportId(response.item.id);
      setStatusMessage("Report saved and ready to match.");
      setReportDraft(initialDraft);
      setReportPhotos([]);
      setReportExif(undefined);
      setReportPhotoInputKey((value) => value + 1);
      setFieldErrors({});
      await loadDashboard();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = getApiFieldErrors(error.payload);
        if (error.status === 400 && Object.keys(fieldErrors).length > 0) {
          setFieldErrors(fieldErrors);
        }

        setStatusMessage(error.message);
        return;
      }

      setStatusMessage("Could not save the report. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function submitSighting() {
    setWorking(true);

    try {
      await callApi<{ item: unknown }>("/api/sightings", {
        method: "POST",
        body: JSON.stringify({
          notes: sightingNotes,
          seenAt: sightingSeenAt,
          location: { lat: Number(sightingLat), lng: Number(sightingLng) },
          photos: sightingPhotos,
          country: sightingCountry || undefined,
        }),
      });

      setStatusMessage("Anonymous sighting saved and ready to check.");
      setSightingNotes("");
      setSightingSeenAt("");
      setSightingLat("");
      setSightingLng("");
      setSightingCountry("");
      setSightingPhotos([]);
    } catch {
      setStatusMessage("Could not save the sighting. Please complete all required fields.");
    } finally {
      setWorking(false);
    }
  }

  async function submitFound() {
    setWorking(true);
    try {
      await callApi<{ item: unknown }>("/api/found", {
        method: "POST",
        body: JSON.stringify({
          registrarOrg: foundOrg,
          registrarContact: foundContact,
          notes: foundNotes,
          location: { lat: Number(foundLat), lng: Number(foundLng) },
          estimatedAge: foundAge ? Number(foundAge) : undefined,
          photos: [],
        }),
      });

      setStatusMessage("Found entry saved.");
      setFoundOrg("");
      setFoundContact("");
      setFoundNotes("");
      setFoundLat("");
      setFoundLng("");
      setFoundAge("");
    } catch {
      setStatusMessage("Could not save the found entry.");
    } finally {
      setWorking(false);
    }
  }

  async function submitDiscoverStory() {
    setWorking(true);

    try {
      const response = await callApi<{ potentialLinks: Array<{ id: string; score: number }> }>("/api/discover", {
        method: "POST",
        body: JSON.stringify({ authorName: discoverAuthor, story: discoverStory, locationHint: discoverLocationHint }),
      });

      setStatusMessage(
        response.potentialLinks.length
          ? `Found ${response.potentialLinks.length} related story or family match(es).`
          : "Story saved. No close match yet.",
      );

      setDiscoverAuthor("");
      setDiscoverStory("");
      setDiscoverLocationHint("");
    } catch {
      setStatusMessage("Could not save the story.");
    } finally {
      setWorking(false);
    }
  }

  async function runMatchScan() {
    if (!latestReportId) {
      setStatusMessage("Submit a missing person report first.");
      return;
    }

    setWorking(true);
    try {
      const response = await callApi<{ items: MatchResult[]; alertsTriggered: number }>("/api/matches", {
        method: "POST",
        body: JSON.stringify({ reportId: latestReportId }),
      });

      setMatches(response.items);
      setStatusMessage(
        response.alertsTriggered > 0
          ? `Alert sent for ${response.alertsTriggered} possible match(es).`
          : "Scan complete. No strong match yet.",
      );
    } catch {
      setStatusMessage("Could not run the match check.");
    } finally {
      setWorking(false);
    }
  }

  async function triggerBroadcastAndPoster() {
    if (!latestReportId) {
      setStatusMessage("No report is selected.");
      return;
    }

    setWorking(true);

    try {
      const { status } = await callApi<{ authorityPayload: Record<string, unknown>; status: string }>("/api/broadcast", {
        method: "POST",
        body: JSON.stringify({ reportId: latestReportId }),
      });

      const report = reports.find((entry) => entry.id === latestReportId);
      if (report) {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text("MISSING PERSON ALERT", 20, 24);

        let yPos = 44;

        // Add photo if available
        if (report.photos[0]) {
          try {
            doc.addImage(report.photos[0], "JPEG", 20, yPos, 50, 50);
            yPos = yPos + 55;
          } catch {
            // If image fails, continue without it
          }
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${report.person.fullName}`, 20, yPos);
        yPos += 10;
        doc.text(`Age: ${report.person.age ?? "Not provided"}`, 20, yPos);
        yPos += 10;
        doc.text(`Last Seen: ${new Date(report.lastSeenAt).toLocaleString()}`, 20, yPos);
        yPos += 10;
        doc.text(
          `Location: ${report.lastKnownLocationName || "Not provided"}`,
          20,
          yPos,
          { maxWidth: 165 },
        );
        yPos += 10;
        doc.text(`Clothing: ${report.person.clothingDescription ?? "Not provided"}`, 20, yPos, { maxWidth: 165 });

        yPos += 20;
        doc.setFont("helvetica", "bold");
        doc.text("CONTACT IMMEDIATELY", 20, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text(`${report.reporterName} | ${report.reporterEmail}`, 20, yPos);
        if (report.reporterPhone) {
          yPos += 10;
          doc.text(`${report.reporterPhone}`, 20, yPos);
        }

        doc.save(`AuraFind-${report.person.fullName.replace(/\s+/g, "-")}.pdf`);
      }

      setStatusMessage(`Alert ${status}. Printable poster created.`);
    } catch {
      setStatusMessage("Could not share the alert.");
    } finally {
      setWorking(false);
    }
  }

  async function enablePushAlerts() {
    if (!("Notification" in window)) {
      setStatusMessage("This browser cannot send push alerts.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatusMessage("Push alerts were not allowed.");
      return;
    }

    setStatusMessage("Push alerts are now on.");
  }

  const statCards = useMemo(
    () => [
      { label: "Active Cases", value: reports.length, icon: <UserRoundSearch className="h-4 w-4" /> },
      { label: "Potential Matches", value: matches.length, icon: <Fingerprint className="h-4 w-4" /> },
      { label: "Auto-Alerts", value: matches.filter((entry) => entry.shouldAlert).length, icon: <BellRing className="h-4 w-4" /> },
    ],
    [matches, reports.length],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dff7f7_0%,_#f5f9ff_35%,_#eef3ff_100%)] px-4 py-7 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_#0f172a_0%,_#06131a_45%,_#020617_100%)] dark:text-slate-50 sm:px-8">
      {!lowBandwidth && (
        <>
          <div className="pointer-events-none absolute -left-16 top-2 h-52 w-52 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-500/20" />
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/20" />
        </>
      )}

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/40 bg-white/65 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/55"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">AuraFind</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A simple place to report and find missing people</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-700 dark:text-slate-300">
                Send a report, share a sighting, check for matches, and keep everything in one easy-to-use place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-sm hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme
              </button>
              <button
                onClick={() => setLowBandwidth((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-sm hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <Zap className="h-4 w-4" /> {lowBandwidth ? "Low data mode: On" : "Low data mode"}
              </button>
              <button
                onClick={enablePushAlerts}
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
              >
                <BellRing className="h-4 w-4" /> Turn on push alerts
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-sm hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <UserRoundSearch className="h-4 w-4" /> Admin
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {card.icon}
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav className="rounded-3xl border border-white/40 bg-white/65 p-3 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/55">
            {[
              { key: "report", label: "Report", icon: <Send className="h-4 w-4" /> },
              { key: "sighting", label: "Sighting", icon: <Compass className="h-4 w-4" /> },
              { key: "found", label: "Found list", icon: <MapPin className="h-4 w-4" /> },
              { key: "discover", label: "Family stories", icon: <Trees className="h-4 w-4" /> },
              { key: "intel", label: "Matches", icon: <Bot className="h-4 w-4" /> },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key as Section)}
                className={clsx(
                  "mb-2 flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm transition",
                  section === item.key
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-700/30"
                    : "bg-transparent text-slate-700 hover:bg-teal-500/10 dark:text-slate-200",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="grid gap-6">
            <Card title="Active Cases" icon={<UserRoundSearch className="h-5 w-5" />}>
              {loadingBoard && reports.length === 0 ? (
                <div className="grid gap-3">
                  <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/70" />
                  <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/70" />
                </div>
              ) : reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/70 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                  No active cases yet. Send a report and it will appear here.
                </div>
              ) : (
                <div className="grid gap-3">
                  {reports.slice(0, 4).map((report) => (
                    <article key={report.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="shrink-0 sm:w-36">
                          {report.photos[0] ? (
                            <a href={report.photos[0]} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                              <Image
                                src={report.photos[0]}
                                alt={`${report.person.fullName} attachment`}
                                width={320}
                                height={224}
                                unoptimized
                                className="h-28 w-full object-cover"
                              />
                            </a>
                          ) : (
                            <div className="flex h-28 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                              No image attached
                            </div>
                          )}
                          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                            {report.photos.length} photo{report.photos.length === 1 ? "" : "s"} attached
                          </p>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{report.person.fullName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Case {report.id.slice(0, 8)} · Open since {new Date(report.createdAt).toLocaleString()}</p>
                            </div>
                            <span className="rounded-full bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                              {report.status}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                            <p><span className="font-medium text-slate-900 dark:text-slate-100">Age:</span> {report.person.age ?? "Not provided"}</p>
                            <p><span className="font-medium text-slate-900 dark:text-slate-100">Last seen:</span> {report.lastSeenAt ? new Date(report.lastSeenAt).toLocaleString() : "Not provided"}</p>
                            <p><span className="font-medium text-slate-900 dark:text-slate-100">Last Seen Location:</span> {report.lastKnownLocationName || "Not provided"}</p>
                            {(report.person.clothingDescription || report.voiceTranscript) && (
                              <p><span className="font-medium text-slate-900 dark:text-slate-100">Description:</span> {report.voiceTranscript || report.person.clothingDescription}</p>
                            )}
                            <p><span className="font-medium text-slate-900 dark:text-slate-100">Reporter:</span> {report.reporterName}</p>
                            {report.reporterPhone && <p><span className="font-medium text-slate-900 dark:text-slate-100">Contact:</span> {report.reporterPhone}</p>}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Card>

            <AnimatePresence mode="wait">
            {section === "report" && (
              <motion.div key="report" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-6">
                <Card title="Report a missing person" icon={<Send className="h-5 w-5" />}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Missing Person Information (first) */}
                    <Input 
                      placeholder="Missing Person Full Name *" 
                      value={reportDraft.fullName} 
                      error={!!fieldErrors.fullName}
                      errorMessage={fieldErrors.fullName}
                      onChange={(e) => {
                        setReportDraft((prev) => ({ ...prev, fullName: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                      }} 
                    />
                    <Input 
                      placeholder="Missing Person Age (optional)" 
                      type="number" 
                      value={reportDraft.age} 
                      error={!!fieldErrors.age}
                      errorMessage={fieldErrors.age}
                      onChange={(e) => {
                        setReportDraft((prev) => ({ ...prev, age: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, age: "" }));
                      }} 
                    />
                    <Input 
                      placeholder="Height (cm, optional)" 
                      type="number" 
                      value={reportDraft.heightCm} 
                      error={!!fieldErrors.heightCm}
                      errorMessage={fieldErrors.heightCm}
                      onChange={(e) => {
                        setReportDraft((prev) => ({ ...prev, heightCm: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, heightCm: "" }));
                      }} 
                    />
                    <Input placeholder="Eye Color (optional)" value={reportDraft.eyeColor} onChange={(e) => setReportDraft((prev) => ({ ...prev, eyeColor: e.target.value }))} />
                    <Input placeholder="Hair Color (optional)" value={reportDraft.hairColor} onChange={(e) => setReportDraft((prev) => ({ ...prev, hairColor: e.target.value }))} />

                    {/* Physical Descriptors */}
                    <Input placeholder="Distinguishing Marks (optional)" value={reportDraft.distinguishingMarks} onChange={(e) => setReportDraft((prev) => ({ ...prev, distinguishingMarks: e.target.value }))} className="sm:col-span-2" />
                    <Area placeholder="Clothing Description (optional)" value={reportDraft.clothingDescription} onChange={(e) => setReportDraft((prev) => ({ ...prev, clothingDescription: e.target.value }))} className="min-h-24 sm:col-span-2" />
                    <Input placeholder="Languages (comma separated, optional)" value={reportDraft.languages} onChange={(e) => setReportDraft((prev) => ({ ...prev, languages: e.target.value }))} className="sm:col-span-2" />

                    {/* Incident Details */}
                    <Input type="datetime-local" value={reportDraft.lastSeenAt} onChange={(e) => setReportDraft((prev) => ({ ...prev, lastSeenAt: e.target.value }))} />
                    <Input placeholder="Last Seen Location (e.g., Central Park, NYC)" value={reportDraft.lastLocation} onChange={(e) => setReportDraft((prev) => ({ ...prev, lastLocation: e.target.value }))} />

                    {/* Media & Voice */}
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Photos (optional)</label>
                      <Input key={reportPhotoInputKey} type="file" accept="image/*" multiple onChange={(e) => void handleReportPhotoUpload(e.target.files)} />
                      {reportPhotos.length > 0 && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {reportPhotos.map((photo, index) => (
                            <div key={`${index}-${photo.slice(0, 16)}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                              <button
                                type="button"
                                onClick={() => removeReportPhoto(index)}
                                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                                aria-label="Remove photo"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <Image
                                src={photo}
                                alt={`Selected photo ${index + 1}`}
                                width={640}
                                height={360}
                                unoptimized
                                className="h-40 w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-slate-500">We save the first photo details automatically.</p>
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        onClick={startVoiceCapture}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                      >
                        <Mic className="h-4 w-4" /> Add voice note
                      </button>
                      <Area value={reportDraft.voiceTranscript} onChange={(e) => setReportDraft((prev) => ({ ...prev, voiceTranscript: e.target.value }))} placeholder="Voice transcript appears here" className="mt-2 min-h-20" />
                    </div>

                    {/* Reporter Information (last) */}
                    <Input 
                      placeholder="Reporter Name *" 
                      value={reportDraft.reporterName} 
                      error={!!fieldErrors.reporterName}
                      errorMessage={fieldErrors.reporterName}
                      onChange={(e) => {
                        setReportDraft((prev) => ({ ...prev, reporterName: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, reporterName: "" }));
                      }} 
                    />
                    <Input 
                      placeholder="Reporter Email *" 
                      type="email" 
                      value={reportDraft.reporterEmail} 
                      error={!!fieldErrors.reporterEmail}
                      errorMessage={fieldErrors.reporterEmail}
                      onChange={(e) => {
                        setReportDraft((prev) => ({ ...prev, reporterEmail: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, reporterEmail: "" }));
                      }} 
                    />
                    <Input placeholder="Reporter Phone (optional)" value={reportDraft.reporterPhone} onChange={(e) => setReportDraft((prev) => ({ ...prev, reporterPhone: e.target.value }))} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={submitReport} disabled={working} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">
                      {working ? "Saving..." : "Save report"}
                    </button>
                    <button onClick={triggerBroadcastAndPoster} disabled={working} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
                      Share alert and poster
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}

            {section === "sighting" && (
              <motion.div key="sighting" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-6">
                <Card title="Anonymous sighting" icon={<Compass className="h-5 w-5" />}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Area placeholder="What did you observe?" value={sightingNotes} onChange={(e) => setSightingNotes(e.target.value)} className="min-h-24 sm:col-span-2" />
                    <Input type="datetime-local" value={sightingSeenAt} onChange={(e) => setSightingSeenAt(e.target.value)} />
                    <Input placeholder="Country" value={sightingCountry} onChange={(e) => setSightingCountry(e.target.value)} />
                    <button
                      onClick={() => fillGeolocation(setSightingLat, setSightingLng)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                    >
                      Fill my location
                    </button>
                    <Input placeholder="Latitude" value={sightingLat} onChange={(e) => setSightingLat(e.target.value)} />
                    <Input placeholder="Longitude" value={sightingLng} onChange={(e) => setSightingLng(e.target.value)} />
                    <div className="sm:col-span-2">
                      <Input type="file" accept="image/*" multiple onChange={(e) => void handleSightingPhotoUpload(e.target.files)} />
                    </div>
                  </div>
                  <button onClick={submitSighting} disabled={working} className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">
                    Send sighting
                  </button>
                </Card>
              </motion.div>
            )}

            {section === "found" && (
              <motion.div key="found" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-6">
                <Card title="Found list" icon={<MapPin className="h-5 w-5" />}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Place or organization" value={foundOrg} onChange={(e) => setFoundOrg(e.target.value)} />
                    <Input placeholder="Contact person" value={foundContact} onChange={(e) => setFoundContact(e.target.value)} />
                    <Input placeholder="Estimated age" type="number" value={foundAge} onChange={(e) => setFoundAge(e.target.value)} />
                    <Input placeholder="Latitude" value={foundLat} onChange={(e) => setFoundLat(e.target.value)} />
                    <Input placeholder="Longitude" value={foundLng} onChange={(e) => setFoundLng(e.target.value)} />
                    <Area placeholder="Condition and any useful notes" className="sm:col-span-2 min-h-24" value={foundNotes} onChange={(e) => setFoundNotes(e.target.value)} />
                  </div>
                  <button onClick={submitFound} disabled={working} className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">
                    Save to found list
                  </button>
                </Card>
              </motion.div>
            )}

            {section === "discover" && (
              <motion.div key="discover" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-6">
                <Card title="Family stories" icon={<Trees className="h-5 w-5" />}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Your Name" value={discoverAuthor} onChange={(e) => setDiscoverAuthor(e.target.value)} />
                    <Input placeholder="Place hint (optional)" value={discoverLocationHint} onChange={(e) => setDiscoverLocationHint(e.target.value)} />
                    <Area className="sm:col-span-2 min-h-32" placeholder="Share your story, names, places, and memories..." value={discoverStory} onChange={(e) => setDiscoverStory(e.target.value)} />
                  </div>
                  <button onClick={submitDiscoverStory} disabled={working} className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">
                    Save story
                  </button>
                </Card>
              </motion.div>
            )}

            {section === "intel" && (
              <motion.div key="intel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-6">
                <Card title="Match check" icon={<Fingerprint className="h-5 w-5" />}>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={runMatchScan} disabled={working} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">
                      <span className="inline-flex items-center gap-2">
                        <Search className="h-4 w-4" /> Check for matches
                      </span>
                    </button>
                    {working && <LoaderCircle className="h-4 w-4 animate-spin text-teal-600" />}
                  </div>

                  <div className="mt-4 space-y-2">
                    {matches.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">No matches yet. Add reports, sightings, or found records first.</p>}
                    {matches.map((item) => (
                      <article key={item.candidateId} className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                        <p className="text-sm font-semibold">
                          Candidate {item.candidateId.slice(0, 8)} | Score {item.score}%
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          Face {item.components.faceSimilarity}% · Geo {item.components.geoProximityScore}% · Time {item.components.timeWindowScore}%
                        </p>
                        {item.shouldAlert && <p className="mt-1 text-xs font-semibold text-rose-600">Strong match found. Alert sent.</p>}
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-dashed border-teal-400/70 p-4 text-sm text-slate-700 dark:text-slate-200">
                    <p className="font-semibold">Connect other tools if needed</p>
                    <p className="mt-1">You can connect photo checks, file storage, search, and message alerts with environment settings.</p>
                  </div>
                </Card>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/55 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2">
            <Globe className="h-4 w-4" /> {statusMessage}
          </p>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.17em]">
            <Zap className="h-4 w-4" /> Works well on all devices
          </p>
        </footer>
      </div>

    </div>
  );
}
