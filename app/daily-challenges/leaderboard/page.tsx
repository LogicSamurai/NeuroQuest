import { Suspense } from "react";
import DailyLeaderboardClient from "./DailyLeaderboardClient";
import { getDailyLeaderboard, getUserDailyRank } from "@/db/queries/dailyLeaderboard";
import { getUserId } from "@/app/actions";

// Define available games
const GAMES = [
    { id: "combined", name: "All Games", color: "purple" },
    { id: "zip-path", name: "Zip Path", color: "cyan" },
    { id: "alchemy-logic", name: "Alchemy Logic", color: "purple" },
    // { id: "stroop-dash", name: "Stroop Dash", color: "rose" },
];

interface PageProps {
    searchParams: Promise<{ game?: string }>;
}

export default async function DailyLeaderboardPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const selectedGame = params.game || "combined";
    const userId = await getUserId();
    const today = new Date().toISOString().split('T')[0];

    // Fetch leaderboard data in parallel
    const [entries, userRank] = await Promise.all([
        getDailyLeaderboard(selectedGame === 'combined' ? null : selectedGame, today, 100),
        userId ? getUserDailyRank(userId, selectedGame === 'combined' ? null : selectedGame, today) : Promise.resolve(null),
    ]);

    const currentUserId = userId;

    return (
        <main className="min-h-screen p-4 md:p-8 bg-slate-950">
            <div className="max-w-4xl mx-auto">
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <DailyLeaderboardClient
                        entries={entries}
                        userRank={userRank}
                        currentUserId={currentUserId || ""}
                        games={GAMES}
                        selectedGame={selectedGame}
                        date={today}
                    />
                </Suspense>
            </div>
        </main>
    );
}

function LeaderboardSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-10 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-800/30 rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    );
}
