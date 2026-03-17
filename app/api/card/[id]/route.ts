import { NextRequest, NextResponse } from "next/server";
import { getGeneratedCard } from "@/lib/generatedCardsStore";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const imageBuffer = getGeneratedCard(id);

  if (!imageBuffer) {
    return NextResponse.json({ error: "Card not found or expired" }, { status: 404 });
  }

  return new NextResponse(imageBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=600, immutable",
    },
  });
}
