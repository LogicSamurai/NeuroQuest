"use client";

import { motion } from "framer-motion";
import { Calendar, Gift, Check, Lock, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardDay {
    day: number;
    xp: number;
    description: string;
    special?: boolean;
}

interface DailyRewardsCalendarProps {
    currentDay: number;
    weekNumber: number;
    rewards: RewardDay[];
    claimed: number[];
    streak: number;
}

export default function DailyRewardsCalendar({
    currentDay,
    weekNumber,
    rewards,
    claimed,
    streak,
}: DailyRewardsCalendarProps) {
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
                        <Calendar className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Weekly Rewards</h3>
                        <p className="text-xs text-slate-400">
                            Week {weekNumber + 1} • Day {currentDay}/7
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-orange-400">🔥 {streak}</p>
                    <p className="text-xs text-slate-400">day streak</p>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {rewards.map((reward, index) => {
                    const isClaimed = claimed.includes(reward.day);
                    const isToday = reward.day === currentDay;
                    const isLocked = reward.day > currentDay;

                    return (
                        <motion.div
                            key={reward.day}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all",
                                isClaimed
                                    ? "bg-green-500/20 border-2 border-green-500/50"
                                    : isToday
                                        ? "bg-orange-500/20 border-2 border-orange-500 animate-pulse"
                                        : isLocked
                                            ? "bg-slate-800/30 border border-slate-700/50 opacity-50"
                                            : "bg-slate-700/30 border border-slate-600/50"
                            )}
                        >
                            {/* Day Label */}
                            <span className={cn(
                                "text-xs font-medium mb-1",
                                isClaimed ? "text-green-400" :
                                    isToday ? "text-orange-400" :
                                        "text-slate-400"
                            )}>
                                Day {reward.day}
                            </span>

                            {/* Icon */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                reward.special
                                    ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                    : isClaimed
                                        ? "bg-green-500"
                                        : isToday
                                            ? "bg-orange-500"
                                            : "bg-slate-600"
                            )}>
                                {isClaimed ? (
                                    <Check className="w-4 h-4 text-white" />
                                ) : isLocked ? (
                                    <Lock className="w-3 h-3 text-slate-400" />
                                ) : reward.special ? (
                                    <Star className="w-4 h-4 text-white" />
                                ) : (
                                    <Gift className="w-4 h-4 text-white" />
                                )}
                            </div>

                            {/* XP Amount */}
                            <span className={cn(
                                "text-xs font-bold mt-1",
                                reward.special ? "text-yellow-400" :
                                    isClaimed ? "text-green-400" :
                                        isToday ? "text-orange-400" :
                                            "text-slate-500"
                            )}>
                                +{reward.xp}
                            </span>

                            {/* Special badge */}
                            {reward.special && !isLocked && (
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-1 -right-1"
                                >
                                    <Sparkles className="w-4 h-4 text-yellow-400" />
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Week Complete Bonus */}
            {currentDay === 7 && claimed.includes(7) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-center"
                >
                    <p className="text-yellow-400 font-bold">🎉 Week Complete!</p>
                    <p className="text-xs text-slate-400">+100 XP bonus earned</p>
                </motion.div>
            )}

            {/* Next Reward Preview */}
            {currentDay < 7 && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-slate-400">
                            Tomorrow:
                        </span>
                    </div>
                    <span className="text-sm font-bold text-orange-400">
                        +{rewards[currentDay]?.xp || 0} XP
                    </span>
                </div>
            )}
        </motion.div>
    );
}
