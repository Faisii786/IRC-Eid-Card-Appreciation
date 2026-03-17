"use client";

import { useState } from "react";

type Lang = "ar" | "en";

const t = {
  ar: {
    title: "عيد مبارك",
    subtitle: "بطاقة تهنئة عيد الفطر",
    nameLabel: "الاسم",
    namePlaceholder: "مثال: عبدالله الشيخي",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "بريدك@مثال.com",
    submit: "إنشاء البطاقة",
    generating: "جاري إنشاء البطاقة...",
    ready: "بطاقتك جاهزة!",
    emailSent: "تم إرسال البطاقة إلى بريدك الإلكتروني.",
    emailNotConfigured: "البريد غير مُفعّل — يمكنك تحميل البطاقة أدناه.",
    download: "تحميل البطاقة",
    another: "إنشاء بطاقة أخرى",
    footer: "شركة الإستقدام الدولية • www.irc.sa",
    switchLang: "English",
    error: "حدث خطأ، يرجى المحاولة مرة أخرى.",
  },
  en: {
    title: "Eid Mubarak",
    subtitle: "Eid Al-Fitr Greeting Card",
    nameLabel: "Your Name",
    namePlaceholder: "e.g. Abdullah AlShaikhy",
    emailLabel: "Your Email",
    emailPlaceholder: "your@email.com",
    submit: "Generate Eid Card",
    generating: "Generating your card...",
    ready: "Your personalized Eid card is ready!",
    emailSent: "Card has been sent to your email.",
    emailNotConfigured: "Email not configured — download your card below.",
    download: "Download Card",
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
      className="min-h-screen bg-linear-to-br from-[#0f1b2d] via-[#1a2d4a] to-[#0d2137] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg">
        {/* Lang toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm hover:bg-white/20 transition cursor-pointer"
          >
            {l.switchLang}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-amber-400 mb-2 tracking-wide">
            {l.title}
          </h1>
          <p className="text-blue-200 text-lg">{l.subtitle}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-amber-400/50" />
            <span className="text-amber-400 text-xl">✦</span>
            <span className="h-px w-12 bg-amber-400/50" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-blue-200 mb-2"
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
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-blue-200 mb-2"
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
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition"
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
                className="w-full py-3 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 cursor-pointer"
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
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-amber-400 font-semibold text-lg mb-1">
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

              <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img
                  src={result.image}
                  alt="Eid Card"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {l.download}
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setName("");
                    setEmail("");
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all cursor-pointer"
                >
                  {l.another}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300/40 text-xs mt-6">{l.footer}</p>
      </div>
    </main>
  );
}
