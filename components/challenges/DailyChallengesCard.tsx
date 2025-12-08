"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Clock, CheckCircle2, Sparkles, Flame, Zap, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Challenge {
    id: string;
    type: string;
    gameId: string | null;
    targetValue: number;
    description: string;
    xpReward: number;
    currentProgress: number;
    completed: boolean;
}

interface DailyChallengesCardProps {
    challenges: Challenge[];
    timeUntilRefresh: { hours: number; minutes: number; seconds: number };
}

const gameIcons: Record<string, React.ReactNode> = {
    'zip-path': <Grid3X3 className="w-4 h-4" />,
    'alchemy-logic': <Sparkles className="w-4 h-4" />,
    'stroop-dash': <Zap className="w-4 h-4" />,
};

const gameColors: Record<string, string> = {
    'zip-path': 'text-cyan-400 bg-cyan-500/20',
    'alchemy-logic': 'text-purple-400 bg-purple-500/20',
    'stroop-dash': 'text-rose-400 bg-rose-500/20',
};

export default function DailyChallengesCard({
    challenges,
    timeUntilRefresh,
}: DailyChallengesCardProps) {
    const [countdown, setCountdown] = useState(timeUntilRefresh);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                let { hours, minutes, seconds } = prev;
                seconds -= 1;
                if (seconds < 0) {
                    seconds = 59;
                    minutes -= 1;
                }
                if (minutes < 0) {
                    minutes = 59;
                    hours -= 1;
                }
                if (hours < 0) {
                    // Refresh page to get new challenges
                    window.location.reload();
                    return { hours: 0, minutes: 0, seconds: 0 };
                }
                return { hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const completedCount = challenges.filter(c => c.completed).length;
    const totalXp = challenges.reduce((acc, c) => acc + (c.completed ? c.xpReward : 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                        <Flame className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Daily Challenges</h3>
                        <p className="text-xs text-slate-400">
                            {completedCount}/{challenges.length} Complete
                        </p>
                    </div>
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-mono">
                        {String(countdown.hours).padStart(2, '0')}:
                        {String(countdown.minutes).padStart(2, '0')}:
                        {String(countdown.seconds).padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedCount / challenges.length) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                    />
                </div>
                {totalXp > 0 && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        +{totalXp} XP earned today
                    </p>
                )}
            </div>

            {/* Challenges list */}
            <div className="space-y-3">
                {challenges.map((challenge, index) => (
                    <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "p-3 rounded-lg border transition-all",
                            challenge.completed
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-slate-800/30 border-slate-700/30"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            {/* Status icon */}
                            <div className={cn(
                                "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center",
                                challenge.completed
                                    ? "bg-green-500/20"
                                    : "bg-slate-700/50"
                            )}>
                                {challenge.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Target className="w-4 h-4 text-slate-400" />
                                )}
                            </div>

                            {/* Challenge details */}
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "font-medium text-sm",
                                    challenge.completed ? "text-green-300 line-through" : "text-white"
                                )}>
                                    {challenge.description}
                                </p>

                                {/* Progress bar for incomplete challenges */}
                                {!challenge.completed && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                            <span>{challenge.currentProgress} / {challenge.targetValue}</span>
                                            <span>{Math.round((challenge.currentProgress / challenge.targetValue) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min((challenge.currentProgress / challenge.targetValue) * 100, 100)}%`
                                                }}
                                                className="h-full bg-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Game badge */}
                                {challenge.gameId && (
                                    <div className={cn(
                                        "inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-xs",
                                        gameColors[challenge.gameId] || "text-slate-400 bg-slate-700/50"
                                    )}>
                                        {gameIcons[challenge.gameId]}
                                        <span className="capitalize">
                                            {challenge.gameId.replace(/-/g, ' ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* XP Reward */}
                            <div className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                challenge.completed
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-slate-700/50 text-slate-400"
                            )}>
                                +{challenge.xpReward} XP
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* All complete celebration */}
            {completedCount === challenges.length && challenges.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center"
                >
                    <p className="text-green-400 font-medium flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        All challenges complete! Come back tomorrow for more.
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
