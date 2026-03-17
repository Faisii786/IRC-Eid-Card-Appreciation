/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

type Lang = "ar" | "en";

const t = {
  ar: {
    title: "عيد مبارك",
    subtitle: "بطاقة تهنئة عيد الفطر",
    nameLabel: "الاسم",
    namePlaceholder: "مثال: فيصل أسلم",
    submit: "إنشاء البطاقة",
    generating: "جاري إنشاء البطاقة...",
    ready: "بطاقتك جاهزة!",
    appreciation: [
      "بمناسبة عيد الفطر السعيد، نتقدم إليكم بأحر التهاني.",
      "شكرًا لتفانيكم ومساهماتكم في IRC.",
      "نسأل الله أن يحمل لكم هذا العيد السعادة والنجاح والازدهار.",
    ],
    downloadGallery: "تحميل للمعرض",
    downloadPdf: "تحميل PDF",
    preview: "معاينة",
    close: "إغلاق",
    another: "إنشاء بطاقة أخرى",
    footer: "شركة الإستقدام الدولية • www.irc.sa",
    switchLang: "English",
    error: "حدث خطأ، يرجى المحاولة مرة أخرى.",
  },
  en: {
    title: "Eid Mubarak",
    subtitle: "Eid Al-Fitr Greeting Card",
    nameLabel: "Your Name",
    namePlaceholder: "e.g. Faisal Aslam",
    submit: "Generate Eid Card",
    generating: "Generating your card...",
    ready: "Your personalized Eid card is ready!",
    appreciation: [
      "On the joyful occasion of Eid Al-Fitr, we extend our warmest wishes to you.",
      "Thank you for your dedication and contributions to IRC.",
      "May this Eid bring you happiness, success, and prosperity.",
    ],
    downloadGallery: "Download Gallery",
    downloadPdf: "Download PDF",
    preview: "Preview",
    close: "Close",
    another: "Make Another",
    footer: "International Recruitment Company • www.irc.sa",
    switchLang: "العربية",
    error: "Something went wrong. Please try again.",
  },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("ar");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    image: string;
    arabicName: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState("");

  const l = t[lang];
  const isRtl = lang === "ar";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, lang }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || l.error);
        return;
      }

      setResult(data);
    } catch {
      setError(l.error);
    } finally {
      setLoading(false);
    }
  }

  async function convertImageFormat(dataUrl: string, mimeType: string, quality?: number) {
    const img = new Image();
    img.src = dataUrl;
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
    return canvas.toDataURL(mimeType, quality);
  }

  async function handleDownload(format: "gallery" | "pdf") {
    if (!result?.image) return;
    try {
      const fileBase = `eid-card-${name.trim().replace(/\s+/g, "-") || "name"}`;
      let href = result.image;
      let extension = "png";

      if (format === "gallery") {
        href = await convertImageFormat(result.image, "image/jpeg", 0.95);
        extension = "jpg";
      } else if (format === "pdf") {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const img = new Image();
        img.src = result.image;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("PDF image load failed"));
        });

        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        const renderWidth = img.width * ratio;
        const renderHeight = img.height * ratio;
        const x = (pageWidth - renderWidth) / 2;
        const y = (pageHeight - renderHeight) / 2;

        pdf.addImage(result.image, "PNG", x, y, renderWidth, renderHeight);
        pdf.save(`${fileBase}.pdf`);
        return;
      }

      const link = document.createElement("a");
      link.href = href;
      link.download = `${fileBase}.${extension}`;
      link.click();
    } catch {
      setError(l.error);
    }
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-linear-to-br from-[#061a30] via-[#0b2f52] to-[#1b5f93] flex items-center justify-center p-4 relative overflow-hidden"
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

      <div className="w-full max-w-xl relative z-10">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 sm:p-6">
          {/* Lang toggle */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
            >
              {l.switchLang}
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
          <h1 className="text-4xl font-bold text-blue-100 mb-1 tracking-wide">
            {l.title}
          </h1>
          <p className="text-blue-200 text-base">{l.subtitle}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-blue-200/50" />
            <span className="text-blue-100 text-xl">✦</span>
            <span className="h-px w-12 bg-blue-200/50" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-blue-200 mb-1.5"
                >
                  {l.nameLabel}
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={l.namePlaceholder}
                  className="input-dark w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:border-transparent transition-colors"
                />
              </div>

              {error && (
                <div className="bg-blue-500/20 border border-blue-300/40 rounded-xl px-4 py-3 text-blue-100 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-[#124a79] to-[#1b5f93] text-white font-semibold border border-transparent hover:from-[#0d3b62] hover:to-[#154f7b] hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    {l.generating}
                  </span>
                ) : (
                  l.submit
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-blue-100 font-semibold mb-1">
                  {result.arabicName}
                </p>
                <p className="text-blue-200 text-sm">{l.ready}</p>
                <div className="mt-3 text-blue-100/90 text-sm leading-6 space-y-1">
                  {l.appreciation.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
                >
                  {l.preview}
                </button>
                <button
                  onClick={() => handleDownload("gallery")}
                  className="py-2.5 rounded-xl bg-linear-to-r from-[#124a79] to-[#1b5f93] text-white font-semibold border border-transparent hover:from-[#0d3b62] hover:to-[#154f7b] hover:border-white/30 transition-colors cursor-pointer"
                >
                  {l.downloadGallery}
                </button>
                <button
                  onClick={() => handleDownload("pdf")}
                  className="py-2.5 rounded-xl bg-linear-to-r from-[#124a79] to-[#1b5f93] text-white font-semibold border border-transparent hover:from-[#0d3b62] hover:to-[#154f7b] hover:border-white/30 transition-colors cursor-pointer"
                >
                  {l.downloadPdf}
                </button>
              </div>
            </div>
          )}
        </div>

          {/* Footer */}
          <p className="text-center text-blue-300/40 text-xs mt-4">{l.footer}</p>
        </div>
      </div>

      {/* Fullscreen preview */}
      {previewOpen && result?.image && (
        <div
          className="fixed inset-0 z-50 bg-[#061a30]/90 flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
            aria-label={l.close}
          >
            {l.close}
          </button>
          <img
            src={result.image}
            alt="Eid Card"
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
