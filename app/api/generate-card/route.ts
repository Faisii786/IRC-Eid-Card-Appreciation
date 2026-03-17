import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import translate from "google-translate-api-x";
import path from "path";
import fs from "fs";
import { saveGeneratedCard } from "@/lib/generatedCardsStore";
import { appendGenerationRecord } from "@/lib/googleSheets";

const PRIMARY_FONT_PATH = path.join(process.cwd(), "public", "ArefRuqaa-Bold.ttf");
const FALLBACK_FONT_PATH = path.join(process.cwd(), "public", "Tajawal-Bold.ttf");
const CARD_TEMPLATES = {
  classic: path.join(process.cwd(), "public", "eid.jpeg"),
  design1: path.join(process.cwd(), "public", "eid1.jpeg"),
  design2: path.join(process.cwd(), "public", "eid2.jpeg"),
} as const;
type CardTemplateKey = keyof typeof CARD_TEMPLATES;
const TEXT_COLOR = "#1b4f94";
const PRIMARY_FONT_FAMILY = "Aref Ruqaa";
const FALLBACK_FONT_FAMILY = "Tajawal";
const FONT_SIZE = 52;
const DESIGN_TEXT_CONFIG: Record<CardTemplateKey, { positionFromTop: number; fontSize: number; textColor: string }> = {
  classic: { positionFromTop: 0.73, fontSize: 52, textColor: "#1b4f94" },
  design1: { positionFromTop: 0.52, fontSize: 46, textColor: "#2c4f79" },
  design2: { positionFromTop: 0.80, fontSize: 52, textColor: "#d7c39a" },
};
const MAX_NAME_LENGTH = 60;
const MIN_NAME_LENGTH = 2;
const TRANSLATION_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const RATE_LIMIT_WINDOW_MS = 1000 * 60;
const RATE_LIMIT_MAX_REQUESTS = 8;

