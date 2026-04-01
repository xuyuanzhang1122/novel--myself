import { NextResponse } from "next/server";
import { getUser, prisma } from "@xu-novel/lib";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { novelId, chapterId, anchorId, fallbackProgress } = body;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    if (!novelId || !chapterId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.readingHistory.upsert({
      where: { userId_novelId: { userId: user.id, novelId } },
      update: {
        chapterId,
        anchorId,
        fallbackProgress,
      },
      create: {
        userId: user.id,
        novelId,
        chapterId,
        anchorId,
        fallbackProgress,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reading-progress] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
