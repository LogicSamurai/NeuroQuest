"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Flame, Target, TrendingUp, Star, Medal, Calendar, Zap, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklySummaryData {
    weekNumber: number;
    gamesPlayed: number;
    totalScore: number;
    xpEarned: number;
    challengesCompleted: number;
    achievementsUnlocked: number;
    streakDays: number;
    bestGame: {
        name: string;
        score: number;
    } | null;
    highlightAchievement: {
        name: string;
        rarity: string;
    } | null;
    rankChange: number;
    comparedToLastWeek: {
        gamesChange: number;
        scoreChange: number;
        xpChange: number;
    };
}

interface WeeklySummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: WeeklySummaryData;
}

export default function WeeklySummaryModal({
    isOpen,
    onClose,
    data,
}: WeeklySummaryModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-slate-700/50">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
                            >
                                <Calendar className="w-8 h-8 text-white" />
                            </motion.div>

                            <h2 className="text-2xl font-bold text-white text-center">
                                Week {data.weekNumber} Wrap-Up
                            </h2>
                            <p className="text-slate-400 text-center text-sm mt-1">
                                Here&apos;s how you did this week!
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Games Played */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="p-4 rounded-xl bg-slate-800/50"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs text-slate-400">Games Played</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{data.gamesPlayed}</p>
                                    <ChangeIndicator value={data.comparedToLastWeek.gamesChange} />
                                </motion.div>

                                {/* XP Earned */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="p-4 rounded-xl bg-slate-800/50"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-yellow-400" />
                                        <span className="text-xs text-slate-400">XP Earned</span>
                                    </div>
                                    <p className="text-2xl font-bold text-yellow-400">+{data.xpEarned}</p>
                                    <ChangeIndicator value={data.comparedToLastWeek.xpChange} />
                                </motion.div>

                                {/* Total Score */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-4 rounded-xl bg-slate-800/50"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                        <span className="text-xs text-slate-400">Total Score</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{data.totalScore.toLocaleString()}</p>
                                    <ChangeIndicator value={data.comparedToLastWeek.scoreChange} />
                                </motion.div>

                                {/* Streak */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="p-4 rounded-xl bg-slate-800/50"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Flame className="w-4 h-4 text-orange-400" />
                                        <span className="text-xs text-slate-400">Streak Days</span>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-400">{data.streakDays}</p>
                                </motion.div>
                            </div>

                            {/* Highlights */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-3"
                            >
                                {/* Best Game */}
                                {data.bestGame && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                        <div className="flex items-center gap-3">
                                            <Trophy className="w-5 h-5 text-green-400" />
                                            <div>
                                                <p className="text-sm font-medium text-white">Best Performance</p>
                                                <p className="text-xs text-slate-400">{data.bestGame.name}</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-green-400">
                                            {data.bestGame.score.toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {/* Achievement Highlight */}
                                {data.highlightAchievement && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                        <div className="flex items-center gap-3">
                                            <Medal className="w-5 h-5 text-purple-400" />
                                            <div>
                                                <p className="text-sm font-medium text-white">Achievement Unlocked</p>
                                                <p className="text-xs text-slate-400">{data.highlightAchievement.name}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-xs px-2 py-1 rounded-full capitalize",
                                            data.highlightAchievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                                                data.highlightAchievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                        )}>
                                            {data.highlightAchievement.rarity}
                                        </span>
                                    </div>
                                )}

                                {/* Rank Change */}
                                {data.rankChange !== 0 && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                                        <div className="flex items-center gap-3">
                                            <Award className="w-5 h-5 text-yellow-400" />
                                            <p className="text-sm font-medium text-white">Global Rank</p>
                                        </div>
                                        <p className={cn(
                                            "text-lg font-bold",
                                            data.rankChange > 0 ? "text-green-400" : "text-red-400"
                                        )}>
                                            {data.rankChange > 0 ? `↑ ${data.rankChange}` : `↓ ${Math.abs(data.rankChange)}`}
                                        </p>
                                    </div>
                                )}
                            </motion.div>

                            {/* Challenges & Achievements Count */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex justify-center gap-8 pt-4 border-t border-slate-700/50"
                            >
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-cyan-400">{data.challengesCompleted}</p>
                                    <p className="text-xs text-slate-400">Challenges</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-400">{data.achievementsUnlocked}</p>
                                    <p className="text-xs text-slate-400">Achievements</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-800/30 border-t border-slate-700/50">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:from-purple-400 hover:to-blue-400 transition-all"
                            >
                                Let&apos;s Crush Next Week! 💪
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function ChangeIndicator({ value }: { value: number }) {
    if (value === 0) return null;

    return (
        <p className={cn(
            "text-xs mt-1",
            value > 0 ? "text-green-400" : "text-red-400"
        )}>
            {value > 0 ? `+${value}%` : `${value}%`} vs last week
        </p>
    );
}
