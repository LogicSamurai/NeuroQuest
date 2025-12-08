// Achievement Definitions
// Categories: streak, score, skill, discovery, social, crazy

export type AchievementCategory = 'streak' | 'score' | 'skill' | 'discovery' | 'social' | 'crazy';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    icon: string; // Lucide icon name
    xpReward: number;
    // For multi-tier achievements
    tiers?: {
        bronze: { target: number; description: string };
        silver: { target: number; description: string };
        gold: { target: number; description: string };
    };
    // For single-tier achievements
    target?: number;
    // Conditions
    gameId?: string; // null for cross-game
    checkType: 'streak' | 'total_games' | 'score' | 'accuracy' | 'speed' | 'level' | 'discovery' | 'time_of_day' | 'session_games' | 'leaderboard_rank' | 'friend_beat';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
    // ==================
    // STREAK ACHIEVEMENTS
    // ==================
    {
        id: 'streak_3',
        name: '3-Day Warrior',
        description: 'Maintain a 3-day login streak',
        category: 'streak',
        rarity: 'common',
        icon: 'Flame',
        xpReward: 50,
        target: 3,
        checkType: 'streak',
    },
    {
        id: 'streak_7',
        name: 'Week Champion',
        description: 'Maintain a 7-day login streak',
        category: 'streak',
        rarity: 'rare',
        icon: 'Flame',
        xpReward: 150,
        target: 7,
        checkType: 'streak',
    },
    {
        id: 'streak_30',
        name: '30-Day Legend',
        description: 'Maintain a 30-day login streak',
        category: 'streak',
        rarity: 'legendary',
        icon: 'Crown',
        xpReward: 500,
        target: 30,
        checkType: 'streak',
    },
    {
        id: 'streak_100',
        name: 'Centurion of Dedication',
        description: 'Maintain a 100-day login streak',
        category: 'streak',
        rarity: 'legendary',
        icon: 'Sparkles',
        xpReward: 1000,
        target: 100,
        checkType: 'streak',
    },

    // ==================
    // SCORE ACHIEVEMENTS
    // ==================
    {
        id: 'games_played',
        name: 'Brain Trainer',
        description: 'Play games to train your brain',
        category: 'score',
        rarity: 'common',
        icon: 'Brain',
        xpReward: 100,
        checkType: 'total_games',
        tiers: {
            bronze: { target: 10, description: 'Play 10 games' },
            silver: { target: 50, description: 'Play 50 games' },
            gold: { target: 100, description: 'Play 100 games' },
        },
    },
    {
        id: 'score_master',
        name: 'Score Master',
        description: 'Achieve high scores',
        category: 'score',
        rarity: 'rare',
        icon: 'Trophy',
        xpReward: 150,
        checkType: 'score',
        tiers: {
            bronze: { target: 1000, description: 'Reach 1,000 total score' },
            silver: { target: 10000, description: 'Reach 10,000 total score' },
            gold: { target: 50000, description: 'Reach 50,000 total score' },
        },
    },
    {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve perfect scores',
        category: 'score',
        rarity: 'epic',
        icon: 'Star',
        xpReward: 200,
        checkType: 'accuracy',
        target: 10, // 10 games with 100% accuracy
    },

    // ==================
    // SKILL ACHIEVEMENTS
    // ==================
    {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a level in under 10 seconds',
        category: 'skill',
        rarity: 'epic',
        icon: 'Zap',
        xpReward: 250,
        target: 10, // seconds
        checkType: 'speed',
    },
    {
        id: 'accuracy_ace',
        name: 'Accuracy Ace',
        description: 'Maintain high accuracy',
        category: 'skill',
        rarity: 'rare',
        icon: 'Target',
        xpReward: 150,
        checkType: 'accuracy',
        tiers: {
            bronze: { target: 90, description: 'Average 90%+ accuracy' },
            silver: { target: 95, description: 'Average 95%+ accuracy' },
            gold: { target: 99, description: 'Average 99%+ accuracy' },
        },
    },
    {
        id: 'stroop_master',
        name: 'Stroop Master',
        description: 'Excel at Stroop Dash',
        category: 'skill',
        rarity: 'rare',
        icon: 'Zap',
        xpReward: 200,
        gameId: 'stroop-dash',
        checkType: 'score',
        target: 500,
    },
    {
        id: 'zip_path_master',
        name: 'Path Master',
        description: 'Master Zip Path puzzles',
        category: 'skill',
        rarity: 'rare',
        icon: 'Grid3X3',
        xpReward: 200,
        gameId: 'zip-path',
        checkType: 'level',
        target: 20, // Complete 20 levels
    },

    // ==================
    // DISCOVERY ACHIEVEMENTS
    // ==================
    {
        id: 'alchemist',
        name: 'Alchemist',
        description: 'Discover elements in Alchemy Logic',
        category: 'discovery',
        rarity: 'rare',
        icon: 'Sparkles',
        xpReward: 200,
        gameId: 'alchemy-logic',
        checkType: 'discovery',
        tiers: {
            bronze: { target: 10, description: 'Discover 10 elements' },
            silver: { target: 25, description: 'Discover 25 elements' },
            gold: { target: 50, description: 'Discover all elements' },
        },
    },
    {
        id: 'explorer',
        name: 'Explorer',
        description: 'Unlock levels across all games',
        category: 'discovery',
        rarity: 'epic',
        icon: 'Compass',
        xpReward: 300,
        checkType: 'level',
        tiers: {
            bronze: { target: 10, description: 'Unlock 10 levels total' },
            silver: { target: 30, description: 'Unlock 30 levels total' },
            gold: { target: 50, description: 'Unlock all levels' },
        },
    },
    {
        id: 'variety_player',
        name: 'Renaissance Mind',
        description: 'Play all three games',
        category: 'discovery',
        rarity: 'common',
        icon: 'Shuffle',
        xpReward: 75,
        target: 3,
        checkType: 'discovery',
    },

    // ==================
    // SOCIAL ACHIEVEMENTS
    // ==================
    {
        id: 'rival_defeated',
        name: 'Rival Defeated',
        description: "Beat a friend's score",
        category: 'social',
        rarity: 'rare',
        icon: 'Swords',
        xpReward: 150,
        target: 1,
        checkType: 'friend_beat',
    },
    {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add friends to compete with',
        category: 'social',
        rarity: 'common',
        icon: 'Users',
        xpReward: 50,
        tiers: {
            bronze: { target: 1, description: 'Add 1 friend' },
            silver: { target: 5, description: 'Add 5 friends' },
            gold: { target: 10, description: 'Add 10 friends' },
        },
        checkType: 'discovery',
    },
    {
        id: 'top_10',
        name: 'Elite Player',
        description: 'Reach top 10 on any leaderboard',
        category: 'social',
        rarity: 'legendary',
        icon: 'Medal',
        xpReward: 500,
        target: 10,
        checkType: 'leaderboard_rank',
    },
    {
        id: 'top_100',
        name: 'Rising Star',
        description: 'Reach top 100 on any leaderboard',
        category: 'social',
        rarity: 'epic',
        icon: 'TrendingUp',
        xpReward: 200,
        target: 100,
        checkType: 'leaderboard_rank',
    },

    // ==================
    // CRAZY ACHIEVEMENTS
    // ==================
    {
        id: 'midnight_grinder',
        name: 'Midnight Grinder',
        description: 'Play between 2-4 AM',
        category: 'crazy',
        rarity: 'epic',
        icon: 'Moon',
        xpReward: 100,
        target: 1,
        checkType: 'time_of_day',
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Play before 6 AM',
        category: 'crazy',
        rarity: 'rare',
        icon: 'Sunrise',
        xpReward: 75,
        target: 1,
        checkType: 'time_of_day',
    },
    {
        id: 'marathon_runner',
        name: 'Marathon Runner',
        description: 'Play 5+ games in one session',
        category: 'crazy',
        rarity: 'rare',
        icon: 'Timer',
        xpReward: 100,
        target: 5,
        checkType: 'session_games',
    },
    {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Play 10+ games in one session',
        category: 'crazy',
        rarity: 'epic',
        icon: 'Rocket',
        xpReward: 200,
        target: 10,
        checkType: 'session_games',
    },
    {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Play on both Saturday and Sunday',
        category: 'crazy',
        rarity: 'common',
        icon: 'Calendar',
        xpReward: 50,
        target: 1,
        checkType: 'time_of_day',
    },
    {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first game',
        category: 'score',
        rarity: 'common',
        icon: 'Play',
        xpReward: 25,
        target: 1,
        checkType: 'total_games',
    },
];

// Helper to get achievement by ID
export function getAchievementById(id: string): AchievementDefinition | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
    return ACHIEVEMENTS.filter(a => a.category === category);
}

// Rarity colors for UI
export const RARITY_COLORS = {
    common: {
        bg: 'bg-slate-500/20',
        border: 'border-slate-500/50',
        text: 'text-slate-300',
        glow: '',
    },
    rare: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    },
    epic: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    },
    legendary: {
        bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_25px_rgba(250,204,21,0.5)]',
    },
};

// Category colors
export const CATEGORY_COLORS = {
    streak: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: 'Flame' },
    score: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'Trophy' },
    skill: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: 'Zap' },
    discovery: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: 'Compass' },
    social: { bg: 'bg-pink-500/20', text: 'text-pink-400', icon: 'Users' },
    crazy: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'Sparkles' },
};
