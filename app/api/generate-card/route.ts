import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import translate from "google-translate-api-x";
import path from "path";
import fs from "fs";

const PRIMARY_FONT_PATH = path.join(process.cwd(), "public", "ArefRuqaa-Bold.ttf");
const FALLBACK_FONT_PATH = path.join(process.cwd(), "public", "Tajawal-Bold.ttf");
const IMAGE_PATH = path.join(process.cwd(), "public", "eid.jpeg");
const TEXT_COLOR = "#1b4f94";
const PRIMARY_FONT_FAMILY = "Aref Ruqaa";
const FALLBACK_FONT_FAMILY = "Tajawal";
const FONT_SIZE = 52;
const POSITION_FROM_TOP = 0.73;

let fontRegistered = false;
let activeFontFamily = FALLBACK_FONT_FAMILY;

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

async function getArabicName(name: string): Promise<string> {
  if (isArabic(name)) return name;

  try {
    const res = await translate(name, { from: "auto", to: "ar" });
    if (isArabic(res.text)) return res.text;
  } catch {
    // Continue to fallback logic below.
  }

  try {
    const res = await translate(name, { from: "en", to: "ar" });
    if (isArabic(res.text)) return res.text;
  } catch {
    // Continue to fallback logic below.
  }

  if (LATIN_REGEX.test(name)) {
    return transliterateEnglishToArabic(name);
  }

  return name;
}

async function generateCardImage(name: string): Promise<Buffer> {
  ensureFontRegistered();

  const img = await loadImage(IMAGE_PATH);
  const w = img.width;
  const h = img.height;

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${FONT_SIZE}px "${activeFontFamily}", "${FALLBACK_FONT_FAMILY}", "Arial", sans-serif`;
  ctx.direction = "rtl";
  ctx.textAlign = "center";

  const x = w / 2;
  const y = h * POSITION_FROM_TOP;

  ctx.fillText(name, x, y);

  return canvas.toBuffer("image/png");
}

export async function POST(req: NextRequest) {
  try {
    const { name, lang } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: lang === "ar" ? "الاسم مطلوب" : "Name is required" },
        { status: 400 }
      );
    }

    const normalizedName = String(name).trim();
    const arabicName = await getArabicName(normalizedName);
    const imageBuffer = await generateCardImage(arabicName);

    const base64Image = imageBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      arabicName,
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("Error generating card:", error);
    return NextResponse.json(
      { error: "Failed to generate card. Please try again." },
      { status: 500 }
    );
  }
}
