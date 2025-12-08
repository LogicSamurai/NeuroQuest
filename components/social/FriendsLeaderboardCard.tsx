"use client";

import { motion } from "framer-motion";
import { Users, Trophy, Crown, Medal, TrendingUp, TrendingDown, Minus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FriendLeaderboardEntry {
    userId: string | null;
    userName: string | null;
    userAvatar: string | null;
    userLevel: number | null;
    score: number;
    rank: number | null;
    friendRank: number;
    isCurrentUser: boolean;
}

interface FriendsLeaderboardCardProps {
    entries: FriendLeaderboardEntry[];
    gameId: string;
    title?: string;
}

export default function FriendsLeaderboardCard({
    entries,
    gameId,
    title = "Friends Leaderboard",
}: FriendsLeaderboardCardProps) {
    if (entries.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <div className="text-center py-6">
                    <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                    <p className="text-slate-400 text-sm">Add friends to see how you compare!</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <Link
                    href={`/leaderboard?game=${gameId}&filter=friends`}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                    View All →
                </Link>
            </div>

            {/* Leaderboard */}
            <div className="space-y-2">
                {entries.slice(0, 5).map((entry, index) => (
                    <motion.div
                        key={entry.userId || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg transition-colors",
                            entry.isCurrentUser
                                ? "bg-purple-500/20 border border-purple-500/30"
                                : "hover:bg-slate-700/30"
                        )}
                    >
                        {/* Rank */}
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            entry.friendRank === 1 ? "bg-yellow-500 text-yellow-900" :
                                entry.friendRank === 2 ? "bg-slate-300 text-slate-700" :
                                    entry.friendRank === 3 ? "bg-orange-500 text-orange-900" :
                                        "bg-slate-700 text-slate-400"
                        )}>
                            {entry.friendRank === 1 ? <Crown className="w-4 h-4" /> :
                                entry.friendRank === 2 ? <Medal className="w-4 h-4" /> :
                                    entry.friendRank === 3 ? <Trophy className="w-4 h-4" /> :
                                        entry.friendRank}
                        </div>

                        {/* Avatar */}
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                            entry.isCurrentUser
                                ? "bg-gradient-to-br from-purple-500 to-pink-500"
                                : "bg-gradient-to-br from-blue-500 to-cyan-500"
                        )}>
                            {entry.isCurrentUser ? (
                                <User className="w-5 h-5" />
                            ) : (
                                entry.userName?.charAt(0) || '?'
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className={cn(
                                "font-medium truncate",
                                entry.isCurrentUser ? "text-purple-300" : "text-white"
                            )}>
                                {entry.isCurrentUser ? "You" : entry.userName}
                            </p>
                            <p className="text-xs text-slate-400">
                                Lv.{entry.userLevel || 1}
                            </p>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                            <p className="font-bold text-white">
                                {entry.score.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400">pts</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Motivational message */}
            {entries.length > 0 && entries[0].isCurrentUser && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-yellow-400 mt-4"
                >
                    🏆 You&apos;re #1 among friends!
                </motion.p>
            )}
            {entries.length > 0 && !entries[0].isCurrentUser && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-slate-400 mt-4"
                >
                    {entries[0].userName} is ahead by {(entries[0].score - (entries.find(e => e.isCurrentUser)?.score || 0)).toLocaleString()} pts
                </motion.p>
            )}
        </motion.div>
    );
}
