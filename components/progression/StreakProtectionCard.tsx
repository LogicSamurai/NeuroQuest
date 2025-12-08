"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Snowflake, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StreakProtectionCardProps {
    freezesOwned: number;
    maxFreezes: number;
    freezeCost: number;
    canPurchase: boolean;
    currentStreak: number;
    totalXp: number;
    onPurchase: () => Promise<{ success: boolean; error?: string }>;
}

export default function StreakProtectionCard({
    freezesOwned,
    maxFreezes,
    freezeCost,
    canPurchase,
    currentStreak,
    totalXp,
    onPurchase,
}: StreakProtectionCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async () => {
        setIsLoading(true);
        setError(null);
        const result = await onPurchase();
        setIsLoading(false);
        if (!result.success && result.error) {
            setError(result.error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Streak Protection</h3>
                    <p className="text-xs text-slate-400">
                        Keep your {currentStreak}-day streak safe
                    </p>
                </div>
            </div>

            {/* Freezes Display */}
            <div className="flex items-center justify-center gap-2 mb-4 p-4 rounded-xl bg-slate-800/50">
                {Array.from({ length: maxFreezes }).map((_, index) => (
                    <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                            index < freezesOwned
                                ? "bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                : "bg-slate-700 border border-slate-600"
                        )}
                    >
                        <Snowflake className={cn(
                            "w-6 h-6",
                            index < freezesOwned ? "text-white" : "text-slate-500"
                        )} />
                    </motion.div>
                ))}
            </div>

            <p className="text-center text-sm text-slate-400 mb-4">
                {freezesOwned} of {maxFreezes} freezes owned
            </p>

            {/* Description */}
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 mb-4">
                <p className="text-xs text-slate-400">
                    <span className="text-cyan-400 font-medium">Streak Freezes</span> automatically
                    protect your streak if you miss a day. One freeze is used per missed day.
                </p>
            </div>

            {/* Purchase Button */}
            {freezesOwned < maxFreezes && (
                <div className="space-y-2">
                    <Button
                        onClick={handlePurchase}
                        disabled={!canPurchase || isLoading}
                        className={cn(
                            "w-full py-3 rounded-xl font-medium transition-all",
                            canPurchase
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                                : "bg-slate-700 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Snowflake className="w-4 h-4" />
                                Buy Freeze ({freezeCost} XP)
                            </span>
                        )}
                    </Button>

                    {!canPurchase && totalXp < freezeCost && (
                        <p className="text-xs text-center text-orange-400 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Need {freezeCost - totalXp} more XP
                        </p>
                    )}

                    {error && (
                        <p className="text-xs text-center text-red-400">
                            {error}
                        </p>
                    )}
                </div>
            )}

            {freezesOwned === maxFreezes && (
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-green-400 font-medium">
                        ✓ Maximum freezes owned
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Your streak is well protected!
                    </p>
                </div>
            )}
        </motion.div>
    );
}
