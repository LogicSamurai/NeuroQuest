"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Sparkles, Trophy, Flame, Zap, Target, Compass, Users, Moon, Crown, Medal, Brain, Play, Timer, Rocket, Calendar, Shuffle, TrendingUp, Grid3X3, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { RARITY_COLORS, CATEGORY_COLORS, AchievementRarity, AchievementTier } from "@/lib/achievements/definitions";

interface AchievementUnlockModalProps {
    achievement: {
        id: string;
        name: string;
        description: string;
        rarity: AchievementRarity;
        icon: string;
        xpReward: number;
        category: string;
    };
    tier?: AchievementTier;
    isOpen: boolean;
    onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Flame,
    Crown,
    Sparkles,
    Brain,
    Trophy,
    Star,
    Zap,
    Target,
    Grid3X3,
    Compass,
    Shuffle,
    Users,
    Medal,
    TrendingUp,
    Moon,
    Sunrise,
    Timer,
    Rocket,
    Calendar,
    Play,
};

const tierColors = {
    bronze: "from-orange-600 to-orange-800",
    silver: "from-slate-300 to-slate-500",
    gold: "from-yellow-400 to-amber-600",
};

const tierLabels = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
};

export default function AchievementUnlockModal({
    achievement,
    tier,
    isOpen,
    onClose,
}: AchievementUnlockModalProps) {
    const [showContent, setShowContent] = useState(false);

    const IconComponent = iconMap[achievement.icon] || Trophy;
    const rarityStyle = RARITY_COLORS[achievement.rarity];

    useEffect(() => {
        if (isOpen) {
            // Delay content reveal for dramatic effect
            const timer = setTimeout(() => setShowContent(true), 300);

            // Fire confetti based on rarity
            if (achievement.rarity === "legendary") {
                // Epic confetti burst
                const duration = 3000;
                const end = Date.now() + duration;

                const frame = () => {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0, y: 0.6 },
                        colors: ["#FFD700", "#FFA500", "#FF4500"],
                    });
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1, y: 0.6 },
                        colors: ["#FFD700", "#FFA500", "#FF4500"],
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };
                frame();
            } else if (achievement.rarity === "epic") {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ["#a855f7", "#7c3aed", "#c026d3"],
                });
            } else {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 },
                });
            }

            return () => {
                clearTimeout(timer);
                setShowContent(false);
            };
        }
    }, [isOpen, achievement.rarity]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "relative w-full max-w-md p-8 rounded-2xl border-2",
                            rarityStyle.bg,
                            rarityStyle.border,
                            rarityStyle.glow,
                            "overflow-hidden"
                        )}
                    >
                        {/* Background glow effect */}
                        <div className="absolute inset-0 overflow-hidden">
                            <motion.div
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                }}
                                className={cn(
                                    "absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-20",
                                    `bg-gradient-conic from-transparent via-${achievement.rarity === 'legendary' ? 'yellow' : achievement.rarity === 'epic' ? 'purple' : 'blue'}-500 to-transparent`
                                )}
                            />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Content */}
                        <div className="relative z-10 text-center">
                            {/* Achievement unlocked text */}
                            <motion.p
                                initial={{ y: -20, opacity: 0 }}
                                animate={showContent ? { y: 0, opacity: 1 } : {}}
                                transition={{ delay: 0.1 }}
                                className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4"
                            >
                                Achievement Unlocked!
                            </motion.p>

                            {/* Icon with glow */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={showContent ? { scale: 1, rotate: 0 } : {}}
                                transition={{ type: "spring", delay: 0.2, damping: 15 }}
                                className="relative mx-auto mb-6"
                            >
                                <div
                                    className={cn(
                                        "w-24 h-24 rounded-full mx-auto flex items-center justify-center",
                                        tier ? `bg-gradient-to-br ${tierColors[tier]}` : rarityStyle.bg,
                                        "border-4",
                                        rarityStyle.border,
                                        rarityStyle.glow
                                    )}
                                >
                                    <IconComponent
                                        className={cn(
                                            "w-12 h-12",
                                            achievement.rarity === "legendary"
                                                ? "text-yellow-300"
                                                : achievement.rarity === "epic"
                                                    ? "text-purple-300"
                                                    : "text-white"
                                        )}
                                    />
                                </div>

                                {/* Tier badge */}
                                {tier && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                        className={cn(
                                            "absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold",
                                            `bg-gradient-to-r ${tierColors[tier]}`,
                                            "text-white shadow-lg"
                                        )}
                                    >
                                        {tierLabels[tier]}
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Achievement name */}
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={showContent ? { y: 0, opacity: 1 } : {}}
                                transition={{ delay: 0.3 }}
                                className={cn(
                                    "text-2xl font-bold mb-2",
                                    rarityStyle.text
                                )}
                            >
                                {achievement.name}
                            </motion.h2>

                            {/* Description */}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={showContent ? { y: 0, opacity: 1 } : {}}
                                transition={{ delay: 0.4 }}
                                className="text-slate-300 mb-6"
                            >
                                {achievement.description}
                            </motion.p>

                            {/* XP Reward */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={showContent ? { scale: 1 } : {}}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50"
                            >
                                <Sparkles className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-bold">+{achievement.xpReward} XP</span>
                            </motion.div>

                            {/* Rarity badge */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={showContent ? { y: 0, opacity: 1 } : {}}
                                transition={{ delay: 0.6 }}
                                className="mt-4"
                            >
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                                        rarityStyle.bg,
                                        rarityStyle.border,
                                        rarityStyle.text,
                                        "border"
                                    )}
                                >
                                    <Star className="w-3 h-3" />
                                    {achievement.rarity}
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
