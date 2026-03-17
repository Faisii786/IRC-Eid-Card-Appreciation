import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import translate from "google-translate-api-x";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const FONT_PATH = path.join(process.cwd(), "public", "Tajawal-Bold.ttf");
const IMAGE_PATH = path.join(process.cwd(), "public", "eid.jpeg");
const TEXT_COLOR = "#1b4f94";
const FONT_FAMILY = "Tajawal";
const FONT_SIZE = 52;
const RIGHT_PADDING = 40;
const POSITION_FROM_TOP = 0.72;

let fontRegistered = false;

function ensureFontRegistered() {
  if (fontRegistered) return;
  if (fs.existsSync(FONT_PATH)) {
    registerFont(FONT_PATH, { family: FONT_FAMILY, weight: "bold" });
    fontRegistered = true;
  }
}

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function isArabic(text: string): boolean {
  return ARABIC_REGEX.test(text);
}

async function getArabicName(name: string, lang: string): Promise<string> {
  if (lang === "ar" || isArabic(name)) return name;

  try {
    const res = await translate(name, { from: "en", to: "ar" });
    return res.text;
  } catch {
    return name;
  }
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
  ctx.font = `bold ${FONT_SIZE}px "${FONT_FAMILY}", "Arial", sans-serif`;
  ctx.direction = "rtl";
  ctx.textAlign = "right";

  const x = w - RIGHT_PADDING;
  const y = h * POSITION_FROM_TOP;

  ctx.fillText(name, x, y);

  return canvas.toBuffer("image/png");
}

async function sendEmail(
  to: string,
  recipientName: string,
  imageBuffer: Buffer
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "عيد مبارك - Eid Mubarak! 🌙",
    html: `
      <div style="text-align:center; font-family:Arial,sans-serif; direction:rtl;">
        <h1 style="color:#1b4f94;">عيد مبارك</h1>
        <p style="font-size:18px;">${recipientName} :عزيزي</p>
        <p style="font-size:16px;">نهنئكم بمناسبة حلول عيد الفطر المبارك</p>
        <p style="font-size:14px; color:#666;">تجدون بطاقة التهنئة الخاصة بكم في المرفقات</p>
      </div>
    `,
    attachments: [
      {
        filename: "eid-card.png",
        content: imageBuffer,
        cid: "eidcard",
      },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, lang } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: lang === "ar" ? "الاسم والبريد مطلوبان" : "Name and email are required" },
        { status: 400 }
      );
    }

    const arabicName = await getArabicName(name, lang || "ar");
    const imageBuffer = await generateCardImage(arabicName);

    const base64Image = imageBuffer.toString("base64");

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendEmail(email, arabicName, imageBuffer);
    }

    return NextResponse.json({
      success: true,
      arabicName,
      image: `data:image/png;base64,${base64Image}`,
      emailSent: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    });
  } catch (error) {
    console.error("Error generating card:", error);
    return NextResponse.json(
      { error: "Failed to generate card. Please try again." },
      { status: 500 }
    );
  }
}
