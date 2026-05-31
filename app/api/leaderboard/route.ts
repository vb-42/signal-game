import { z } from "zod";
import { NextResponse } from "next/server";
import { getLeaderboard, insertLeaderboardEntry, initDb } from "@/lib/db";

const UsernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required")
  .max(50, "Username must be 50 characters or fewer")
  .regex(/^[a-zA-Z0-9 _\-'.]+$/, "Username contains invalid characters");

const PostBodySchema = z.object({
  username: UsernameSchema,
  completedSignals: z.number().int().min(0).max(12),
  totalAttempts: z.number().int().min(0),
});

export type PostLeaderboardBody = z.infer<typeof PostBodySchema>;

export const LeaderboardEntrySchema = z.object({
  id: z.number(),
  username: z.string(),
  completed_signals: z.number(),
  total_attempts: z.number(),
  completed_at: z.string(),
});

export type LeaderboardEntryResponse = z.infer<typeof LeaderboardEntrySchema>;

export async function GET() {
  try {
    await initDb();
    const entries = await getLeaderboard();
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = PostBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.completedSignals !== 12) {
      return NextResponse.json(
        { error: "Only full 12/12 completions can be submitted" },
        { status: 400 }
      );
    }

    await initDb();
    const entry = await insertLeaderboardEntry(
      parsed.data.username,
      parsed.data.completedSignals,
      parsed.data.totalAttempts
    );
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("POST /api/leaderboard error:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
