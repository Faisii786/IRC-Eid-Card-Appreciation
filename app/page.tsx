/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

type Lang = "ar" | "en";
type LoadingStage = "idle" | "generating" | "translating" | "rendering";
type CardDesign = "classic" | "design1" | "design2";
const DESIGN_ORDER: CardDesign[] = ["classic", "design1", "design2"];
const NAME_REGEX = /^[A-Za-z\u0600-\u06FF\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 60;

const t = {
  ar: {
    title: "عيد الفطر المبارك",
    subtitle: "صمّم تهنئة العيد باسمك. 🌙",
    nameLabel: "الاسم",
    namePlaceholder: "مثال: فيصل أسلم",
    designLabel: "اختر التصميم",
    designClassic: "تصميم 1",
    design1: "تصميم 2",
    design2: "تصميم 3",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "مثال: name@example.com",
    submit: "صمّم بطاقتك",
    generating: "جاري تجهيز بطاقتك...",
    translating: "جاري تنسيق اسمك على البطاقة...",
    rendering: "اللمسات الأخيرة على بطاقتك...",
    ready: "بطاقة جاهزة للتحميل",
    appreciation: [
      "بمناسبة عيد الفطر السعيد، نتقدم إليكم بأحر التهاني.",
      "شكرًا لتفانيكم ومساهماتكم في IRC.",
      "نسأل الله أن يحمل لكم هذا العيد السعادة والنجاح والازدهار.",
    ],
    downloadAll: "تحميل كل الهدايا",
    downloadAllPdf: "تحميل كـ PDF",
    saveImage: "حفظ الصورة",
    preview: "عرض بطاقة التهنئة",
    close: "إغلاق",
    prevDesign: "التصميم السابق",
    nextDesign: "التصميم التالي",
    another: "انشاء بطاقة اخرى",
    footer: "شركة الإستقدام الدولية • www.irc.sa",
    switchLang: "English",
    error: "حدث خطأ، يرجى المحاولة مرة أخرى.",
    invalidName: "اكتب اسمًا صحيحًا (أحرف عربية/إنجليزية فقط).",
    nameShort: "الاسم قصير جدًا.",
    nameLong: "الاسم طويل جدًا.",
    emailRequired: "البريد الإلكتروني مطلوب.",
    invalidEmail: "صيغة البريد الإلكتروني غير صحيحة.",
    botField: "اترك هذا الحقل فارغًا",
  },
  en: {
    title: "Eid Al-Fitr Mubarak",
    subtitle: "Design your Eid greeting card. 🌙",
    nameLabel: "Your Name",
    namePlaceholder: "e.g. Faisal Aslam",
    designLabel: "Choose design",
    designClassic: "Design 1",
    design1: "Design 2",
    design2: "Design 3",
    emailLabel: "Email",
    emailPlaceholder: "e.g. name@example.com",
    submit: "Design Your Card",
    generating: "Preparing your card...",
    translating: "Styling your name on the card...",
    rendering: "Adding final touches to your card...",
    ready: "A card ready for download",
    appreciation: [
      "On the joyful occasion of Eid Al-Fitr, we extend our warmest wishes to you.",
      "Thank you for your dedication and contributions to IRC.",
      "May this Eid bring you happiness, success, and prosperity.",
    ],
    downloadAll: "Download All Cards",
    downloadAllPdf: "Download as PDF",
    saveImage: "Save Image",
    preview: "View Greeting Card",
    close: "Close",
    prevDesign: "Previous design",
    nextDesign: "Next design",
    another: "Create Another Card",
    footer: "International Recruitment Company • www.irc.sa",
    switchLang: "العربية",
    error: "Something went wrong. Please try again.",
    invalidName: "Enter a valid name (Arabic/English letters only).",
    nameShort: "Name is too short.",
    nameLong: "Name is too long.",
    emailRequired: "Email is required.",
    invalidEmail: "Email format is invalid.",
    botField: "Leave this field empty",
  },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("ar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [design, setDesign] = useState<CardDesign>("classic");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [result, setResult] = useState<{
    imageData?: string;
    imageUrl: string;
    arabicName: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageLoading, setPreviewImageLoading] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");
  const [designLoading, setDesignLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const l = t[lang];
  const isRtl = lang === "ar";
  const normalizedName = useMemo(() => name.replace(/\s+/g, " ").trim(), [name]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const nameLength = normalizedName.length;
  const isNameValid =
    nameLength >= MIN_NAME_LENGTH &&
    nameLength <= MAX_NAME_LENGTH &&
    NAME_REGEX.test(normalizedName);
  const isEmailValid = EMAIL_REGEX.test(normalizedEmail);

  function getAdjacentDesign(direction: 1 | -1): CardDesign {
    const currentIndex = DESIGN_ORDER.indexOf(design);
    const nextIndex = (currentIndex + direction + DESIGN_ORDER.length) % DESIGN_ORDER.length;
    return DESIGN_ORDER[nextIndex];
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("eid-card-lang");
    if (saved === "en" || saved === "ar") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("eid-card-lang", lang);
  }, [lang]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      } else if (event.key === "ArrowRight") {
        void handleDesignChange(getAdjacentDesign(isRtl ? -1 : 1));
      } else if (event.key === "ArrowLeft") {
        void handleDesignChange(getAdjacentDesign(isRtl ? 1 : -1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen, design, isRtl]);

  useEffect(() => {
    if (!previewOpen || !result) return;
    const src = result.imageData || result.imageUrl;
    if (!src) {
      setPreviewImageLoading(false);
      return;
    }

    let isActive = true;
    setPreviewImageLoading(true);
    const image = new Image();
    image.onload = () => {
      if (isActive) setPreviewImageLoading(false);
    };
    image.onerror = () => {
      if (!isActive) return;
      setPreviewImageLoading(false);
      setError(l.error);
    };
    image.src = src;

    return () => {
      isActive = false;
    };
  }, [previewOpen, result?.imageData, result?.imageUrl, l.error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!normalizedName) {
      setError(l.nameShort);
      return;
    }
    if (normalizedName.length < MIN_NAME_LENGTH) {
      setError(l.nameShort);
      return;
    }
    if (normalizedName.length > MAX_NAME_LENGTH) {
      setError(l.nameLong);
      return;
    }
    if (!NAME_REGEX.test(normalizedName)) {
      setError(l.invalidName);
      return;
    }
    if (!normalizedEmail) {
      setError(l.emailRequired);
      return;
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError(l.invalidEmail);
      return;
    }
    setLoading(true);
    setLoadingStage("generating");
    setError("");
    setResult(null);
    const stageTimeout = window.setTimeout(() => {
      setLoadingStage("translating");
    }, 350);

    try {
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, email: normalizedEmail, lang, website, design: "classic" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || l.error);
        return;
      }

      setLoadingStage("rendering");
      await new Promise((resolve) => setTimeout(resolve, 120));
      setDesign("classic");
      setResult(data);
    } catch {
      setError(l.error);
    } finally {
      clearTimeout(stageTimeout);
      setLoading(false);
      setLoadingStage("idle");
    }
  }

  async function convertImageFormat(imageBlob: Blob, mimeType: string, quality?: number) {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageBlob);
    img.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image conversion failed"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable");
    }

    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL(mimeType, quality);
  }

  function getSafeBaseName(): string {
    const safeName = normalizedName.replace(/[^A-Za-z0-9\u0600-\u06FF-]+/g, "-");
    return `eid-card-${safeName || "name"}`;
  }

  async function fetchCardBlobFromResult(card: { imageData?: string; imageUrl: string }): Promise<Blob> {
    if (!card) {
      throw new Error("Image unavailable");
    }
    if (card.imageData?.startsWith("data:image")) {
      const dataRes = await fetch(card.imageData);
      if (!dataRes.ok) {
        throw new Error("Image data fetch failed");
      }
      return dataRes.blob();
    }
    if (!card.imageUrl) {
      throw new Error("Image URL unavailable");
    }
    const imageRes = await fetch(card.imageUrl);
    if (!imageRes.ok) {
      throw new Error("Image fetch failed");
    }
    return imageRes.blob();
  }

  async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Failed to convert image"));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(blob);
    });
  }

  async function requestCardForDesign(nextDesign: CardDesign) {
    const res = await fetch("/api/generate-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: normalizedName,
        email: normalizedEmail,
        lang,
        website,
        design: nextDesign,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || l.error);
    }
    return data as { imageData?: string; imageUrl: string; arabicName: string };
  }

  async function getCardForDesign(nextDesign: CardDesign) {
    if (result && design === nextDesign) {
      return result;
    }
    return requestCardForDesign(nextDesign);
  }

  async function handleSaveCurrentImage() {
    if (!result) return;
    try {
      const currentBlob = await fetchCardBlobFromResult(result);
      const href = URL.createObjectURL(currentBlob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${getSafeBaseName()}-${design}.png`;
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      setError(l.error);
    }
  }

  async function handleDownloadAllGallery() {
    if (!result) return;
    setDownloadLoading(true);
    try {
      const fileBase = getSafeBaseName();
      for (const selected of DESIGN_ORDER) {
        const card = await getCardForDesign(selected);
        const originalBlob = await fetchCardBlobFromResult(card);
        const href = await convertImageFormat(originalBlob, "image/jpeg", 0.95);
        const link = document.createElement("a");
        link.href = href;
        link.download = `${fileBase}-${selected}.jpg`;
        link.click();
      }
    } catch {
      setError(l.error);
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!result) return;
    setDownloadLoading(true);
    try {
      const fileBase = getSafeBaseName();
      const currentBlob = await fetchCardBlobFromResult(result);
      const imageDataUrl = await blobToDataUrl(currentBlob);
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("PDF image load failed"));
      });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
      const renderWidth = img.width * ratio;
      const renderHeight = img.height * ratio;
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;
      pdf.addImage(imageDataUrl, "PNG", x, y, renderWidth, renderHeight);

      pdf.save(`${fileBase}-${design}.pdf`);
    } catch {
      setError(l.error);
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleDesignChange(nextDesign: CardDesign) {
    if (loading || designLoading || !result) return;
    setDesignLoading(true);
    if (previewOpen) {
      setPreviewImageLoading(true);
    }
    setError("");
    try {
      const data = await requestCardForDesign(nextDesign);
      setDesign(nextDesign);
      setResult(data);
    } catch {
      setError(l.error);
    } finally {
      setDesignLoading(false);
    }
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-linear-to-br from-[#061a30] via-[#0b2f52] to-[#1b5f93] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
    >
      {/* Islamic / Eid background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Subtle geometric pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0L44 20L40 40L36 20Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M0 40L20 44L40 40L20 36Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" className="text-blue-200" />
        </svg>
        {/* Crescent & star — top left (Eid symbol) */}
        <svg className="absolute top-12 left-8 w-24 h-24 text-blue-200/20" viewBox="0 0 64 64">
          <path fill="currentColor" d="M32 4c-15.5 0-28 12.5-28 28s12.5 28 28 28 28-12.5 28-28S47.5 4 32 4zm0 8c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20z" />
          <path fill="currentColor" d="M46 28l-2.5 1.2 1.2 2.5-2.5-1.2-1.2 2.5-1.2-2.5-2.5 1.2 1.2-2.5-2.5-1.2 2.5-1.2-1.2-2.5 2.5 1.2 1.2-2.5 1.2 2.5 2.5-1.2z" />
        </svg>
        {/* Crescent moon — bottom right */}
        <svg className="absolute bottom-16 right-12 w-20 h-20 text-blue-200/15" viewBox="0 0 64 64" fillRule="evenodd">
          <path fill="currentColor" d="M32 8a24 24 0 1 1 0 48 24 24 0 0 1 0-48zm10 8a16 16 0 1 1 0 32 16 16 0 0 1 0-32z" />
        </svg>
        {/* Small star accents */}
        <span className="absolute top-1/4 right-16 text-blue-200/20 text-2xl">✦</span>
        <span className="absolute bottom-1/3 left-20 text-blue-200/20 text-xl">✦</span>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-[#0a2138]/65 backdrop-blur-xl rounded-3xl border border-blue-200/20 p-5 sm:p-7 shadow-[0_20px_80px_rgba(2,15,35,0.55)]">
          {/* Lang toggle */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="px-4 py-1.5 rounded-full bg-white/8 border border-blue-200/25 text-blue-100 text-sm hover:bg-white/16 hover:border-blue-100/45 transition-colors cursor-pointer"
            >
              {l.switchLang}
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-7">
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-50 mb-1 tracking-wide">
              {l.title}
            </h1>
            <p className="text-blue-200/90 text-sm sm:text-base">{l.subtitle}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="h-px w-14 bg-blue-200/35" />
              <span className="text-blue-100/95 text-xl">✦</span>
              <span className="h-px w-14 bg-blue-200/35" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-blue-100/15">
            {!result ? (
              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-blue-100 mb-1.5"
                  >
                    {l.nameLabel}
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={l.namePlaceholder}
                    maxLength={MAX_NAME_LENGTH}
                    className="input-dark w-full px-4 py-3 rounded-xl bg-transparent border border-blue-100/25 text-white placeholder-white/40 hover:border-blue-100/45 focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:border-transparent transition-colors"
                  />
                  <p className="mt-1 text-xs text-blue-100/80">
                    {nameLength}/{MAX_NAME_LENGTH}
                  </p>
                  <div className="sr-only">
                    <label htmlFor="website">{l.botField}</label>
                    <input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-blue-100 mb-1.5"
                  >
                    {l.emailLabel}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={l.emailPlaceholder}
                    className="input-dark w-full px-4 py-3 rounded-xl bg-transparent border border-blue-100/25 text-white placeholder-white/40 hover:border-blue-100/45 focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:border-transparent transition-colors"
                  />
                </div>

                {error && (
                  <div
                    className="bg-blue-500/20 border border-blue-300/40 rounded-xl px-4 py-3 text-blue-50 text-sm"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isNameValid || !isEmailValid}
                  className="w-full py-3 rounded-xl bg-linear-to-r from-[#124a79] to-[#1b5f93] text-white font-semibold border border-transparent hover:from-[#0d3b62] hover:to-[#154f7b] hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {loadingStage === "rendering" ? l.rendering : l.generating}
                    </span>
                  ) : (
                    l.submit
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-blue-50 text-lg font-semibold mb-1">
                    {result.arabicName}
                  </p>
                  <p className="text-blue-200 text-sm">{l.ready}</p>
                  <div className="mt-3 text-blue-100/85 text-sm leading-6 space-y-1">
                    {l.appreciation.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPreviewImageLoading(true);
                    setPreviewOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-linear-to-r from-[#124a79] to-[#1b5f93] text-white font-semibold border border-transparent hover:from-[#0d3b62] hover:to-[#154f7b] hover:border-white/30 transition-colors cursor-pointer"
                >
                  {l.preview}
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setError("");
                    setPreviewOpen(false);
                    setDesign("classic");
                  }}
                  className="w-full py-3 rounded-xl bg-white/6 border border-blue-100/25 text-blue-100 font-medium hover:bg-white/14 hover:border-blue-100/40 transition-colors cursor-pointer"
                >
                  {l.another}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-blue-300/40 text-xs mt-4">{l.footer}</p>
        </div>
      </div>

      {/* Fullscreen preview */}
      {previewOpen && (result?.imageData || result?.imageUrl) && (
        <div
          className="fixed inset-0 z-50 bg-[#061a30]/90 flex flex-col items-center justify-center p-4"
          onClick={() => {
            setPreviewOpen(false);
            setPreviewImageLoading(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={l.preview}
        >
          <button
            onClick={() => {
              setPreviewOpen(false);
              setPreviewImageLoading(false);
            }}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
            aria-label={l.close}
          >
            {l.close}
          </button>
          <div className="hidden sm:flex absolute top-4 left-4 sm:left-8 gap-2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleSaveCurrentImage();
              }}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
            >
              {l.saveImage}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleDownloadPdf();
              }}
              disabled={downloadLoading}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {l.downloadAllPdf}
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void handleDesignChange(getAdjacentDesign(isRtl ? 1 : -1));
            }}
            disabled={designLoading}
            className="hidden sm:flex absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xl z-20"
            aria-label={l.prevDesign}
          >
            {isRtl ? "›" : "‹"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void handleDesignChange(getAdjacentDesign(isRtl ? -1 : 1));
            }}
            disabled={designLoading}
            className="hidden sm:flex absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-xl z-20"
            aria-label={l.nextDesign}
          >
            {isRtl ? "‹" : "›"}
          </button>
          <div className="relative max-w-full max-h-[85vh] w-auto h-auto" onClick={(e) => e.stopPropagation()}>
            {previewImageLoading && (
              <div className="w-[min(88vw,420px)] h-[70vh] max-h-[85vh] rounded-lg bg-white/12 border border-white/10 animate-pulse" />
            )}
            <img
              src={result.imageData || result.imageUrl}
              alt="Eid Card"
              className={`max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg transition-opacity duration-200 ${previewImageLoading ? "opacity-0 absolute inset-0" : "opacity-100"
                }`}
              onLoad={() => setPreviewImageLoading(false)}
              onError={() => {
                setPreviewImageLoading(false);
                setError(l.error);
              }}
            />
          </div>
          <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0a2138]/85 border border-white/20 backdrop-blur-md">
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleDesignChange(getAdjacentDesign(isRtl ? 1 : -1));
              }}
              disabled={designLoading}
              className="w-10 h-10 rounded-lg bg-white/10 border border-white/25 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-lg"
              aria-label={l.prevDesign}
            >
              {isRtl ? "›" : "‹"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleSaveCurrentImage();
              }}
              className="px-3 h-10 rounded-lg bg-white/10 border border-white/25 text-white text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
            >
              {l.saveImage}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleDownloadPdf();
              }}
              disabled={downloadLoading}
              className="px-3 h-10 rounded-lg bg-white/10 border border-white/25 text-white text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {l.downloadAllPdf}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleDesignChange(getAdjacentDesign(isRtl ? -1 : 1));
              }}
              disabled={designLoading}
              className="w-10 h-10 rounded-lg bg-white/10 border border-white/25 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-lg"
              aria-label={l.nextDesign}
            >
              {isRtl ? "‹" : "›"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
