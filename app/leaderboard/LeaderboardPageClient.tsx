"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Crown,
    TrendingUp,
    TrendingDown,
    Minus,
    User,
    Trophy,
    ArrowLeft,
    Medal,
    Flame,
    Calendar,
    Clock,
    Infinity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

interface Game {
    id: string;
    name: string;
    color: string;
}

interface LeaderboardPageClientProps {
    entries: LeaderboardEntry[];
    userRank: {
        rank: number | null;
        score: number;
        percentile: number | null;
        totalPlayers: number;
    } | null;
    currentUserId: string;
    games: Game[];
    periods: readonly string[];
    selectedGame: string;
    selectedPeriod: string;
    totalPlayers: number;
}

const periodIcons: Record<string, React.ReactNode> = {
    daily: <Calendar className="w-4 h-4" />,
    weekly: <Clock className="w-4 h-4" />,
    monthly: <Flame className="w-4 h-4" />,
    alltime: <Infinity className="w-4 h-4" />,
};

const periodLabels: Record<string, string> = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    alltime: "All Time",
};

const rankColors = {
    1: "from-yellow-400 to-amber-600",
    2: "from-slate-300 to-slate-500",
    3: "from-orange-400 to-orange-700",
};

const rankBgColors = {
    1: "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/50",
    2: "bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/50",
    3: "bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-orange-500/50",
};

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-12 h-12 flex items-center justify-center relative"
            >
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg animate-pulse" />
                <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
            </motion.div>
        );
    }
    if (rank === 2) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-12 h-12 flex items-center justify-center"
            >
                <Crown className="w-7 h-7 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]" />
            </motion.div>
        );
    }
    if (rank === 3) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-12 h-12 flex items-center justify-center"
            >
                <Crown className="w-6 h-6 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]" />
            </motion.div>
        );
    }
    return (
        <div className="w-12 h-12 flex items-center justify-center">
            <span className={cn(
                "font-bold text-lg",
                rank <= 10 ? "text-white" : "text-slate-400"
            )}>
                #{rank}
            </span>
        </div>
    );
}

function RankChange({ current, previous }: { current: number; previous: number | null }) {
    if (previous === null || previous === current) {
        return <Minus className="w-4 h-4 text-slate-500" />;
    }
    const diff = previous - current;
    if (diff > 0) {
        return (
            <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-1 text-green-400"
            >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+{diff}</span>
            </motion.div>
        );
    }
    return (
        <motion.div
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-1 text-red-400"
        >
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">{diff}</span>
        </motion.div>
    );
}

export default function LeaderboardPageClient({
    entries,
    userRank,
    currentUserId,
    games,
    periods,
    selectedGame,
    selectedPeriod,
    totalPlayers,
}: LeaderboardPageClientProps) {
    const router = useRouter();

    const handleGameChange = (gameId: string) => {
        router.push(`/leaderboard?game=${gameId}&period=${selectedPeriod}`);
    };

    const handlePeriodChange = (period: string) => {
        router.push(`/leaderboard?game=${selectedGame}&period=${period}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        Leaderboard
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {totalPlayers.toLocaleString()} players competing
                    </p>
                </div>
            </motion.div>

            {/* Game Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2"
            >
                {games.map((game) => (
                    <button
                        key={game.id}
                        onClick={() => handleGameChange(game.id)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            selectedGame === game.id
                                ? `bg-${game.color}-500/20 text-${game.color}-400 border border-${game.color}-500/50`
                                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"
                        )}
                    >
                        {game.name}
                    </button>
                ))}
            </motion.div>

            {/* Period Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-1 p-1 bg-slate-800/50 rounded-lg w-fit"
            >
                {periods.map((period) => (
                    <button
                        key={period}
                        onClick={() => handlePeriodChange(period)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                            selectedPeriod === period
                                ? "bg-blue-500 text-white shadow-lg"
                                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                        )}
                    >
                        {periodIcons[period]}
                        {periodLabels[period]}
                    </button>
                ))}
            </motion.div>

            {/* User's Rank Card */}
            {userRank && userRank.rank && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/50 flex items-center justify-center">
                                <User className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Your Position</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">#{userRank.rank}</span>
                                    <span className="text-slate-400">
                                        of {userRank.totalPlayers.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <p className="text-slate-400 text-sm">Score</p>
                                <p className="text-2xl font-bold text-white">
                                    {userRank.score.toLocaleString()}
                                </p>
                            </div>
                            {userRank.percentile !== null && (
                                <div className="text-center">
                                    <p className="text-slate-400 text-sm">Top</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        {Math.max(1, Math.round(100 - userRank.percentile))}%
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Leaderboard List */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="space-y-2"
            >
                <AnimatePresence mode="popLayout">
                    {entries.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-400 mb-2">
                                No Rankings Yet
                            </h3>
                            <p className="text-slate-500 mb-4">
                                Be the first to compete in this category!
                            </p>
                            <Link href="/">
                                <Button className="bg-blue-500 hover:bg-blue-600">
                                    Play Now
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        entries.map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                layout
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30 }}
                                transition={{ delay: index * 0.03 }}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                    entry.userId === currentUserId
                                        ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20"
                                        : entry.rank && entry.rank <= 3
                                            ? rankBgColors[entry.rank as 1 | 2 | 3]
                                            : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
                                )}
                            >
                                {/* Rank */}
                                <RankBadge rank={entry.rank || index + 1} />

                                {/* Avatar */}
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                                        entry.rank && entry.rank <= 3
                                            ? `bg-gradient-to-br ${rankColors[entry.rank as 1 | 2 | 3]}`
                                            : "bg-slate-700"
                                    )}
                                >
                                    {entry.userAvatar ? (
                                        <img
                                            src={entry.userAvatar}
                                            alt={entry.userName || "Player"}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-6 h-6 text-white" />
                                    )}
                                </div>

                                {/* Name & Level */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={cn(
                                            "font-semibold truncate",
                                            entry.userId === currentUserId
                                                ? "text-blue-300"
                                                : entry.rank === 1
                                                    ? "text-yellow-300"
                                                    : "text-white"
                                        )}
                                    >
                                        {entry.userName || "Anonymous"}
                                        {entry.userId === currentUserId && (
                                            <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full ml-2">
                                                You
                                            </span>
                                        )}
                                    </p>
                                    {entry.userLevel && (
                                        <p className="text-sm text-slate-400">
                                            Level {entry.userLevel}
                                        </p>
                                    )}
                                </div>

                                {/* Score & Change */}
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <motion.p
                                            key={entry.score}
                                            initial={{ scale: 1.1 }}
                                            animate={{ scale: 1 }}
                                            className={cn(
                                                "text-xl font-bold",
                                                entry.rank === 1
                                                    ? "text-yellow-400"
                                                    : entry.rank === 2
                                                        ? "text-slate-300"
                                                        : entry.rank === 3
                                                            ? "text-orange-400"
                                                            : "text-white"
                                            )}
                                        >
                                            {entry.score.toLocaleString()}
                                        </motion.p>
                                        <p className="text-xs text-slate-500">points</p>
                                    </div>
                                    <RankChange
                                        current={entry.rank || index + 1}
                                        previous={entry.previousRank}
                                    />
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
