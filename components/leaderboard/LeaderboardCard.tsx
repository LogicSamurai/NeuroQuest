"use client";

import { motion } from "framer-motion";
import { Crown, TrendingUp, TrendingDown, Minus, User, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LeaderboardEntry {
    id: string;
    userId: string;
    userName: string | null;
    userAvatar: string | null;
    userLevel: number | null;
    score: number;
    rank: number | null;
    percentile: number | null;
    previousRank: number | null;
}

interface LeaderboardCardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
    userRank?: {
        rank: number | null;
        score: number;
        percentile: number | null;
        totalPlayers: number;
    };
    gameId?: string;
    title?: string;
    showViewAll?: boolean;
}

const rankColors = {
    1: "from-yellow-400 to-amber-600", // Gold
    2: "from-slate-300 to-slate-500", // Silver
    3: "from-orange-400 to-orange-700", // Bronze
};

const rankBgColors = {
    1: "bg-yellow-500/20 border-yellow-500/50",
    2: "bg-slate-400/20 border-slate-400/50",
    3: "bg-orange-500/20 border-orange-500/50",
};

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-8 h-8 flex items-center justify-center"
            >
                <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            </motion.div>
        );
    }
    if (rank === 2) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 flex items-center justify-center"
            >
                <Crown className="w-5 h-5 text-slate-300" />
            </motion.div>
        );
    }
    if (rank === 3) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 flex items-center justify-center"
            >
                <Crown className="w-5 h-5 text-orange-400" />
            </motion.div>
        );
    }
    return (
        <div className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-sm">
            #{rank}
        </div>
    );
}

function RankChange({ current, previous }: { current: number; previous: number | null }) {
    if (previous === null || previous === current) {
        return <Minus className="w-3 h-3 text-slate-500" />;
    }
    if (current < previous) {
        return (
            <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center text-green-400"
            >
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs ml-0.5">+{previous - current}</span>
            </motion.div>
        );
    }
    return (
        <motion.div
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center text-red-400"
        >
            <TrendingDown className="w-3 h-3" />
            <span className="text-xs ml-0.5">-{current - previous}</span>
        </motion.div>
    );
}

export default function LeaderboardCard({
    entries,
    currentUserId,
    userRank,
    gameId = "combined",
    title = "Top Players",
    showViewAll = true,
}: LeaderboardCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                {showViewAll && (
                    <Link
                        href={`/leaderboard?game=${gameId}`}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        View All →
                    </Link>
                )}
            </div>

            {/* Current user's rank */}
            {userRank && userRank.rank && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-300">Your Rank</p>
                                <p className="text-xl font-bold text-white">
                                    #{userRank.rank}
                                    <span className="text-sm font-normal text-slate-400 ml-2">
                                        of {userRank.totalPlayers.toLocaleString()}
                                    </span>
                                </p>
                            </div>
                        </div>
                        {userRank.percentile !== null && (
                            <div className="text-right">
                                <p className="text-sm text-slate-400">Top</p>
                                <p className="text-lg font-bold text-green-400">
                                    {Math.max(1, Math.round(100 - userRank.percentile))}%
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Leaderboard entries */}
            <div className="space-y-2">
                {entries.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No entries yet. Be the first!</p>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                entry.userId === currentUserId
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : entry.rank && entry.rank <= 3
                                        ? rankBgColors[entry.rank as 1 | 2 | 3]
                                        : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
                            )}
                        >
                            {/* Rank */}
                            <RankBadge rank={entry.rank || index + 1} />

                            {/* Avatar */}
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                entry.rank && entry.rank <= 3
                                    ? `bg-gradient-to-br ${rankColors[entry.rank as 1 | 2 | 3]}`
                                    : "bg-slate-700"
                            )}>
                                {entry.userAvatar ? (
                                    <img
                                        src={entry.userAvatar}
                                        alt={entry.userName || "Player"}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-white" />
                                )}
                            </div>

                            {/* Name & Level */}
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "font-medium truncate",
                                    entry.userId === currentUserId ? "text-blue-300" : "text-white"
                                )}>
                                    {entry.userName || "Anonymous"}
                                    {entry.userId === currentUserId && (
                                        <span className="text-xs text-blue-400 ml-1">(You)</span>
                                    )}
                                </p>
                                {entry.userLevel && (
                                    <p className="text-xs text-slate-400">Level {entry.userLevel}</p>
                                )}
                            </div>

                            {/* Score */}
                            <div className="text-right">
                                <motion.p
                                    key={entry.score}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    className={cn(
                                        "font-bold",
                                        entry.rank === 1 ? "text-yellow-400 text-lg" :
                                            entry.rank === 2 ? "text-slate-300" :
                                                entry.rank === 3 ? "text-orange-400" :
                                                    "text-white"
                                    )}
                                >
                                    {entry.score.toLocaleString()}
                                </motion.p>
                                <RankChange current={entry.rank || index + 1} previous={entry.previousRank} />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
