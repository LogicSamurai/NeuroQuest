import { Suspense } from "react";
import LeaderboardPageClient from "./LeaderboardPageClient";
import { getLeaderboard, getUserRank, getGlobalStats } from "@/db/queries/leaderboard";

// Define available games
const GAMES = [
    { id: "combined", name: "All Games", color: "purple" },
    { id: "zip-path", name: "Zip Path", color: "cyan" },
    { id: "alchemy-logic", name: "Alchemy Logic", color: "purple" },
    { id: "stroop-dash", name: "Stroop Dash", color: "rose" },
];

const PERIODS = ["daily", "weekly", "monthly", "alltime"] as const;

interface PageProps {
    searchParams: Promise<{ game?: string; period?: string }>;
}

import { getUserId } from "@/app/actions";

// ...

export default async function LeaderboardPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const selectedGame = params.game || "combined";
    const selectedPeriod = (params.period || "alltime") as typeof PERIODS[number];
    const userId = await getUserId();

    // Fetch leaderboard data in parallel
    const [entries, globalStats, userRank] = await Promise.all([
        getLeaderboard(selectedGame, selectedPeriod, 100),
        getGlobalStats(),
        userId ? getUserRank(userId, selectedGame, selectedPeriod) : Promise.resolve(null),
    ]);

    const currentUserId = userId;

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <LeaderboardPageClient
                        entries={entries}
                        userRank={userRank}
                        currentUserId={currentUserId}
                        games={GAMES}
                        periods={PERIODS}
                        selectedGame={selectedGame}
                        selectedPeriod={selectedPeriod}
                        totalPlayers={globalStats.totalPlayers}
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
