/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type Lang = "ar" | "en";

const t = {
  ar: {
    title: "عيد مبارك",
    subtitle: "بطاقة تهنئة عيد الفطر",
    nameLabel: "الاسم",
    namePlaceholder: "مثال: فيصل أسلم",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "بريدك@مثال.com",
    submit: "إنشاء البطاقة",
    generating: "جاري إنشاء البطاقة...",
    ready: "بطاقتك جاهزة!",
    emailSent: "تم إرسال البطاقة إلى بريدك الإلكتروني.",
    emailNotConfigured: "البريد غير مُفعّل — يمكنك تحميل البطاقة أدناه.",
    download: "تحميل البطاقة",
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
    emailLabel: "Your Email",
    emailPlaceholder: "your@email.com",
    submit: "Generate Eid Card",
    generating: "Generating your card...",
    ready: "Your personalized Eid card is ready!",
    emailSent: "Card has been sent to your email.",
    emailNotConfigured: "Email not configured — download your card below.",
    download: "Download Card",
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
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    image: string;
    arabicName: string;
    emailSent: boolean;
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
        body: JSON.stringify({ name, email, lang }),
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

  function handleDownload() {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `eid-card-${name.replace(/\s+/g, "-")}.png`;
    link.click();
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-linear-to-br from-[#0f1b2d] via-[#1a2d4a] to-[#0d2137] flex items-center justify-center p-4 relative overflow-hidden"
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
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" className="text-amber-400" />
        </svg>
        {/* Crescent & star — top left (Eid symbol) */}
        <svg className="absolute top-12 left-8 w-24 h-24 text-amber-400/20" viewBox="0 0 64 64">
          <path fill="currentColor" d="M32 4c-15.5 0-28 12.5-28 28s12.5 28 28 28 28-12.5 28-28S47.5 4 32 4zm0 8c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20z" />
          <path fill="currentColor" d="M46 28l-2.5 1.2 1.2 2.5-2.5-1.2-1.2 2.5-1.2-2.5-2.5 1.2 1.2-2.5-2.5-1.2 2.5-1.2-1.2-2.5 2.5 1.2 1.2-2.5 1.2 2.5 2.5-1.2z" />
        </svg>
        {/* Crescent moon — bottom right */}
        <svg className="absolute bottom-16 right-12 w-20 h-20 text-amber-400/15" viewBox="0 0 64 64" fillRule="evenodd">
          <path fill="currentColor" d="M32 8a24 24 0 1 1 0 48 24 24 0 0 1 0-48zm10 8a16 16 0 1 1 0 32 16 16 0 0 1 0-32z" />
        </svg>
        {/* Small star accents */}
        <span className="absolute top-1/4 right-16 text-amber-400/10 text-2xl">✦</span>
        <span className="absolute bottom-1/3 left-20 text-amber-400/10 text-xl">✦</span>
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
          <h1 className="text-4xl font-bold text-amber-400 mb-1 tracking-wide">
            {l.title}
          </h1>
          <p className="text-blue-200 text-base">{l.subtitle}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-amber-400/50" />
            <span className="text-amber-400 text-xl">✦</span>
            <span className="h-px w-12 bg-amber-400/50" />
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
                  className="input-dark w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-blue-200 mb-1.5"
                >
                  {l.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={l.emailPlaceholder}
                  className="input-dark w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 text-white font-semibold border border-transparent hover:from-amber-600 hover:to-amber-700 hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <p className="text-amber-400 font-semibold mb-1">
                  {result.arabicName}
                </p>
                <p className="text-blue-200 text-sm">{l.ready}</p>
                {result.emailSent && (
                  <p className="text-green-400 text-sm mt-1">{l.emailSent}</p>
                )}
                {!result.emailSent && (
                  <p className="text-yellow-300/70 text-xs mt-1">
                    {l.emailNotConfigured}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
                >
                  {l.preview}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 text-white font-semibold border border-transparent hover:from-amber-600 hover:to-amber-700 hover:border-white/30 transition-colors cursor-pointer"
                >
                  {l.download}
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setName("");
                    setEmail("");
                    setPreviewOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
                >
                  {l.another}
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
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
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