let fontRegistered = false;
let activeFontFamily = FALLBACK_FONT_FAMILY;
const translationCache = new Map<string, { value: string; expiresAt: number }>();
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function ensureFontRegistered() {
  if (fontRegistered) return;
  if (fs.existsSync(PRIMARY_FONT_PATH)) {
    registerFont(PRIMARY_FONT_PATH, { family: PRIMARY_FONT_FAMILY, weight: "bold" });
    activeFontFamily = PRIMARY_FONT_FAMILY;
    fontRegistered = true;
    return;
  }
  if (fs.existsSync(FALLBACK_FONT_PATH)) {
    registerFont(FALLBACK_FONT_PATH, { family: FALLBACK_FONT_FAMILY, weight: "bold" });
    activeFontFamily = FALLBACK_FONT_FAMILY;
    fontRegistered = true;
  }
}

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LATIN_REGEX = /[A-Za-z]/;
const VALID_NAME_REGEX = /^[A-Za-z\u0600-\u06FF\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isArabic(text: string): boolean {
  return ARABIC_REGEX.test(text);
}

function transliterateEnglishToArabic(text: string): string {
  let normalized = text.toLowerCase();

  // Handle common digraphs first for better phonetic output.
  const digraphs: Array<[string, string]> = [
    ["sh", "ش"],
    ["kh", "خ"],
    ["gh", "غ"],
    ["th", "ث"],
    ["dh", "ذ"],
    ["ch", "تش"],
    ["ph", "ف"],
    ["ou", "و"],
  ];

  for (const [latin, arabic] of digraphs) {
    normalized = normalized.replaceAll(latin, arabic);
  }

  const charMap: Record<string, string> = {
    a: "ا",
    b: "ب",
    c: "ك",
    d: "د",
    e: "ي",
    f: "ف",
    g: "ج",
    h: "ه",
    i: "ي",
    j: "ج",
    k: "ك",
    l: "ل",
    m: "م",
    n: "ن",
    o: "و",
    p: "ب",
    q: "ق",
    r: "ر",
    s: "س",
    t: "ت",
    u: "و",
    v: "ف",
    w: "و",
    x: "كس",
    y: "ي",
    z: "ز",
  };

  return [...normalized]
    .map((ch) => charMap[ch] ?? ch)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(rawName: unknown): string {
  return String(rawName ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateName(name: string): string | null {
  if (!name) return "NAME_REQUIRED";
  if (name.length < MIN_NAME_LENGTH) return "NAME_TOO_SHORT";
  if (name.length > MAX_NAME_LENGTH) return "NAME_TOO_LONG";
  if (!VALID_NAME_REGEX.test(name)) return "NAME_INVALID_CHARACTERS";
  return null;
}

function normalizeEmail(rawEmail: unknown): string {
  return String(rawEmail ?? "").trim().toLowerCase();
}

function validateEmail(email: string): string | null {
  if (!email) return "EMAIL_REQUIRED";
  if (!EMAIL_REGEX.test(email)) return "EMAIL_INVALID";
  return null;
}

function getLocalizedError(code: string, lang: string): string {
  const isArabicLang = lang === "ar";
  const dictionary: Record<string, { ar: string; en: string }> = {
    NAME_REQUIRED: { ar: "الاسم مطلوب", en: "Name is required" },
    NAME_TOO_SHORT: { ar: "الاسم قصير جدًا", en: "Name is too short" },
    NAME_TOO_LONG: { ar: "الاسم طويل جدًا", en: "Name is too long" },
    NAME_INVALID_CHARACTERS: { ar: "الاسم يحتوي على أحرف غير مسموحة", en: "Name contains invalid characters" },
    EMAIL_REQUIRED: { ar: "البريد الإلكتروني مطلوب", en: "Email is required" },
    EMAIL_INVALID: { ar: "صيغة البريد الإلكتروني غير صحيحة", en: "Email format is invalid" },
    BOT_DETECTED: { ar: "فشل التحقق من الطلب", en: "Request verification failed" },
    DESIGN_INVALID: { ar: "التصميم المختار غير صالح", en: "Selected design is invalid" },
    RATE_LIMITED: { ar: "محاولات كثيرة، حاول مرة أخرى بعد دقيقة", en: "Too many requests, try again in a minute" },
    RENDER_FAILED: { ar: "تعذر إنشاء البطاقة، حاول مرة أخرى", en: "Failed to generate card, please try again" },
  };
  const entry = dictionary[code] ?? dictionary.RENDER_FAILED;
  return isArabicLang ? entry.ar : entry.en;
}

function getClientIdentifier(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return req.headers.get("x-real-ip") ?? "unknown-client";
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(clientId);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function drawFallbackTemplate(width: number, height: number) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#f8fbff");
  grad.addColorStop(1, "#dbeaf9");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#1b5f93";
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.fillStyle = "#1b5f93";
  ctx.font = 'bold 72px "Arial", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("Eid Mubarak", width / 2, height * 0.2);
  return canvas;
}

async function getArabicName(name: string): Promise<string> {
  if (isArabic(name)) return name;
  const cacheKey = name.toLowerCase();
  const cached = translationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const res = await translate(name, { from: "auto", to: "ar" });
    if (isArabic(res.text)) {
      translationCache.set(cacheKey, {
        value: res.text,
        expiresAt: Date.now() + TRANSLATION_CACHE_TTL_MS,
      });
      return res.text;
    }
  } catch {
    // Continue to fallback logic below.
  }

  try {
    const res = await translate(name, { from: "en", to: "ar" });
    if (isArabic(res.text)) {
      translationCache.set(cacheKey, {
        value: res.text,
        expiresAt: Date.now() + TRANSLATION_CACHE_TTL_MS,
      });
      return res.text;
    }
  } catch {
    // Continue to fallback logic below.
  }

  if (LATIN_REGEX.test(name)) {
    const transliterated = transliterateEnglishToArabic(name);
    translationCache.set(cacheKey, {
      value: transliterated,
      expiresAt: Date.now() + TRANSLATION_CACHE_TTL_MS,
    });
    return transliterated;
  }

  return name;
}

async function generateCardImage(name: string, design: CardTemplateKey): Promise<Buffer> {
  ensureFontRegistered();
  let canvas = createCanvas(1600, 1000);
  const templatePath = CARD_TEMPLATES[design];

  if (fs.existsSync(templatePath)) {
    const img = await loadImage(templatePath);
    canvas = createCanvas(img.width, img.height);
    const imageCtx = canvas.getContext("2d");
    imageCtx.drawImage(img, 0, 0);
  } else {
    canvas = drawFallbackTemplate(1600, 1000);
  }

  const renderCtx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const designConfig = DESIGN_TEXT_CONFIG[design];
  let fontSize = designConfig.fontSize;

  renderCtx.fillStyle = designConfig.textColor || TEXT_COLOR;
  renderCtx.font = `bold ${fontSize}px "${activeFontFamily}", "${FALLBACK_FONT_FAMILY}", "Arial", sans-serif`;
  renderCtx.direction = "rtl";
  renderCtx.textAlign = "center";

  const maxWidth = w * 0.55;
  while (fontSize > 28 && renderCtx.measureText(name).width > maxWidth) {
    fontSize -= 2;
    renderCtx.font = `bold ${fontSize}px "${activeFontFamily}", "${FALLBACK_FONT_FAMILY}", "Arial", sans-serif`;
  }

  const x = w / 2;
  const y = h * designConfig.positionFromTop;

  renderCtx.fillText(name, x, y);

  return canvas.toBuffer("image/png");
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { name, email, lang, website, design } = await req.json();
    const language = lang === "ar" ? "ar" : "en";
    const selectedDesign = (design ?? "classic") as string;

    if (website) {
      return NextResponse.json(
        { error: getLocalizedError("BOT_DETECTED", language), code: "BOT_DETECTED", requestId },
        { status: 400 }
      );
    }

    const clientId = getClientIdentifier(req);
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: getLocalizedError("RATE_LIMITED", language), code: "RATE_LIMITED", requestId },
        { status: 429 }
      );
    }

    const normalizedName = normalizeName(name);
    const validationCode = validateName(normalizedName);
    if (validationCode) {
      return NextResponse.json(
        { error: getLocalizedError(validationCode, language), code: validationCode, requestId },
        { status: 400 }
      );
    }
    const normalizedEmail = normalizeEmail(email);
    const emailValidationCode = validateEmail(normalizedEmail);
    if (emailValidationCode) {
      return NextResponse.json(
        { error: getLocalizedError(emailValidationCode, language), code: emailValidationCode, requestId },
        { status: 400 }
      );
    }
    if (!(selectedDesign in CARD_TEMPLATES)) {
      return NextResponse.json(
        { error: getLocalizedError("DESIGN_INVALID", language), code: "DESIGN_INVALID", requestId },
        { status: 400 }
      );
    }

    const arabicName = await getArabicName(normalizedName);
    const imageBuffer = await generateCardImage(arabicName, selectedDesign as CardTemplateKey);
    const base64Image = imageBuffer.toString("base64");
    const imageId = crypto.randomUUID();
    saveGeneratedCard(imageId, imageBuffer);
    try {
      const sheetResult = await appendGenerationRecord({
        timestamp: new Date().toISOString(),
        name: normalizedName,
        email: normalizedEmail,
        arabicName,
        language,
        requestId,
      });

      if (!sheetResult.inserted && sheetResult.reason === "DUPLICATE_EMAIL") {
        console.info(
          JSON.stringify({
            level: "info",
            message: "Skipped duplicate email in Google Sheets",
            requestId,
            email: normalizedEmail,
          })
        );
      }
    } catch (sheetError) {
      console.error(
        JSON.stringify({
          level: "warn",
          message: "Failed to append generation record to Google Sheets",
          requestId,
          error: sheetError instanceof Error ? sheetError.message : "Unknown error",
        })
      );
    }

    return NextResponse.json(
      {
        success: true,
        arabicName,
        imageData: `data:image/png;base64,${base64Image}`,
        imageUrl: `/api/card/${imageId}`,
        requestId,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Card generation failed",
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );
    return NextResponse.json(
      {
        error: "Failed to generate card. Please try again.",
        code: "RENDER_FAILED",
        requestId,
      },
      { status: 500 }
    );
  }
}
