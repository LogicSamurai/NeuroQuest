"use client";

import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelProgressBarProps {
    level: number;
    currentXp: number;
    xpForNextLevel: number;
    progress: number;
    compact?: boolean;
    showXpGain?: number;
    className?: string;
}

export default function LevelProgressBar({
    level,
    currentXp,
    xpForNextLevel,
    progress,
    compact = false,
    showXpGain,
    className,
}: LevelProgressBarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("relative", className)}
        >
            {compact ? (
                // Compact version for header
                <div className="flex items-center gap-3">
                    {/* Level badge */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative"
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                            level >= 50 ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" :
                                level >= 30 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" :
                                    level >= 10 ? "bg-gradient-to-br from-blue-400 to-cyan-500 text-white" :
                                        "bg-slate-700 text-slate-300"
                        )}>
                            {level}
                        </div>
                        {level >= 50 && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-1 rounded-full border-2 border-dashed border-purple-400/50"
                            />
                        )}
                    </motion.div>

                    {/* XP bar */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span>Level {level}</span>
                            <span className="flex items-center gap-1">
                                {currentXp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                                {showXpGain && (
                                    <motion.span
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-green-400 ml-1"
                                    >
                                        +{showXpGain}
                                    </motion.span>
                                )}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={cn(
                                    "h-full",
                                    level >= 50 ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                                        level >= 30 ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
                                            "bg-gradient-to-r from-blue-500 to-cyan-400"
                                )}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // Full version for profile/level up modal
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-4 mb-4">
                        {/* Level badge - larger */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                        >
                            <div className={cn(
                                "w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold",
                                level >= 50 ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]" :
                                    level >= 30 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-[0_0_25px_rgba(251,191,36,0.4)]" :
                                        level >= 10 ? "bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" :
                                            "bg-slate-700 text-slate-300"
                            )}>
                                <span className="text-3xl">{level}</span>
                                <span className="text-xs opacity-80">LEVEL</span>
                            </div>
                            {level >= 50 && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-2 rounded-2xl border-2 border-dashed border-purple-400/50"
                                />
                            )}
                        </motion.div>

                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">
                                Level {level}
                                {level >= 50 && (
                                    <span className="ml-2 text-sm font-normal text-purple-400">
                                        ✦ Prestige
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {xpForNextLevel - currentXp} XP to next level
                            </p>
                        </div>

                        {/* XP display */}
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-2xl font-bold">
                                    {currentXp.toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                / {xpForNextLevel.toLocaleString()} XP
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative">
                        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={cn(
                                    "h-full relative",
                                    level >= 50 ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                                        level >= 30 ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
                                            "bg-gradient-to-r from-blue-500 to-cyan-400"
                                )}
                            >
                                {/* Shimmer effect */}
                                <motion.div
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                />
                            </motion.div>
                        </div>

                        {/* Progress percentage */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-lg"
                        >
                            {Math.round(progress)}%
                        </motion.div>
                    </div>

                    {/* XP gain animation */}
                    {showXpGain && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 flex items-center justify-center gap-2 text-green-400"
                        >
                            <Star className="w-4 h-4" />
                            <span className="font-bold">+{showXpGain} XP</span>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
