"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeatYourFriendToastProps {
    isVisible: boolean;
    onClose: () => void;
    friendName: string;
    friendScore: number;
    yourScore: number;
    gameId: string;
    gameName: string;
}

export default function BeatYourFriendToast({
    isVisible,
    onClose,
    friendName,
    friendScore,
    yourScore,
    gameId,
    gameName,
}: BeatYourFriendToastProps) {
    const difference = friendScore - yourScore;
    const isAhead = yourScore > friendScore;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm"
                >
                    <div className={cn(
                        "relative p-4 rounded-2xl shadow-xl border backdrop-blur-sm",
                        isAhead
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-orange-500/10 border-orange-500/30"
                    )}>
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className={cn(
                                    "p-2 rounded-xl",
                                    isAhead ? "bg-green-500/20" : "bg-orange-500/20"
                                )}
                            >
                                <Swords className={cn(
                                    "w-6 h-6",
                                    isAhead ? "text-green-400" : "text-orange-400"
                                )} />
                            </motion.div>

                            {/* Content */}
                            <div className="flex-1">
                                {isAhead ? (
                                    <>
                                        <p className="font-bold text-green-400 flex items-center gap-1">
                                            <Trophy className="w-4 h-4" />
                                            You beat {friendName}!
                                        </p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            You&apos;re ahead by {Math.abs(difference).toLocaleString()} pts on {gameName}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold text-orange-400 flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            {friendName} passed you!
                                        </p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            They&apos;re ahead by {difference.toLocaleString()} pts on {gameName}
                                        </p>
                                    </>
                                )}

                                {/* Score comparison */}
                                <div className="flex items-center gap-4 mt-3 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className={cn(
                                            "font-bold",
                                            isAhead ? "text-green-400" : "text-slate-400"
                                        )}>
                                            You: {yourScore.toLocaleString()}
                                        </span>
                                    </div>
                                    <span className="text-slate-500">vs</span>
                                    <div className="flex items-center gap-1">
                                        <span className={cn(
                                            "font-bold",
                                            !isAhead ? "text-orange-400" : "text-slate-400"
                                        )}>
                                            {friendName}: {friendScore.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* CTA */}
                                {!isAhead && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="mt-3 w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-400 transition-colors"
                                    >
                                        Play Now to Reclaim #1
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
