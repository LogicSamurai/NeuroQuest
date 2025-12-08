"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Medal, Lock, Star, Trophy, Flame, Zap, Compass, Users, Sparkles, Crown, Target, Brain, Play, Timer, Rocket, Calendar, Shuffle, TrendingUp, Grid3X3, Moon, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RARITY_COLORS, CATEGORY_COLORS, AchievementRarity, AchievementCategory } from "@/lib/achievements/definitions";

interface Achievement {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    icon: string;
    xpReward: number;
    unlocked: boolean;
    tier?: string | null;
    progress?: number;
    target?: number;
    tiers?: {
        bronze: { target: number; description: string };
        silver: { target: number; description: string };
        gold: { target: number; description: string };
    };
}

interface AchievementsPageClientProps {
    achievements: Achievement[];
    grouped: Record<string, Achievement[]>;
    totalUnlocked: number;
    totalAchievements: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Flame, Crown, Sparkles, Brain, Trophy, Star, Zap, Target,
    Grid3X3, Compass, Shuffle, Users, Medal, TrendingUp, Moon,
    Sunrise, Timer, Rocket, Calendar, Play,
};

const categoryLabels: Record<AchievementCategory, string> = {
    streak: "Streak Achievements",
    score: "Score Achievements",
    skill: "Skill Mastery",
    discovery: "Discovery",
    social: "Social",
    crazy: "Special Challenges",
};

const categoryIcons: Record<AchievementCategory, React.ReactNode> = {
    streak: <Flame className="w-5 h-5" />,
    score: <Trophy className="w-5 h-5" />,
    skill: <Zap className="w-5 h-5" />,
    discovery: <Compass className="w-5 h-5" />,
    social: <Users className="w-5 h-5" />,
    crazy: <Sparkles className="w-5 h-5" />,
};

export default function AchievementsPageClient({
    achievements,
    grouped,
    totalUnlocked,
    totalAchievements,
}: AchievementsPageClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");
    const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | "all">("all");

    const filteredAchievements = achievements.filter(a => {
        if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
        if (selectedRarity !== "all" && a.rarity !== selectedRarity) return false;
        return true;
    });

    const categories: (AchievementCategory | "all")[] = ["all", "streak", "score", "skill", "discovery", "social", "crazy"];
    const rarities: (AchievementRarity | "all")[] = ["all", "common", "rare", "epic", "legendary"];

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
                        <Medal className="w-8 h-8 text-purple-400" />
                        Achievements
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {totalUnlocked} of {totalAchievements} unlocked
                    </p>
                </div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className="h-3 bg-slate-800 rounded-full overflow-hidden"
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalUnlocked / totalAchievements) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-4"
            >
                {/* Category Filter */}
                <div className="flex flex-wrap gap-1 p-1 bg-slate-800/50 rounded-lg">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                selectedCategory === cat
                                    ? "bg-purple-500 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                            )}
                        >
                            {cat !== "all" && categoryIcons[cat]}
                            <span className="capitalize">{cat === "all" ? "All" : cat}</span>
                        </button>
                    ))}
                </div>

                {/* Rarity Filter */}
                <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
                    {rarities.map((rarity) => (
                        <button
                            key={rarity}
                            onClick={() => setSelectedRarity(rarity)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all",
                                selectedRarity === rarity
                                    ? rarity === "legendary" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" :
                                        rarity === "epic" ? "bg-purple-500/20 text-purple-400 border border-purple-500/50" :
                                            rarity === "rare" ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" :
                                                "bg-slate-500/20 text-slate-300 border border-slate-500/50"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {rarity}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Achievements Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                <AnimatePresence mode="popLayout">
                    {filteredAchievements.map((achievement, index) => {
                        const IconComponent = iconMap[achievement.icon] || Trophy;
                        const rarityStyle = RARITY_COLORS[achievement.rarity];

                        return (
                            <motion.div
                                key={achievement.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.02 }}
                                className={cn(
                                    "relative p-5 rounded-xl border-2 transition-all",
                                    achievement.unlocked
                                        ? `${rarityStyle.bg} ${rarityStyle.border} ${rarityStyle.glow}`
                                        : "bg-slate-800/30 border-slate-700/50 opacity-60"
                                )}
                            >
                                {/* Lock overlay */}
                                {!achievement.unlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl">
                                        <Lock className="w-8 h-8 text-slate-500" />
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                                        achievement.unlocked
                                            ? achievement.tier === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                                                achievement.tier === 'silver' ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                                    achievement.tier === 'bronze' ? 'bg-gradient-to-br from-orange-400 to-orange-700' :
                                                        rarityStyle.bg
                                            : "bg-slate-700"
                                    )}>
                                        <IconComponent className={cn(
                                            "w-7 h-7",
                                            achievement.unlocked ? "text-white" : "text-slate-500"
                                        )} />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={cn(
                                            "font-bold text-lg truncate",
                                            achievement.unlocked ? rarityStyle.text : "text-slate-500"
                                        )}>
                                            {achievement.name}
                                        </h3>
                                        <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                                            {achievement.description}
                                        </p>

                                        {/* Tier progress for multi-tier achievements */}
                                        {achievement.tiers && (
                                            <div className="flex gap-1 mt-2">
                                                {(['bronze', 'silver', 'gold'] as const).map((tier) => (
                                                    <div
                                                        key={tier}
                                                        className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                                            achievement.tier === tier ||
                                                                (tier === 'bronze' && (achievement.tier === 'silver' || achievement.tier === 'gold')) ||
                                                                (tier === 'silver' && achievement.tier === 'gold')
                                                                ? tier === 'gold' ? 'bg-yellow-500 text-yellow-900' :
                                                                    tier === 'silver' ? 'bg-slate-300 text-slate-700' :
                                                                        'bg-orange-500 text-orange-900'
                                                                : 'bg-slate-700 text-slate-500'
                                                        )}
                                                    >
                                                        <Star className="w-3 h-3" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* XP Reward & Rarity */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full capitalize",
                                                rarityStyle.bg,
                                                rarityStyle.text,
                                                "border",
                                                rarityStyle.border
                                            )}>
                                                {achievement.rarity}
                                            </span>
                                            <span className="text-xs text-green-400">
                                                +{achievement.xpReward} XP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                    <Medal className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-400">No achievements found</h3>
                    <p className="text-slate-500 mt-2">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
}
