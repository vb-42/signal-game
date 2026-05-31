import type { LeaderboardEntry } from "@/lib/db";
import LeaderboardShell from "@/components/LeaderboardShell";

async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  try {
    const { getLeaderboard, initDb } = await import("@/lib/db");
    await initDb();
    return await getLeaderboard();
  } catch {
    return [];
  }
}

export const revalidate = 30;

export default async function LeaderboardPage() {
  const entries = await getLeaderboardData();
  return <LeaderboardShell entries={entries} />;
}
