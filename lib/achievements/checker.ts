import { db } from "@/lib/db";
import { userAchievements, users, gameSessions, userProgress, leaderboardEntries, friendships } from "@/db/schema";
import { eq, and, count, sql, desc, gte } from "drizzle-orm";
import { ACHIEVEMENTS, AchievementDefinition, AchievementTier } from "./definitions";

export interface AchievementCheckContext {
    userId: string;
    gameId?: string;
    score?: number;
    accuracy?: number;
    duration?: number; // seconds
    level?: number;
    discoveredElements?: number;
}

export interface UnlockedAchievement {
    achievement: AchievementDefinition;
    tier?: AchievementTier;
    isNewUnlock: boolean;
    isNewTier?: boolean;
}

// Check all achievements for a user and return newly unlocked ones
export async function checkAchievements(context: AchievementCheckContext): Promise<UnlockedAchievement[]> {
    const { userId } = context;
    const newUnlocks: UnlockedAchievement[] = [];

    // Get user's current achievements
    const userAchievs = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

    const achievedMap = new Map(userAchievs.map(a => [a.achievementId, a]));

    // Get user stats for checking
    const userStats = await getUserStats(userId);

    for (const achievement of ACHIEVEMENTS) {
        const existing = achievedMap.get(achievement.id);

        // Skip if already fully achieved (non-tiered) or at gold tier
        if (existing && !achievement.tiers) continue;
        if (existing && existing.tier === 'gold') continue;

        // Check if achievement should be unlocked
        const result = await checkSingleAchievement(achievement, context, userStats);

        if (result.unlocked) {
            if (achievement.tiers) {
                // Multi-tier achievement
                const currentTier = existing?.tier as AchievementTier | undefined;
                if (result.tier && result.tier !== currentTier) {
                    // New tier unlocked
                    if (existing) {
                        await db
                            .update(userAchievements)
                            .set({ tier: result.tier, progress: result.progress })
                            .where(eq(userAchievements.id, existing.id));
                    } else {
                        await db.insert(userAchievements).values({
                            id: crypto.randomUUID(),
                            userId: userId,
                            achievementId: achievement.id,
                            tier: result.tier,
                            progress: result.progress,
                        });
                    }
                    newUnlocks.push({
                        achievement,
                        tier: result.tier,
                        isNewUnlock: !existing,
                        isNewTier: !!existing,
                    });
                }
            } else {
                // Single-tier achievement
                if (!existing) {
                    await db.insert(userAchievements).values({
                        id: crypto.randomUUID(),
                        userId,
                        achievementId: achievement.id,
                        progress: result.progress,
                    });
                    newUnlocks.push({
                        achievement,
                        isNewUnlock: true,
                    });
                }
            }
        }
    }

    return newUnlocks;
}

interface UserStats {
    totalGames: number;
    totalScore: number;
    averageAccuracy: number;
    currentStreak: number;
    levelReached: Record<string, number>;
    gamesPerGame: Record<string, number>;
    friendCount: number;
    leaderboardRanks: number[];
    gamesThisSession: number;
}

async function getUserStats(userId: string): Promise<UserStats> {
    // Get user data
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);

    // Get game sessions
    const sessions = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.userId, userId));

    // Get progress for each game
    const progress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));

    // Get friend count
    const friends = await db
        .select({ count: count() })
        .from(friendships)
        .where(and(
            eq(friendships.userId, userId),
            eq(friendships.status, 'accepted')
        ))
        .limit(1)
        .then(res => res[0]);

    // Get leaderboard ranks
    const ranks = await db
        .select({ rank: leaderboardEntries.rank })
        .from(leaderboardEntries)
        .where(eq(leaderboardEntries.userId, userId));

    // Calculate games per game type
    const gamesPerGame: Record<string, number> = {};
    for (const session of sessions) {
        gamesPerGame[session.gameId] = (gamesPerGame[session.gameId] || 0) + 1;
    }

    // Calculate level reached per game
    const levelReached: Record<string, number> = {};
    for (const p of progress) {
        levelReached[p.gameId] = p.levelReached;
    }

    // Calculate average accuracy
    const accuracySessions = sessions.filter(s => s.accuracy !== null);
    const avgAccuracy = accuracySessions.length > 0
        ? accuracySessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / accuracySessions.length
        : 0;

    // Count games in last hour (session games)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentGames = sessions.filter(s =>
        s.playedAt && new Date(s.playedAt) > oneHourAgo
    ).length;

    return {
        totalGames: sessions.length,
        totalScore: sessions.reduce((acc, s) => acc + s.score, 0),
        averageAccuracy: avgAccuracy,
        currentStreak: user?.currentStreak || 0,
        levelReached,
        gamesPerGame,
        friendCount: friends?.count || 0,
        leaderboardRanks: ranks.map(r => r.rank).filter((r): r is number => r !== null),
        gamesThisSession: recentGames,
    };
}

interface CheckResult {
    unlocked: boolean;
    tier?: AchievementTier;
    progress?: number;
}

async function checkSingleAchievement(
    achievement: AchievementDefinition,
    context: AchievementCheckContext,
    stats: UserStats
): Promise<CheckResult> {
    const { gameId, score, accuracy, duration, level, discoveredElements } = context;

    switch (achievement.checkType) {
        case 'streak':
            return checkStreakAchievement(achievement, stats);

        case 'total_games':
            return checkTotalGamesAchievement(achievement, stats);

        case 'score':
            return checkScoreAchievement(achievement, stats, score);

        case 'accuracy':
            return checkAccuracyAchievement(achievement, stats, accuracy);

        case 'speed':
            return checkSpeedAchievement(achievement, duration);

        case 'level':
            return checkLevelAchievement(achievement, stats, level);

        case 'discovery':
            return checkDiscoveryAchievement(achievement, stats, discoveredElements);

        case 'time_of_day':
            return checkTimeOfDayAchievement(achievement);

        case 'session_games':
            return checkSessionGamesAchievement(achievement, stats);

        case 'leaderboard_rank':
            return checkLeaderboardRankAchievement(achievement, stats);

        case 'friend_beat':
            return { unlocked: false }; // Requires special handling

        default:
            return { unlocked: false };
    }
}

function checkStreakAchievement(achievement: AchievementDefinition, stats: UserStats): CheckResult {
    const target = achievement.target || 0;
    return {
        unlocked: stats.currentStreak >= target,
        progress: stats.currentStreak,
    };
}

function checkTotalGamesAchievement(achievement: AchievementDefinition, stats: UserStats): CheckResult {
    if (achievement.tiers) {
        const { bronze, silver, gold } = achievement.tiers;
        if (stats.totalGames >= gold.target) {
            return { unlocked: true, tier: 'gold', progress: stats.totalGames };
        }
        if (stats.totalGames >= silver.target) {
            return { unlocked: true, tier: 'silver', progress: stats.totalGames };
        }
        if (stats.totalGames >= bronze.target) {
            return { unlocked: true, tier: 'bronze', progress: stats.totalGames };
        }
        return { unlocked: false, progress: stats.totalGames };
    }
    return {
        unlocked: stats.totalGames >= (achievement.target || 0),
        progress: stats.totalGames,
    };
}

function checkScoreAchievement(
    achievement: AchievementDefinition,
    stats: UserStats,
    currentScore?: number
): CheckResult {
    if (achievement.gameId) {
        // Game-specific score
        const gameScore = currentScore || 0;
        return {
            unlocked: gameScore >= (achievement.target || 0),
            progress: gameScore,
        };
    }

    if (achievement.tiers) {
        const { bronze, silver, gold } = achievement.tiers;
        if (stats.totalScore >= gold.target) {
            return { unlocked: true, tier: 'gold', progress: stats.totalScore };
        }
        if (stats.totalScore >= silver.target) {
            return { unlocked: true, tier: 'silver', progress: stats.totalScore };
        }
        if (stats.totalScore >= bronze.target) {
            return { unlocked: true, tier: 'bronze', progress: stats.totalScore };
        }
        return { unlocked: false, progress: stats.totalScore };
    }

    return {
        unlocked: stats.totalScore >= (achievement.target || 0),
        progress: stats.totalScore,
    };
}

function checkAccuracyAchievement(
    achievement: AchievementDefinition,
    stats: UserStats,
    currentAccuracy?: number
): CheckResult {
    if (achievement.tiers) {
        const { bronze, silver, gold } = achievement.tiers;
        if (stats.averageAccuracy >= gold.target) {
            return { unlocked: true, tier: 'gold', progress: Math.round(stats.averageAccuracy) };
        }
        if (stats.averageAccuracy >= silver.target) {
            return { unlocked: true, tier: 'silver', progress: Math.round(stats.averageAccuracy) };
        }
        if (stats.averageAccuracy >= bronze.target) {
            return { unlocked: true, tier: 'bronze', progress: Math.round(stats.averageAccuracy) };
        }
        return { unlocked: false, progress: Math.round(stats.averageAccuracy) };
    }

    // For perfectionist - requires 100% accuracy games
    return { unlocked: false, progress: 0 };
}

function checkSpeedAchievement(achievement: AchievementDefinition, duration?: number): CheckResult {
    if (duration === undefined) return { unlocked: false };
    const target = achievement.target || 10;
    return {
        unlocked: duration <= target,
        progress: duration,
    };
}

function checkLevelAchievement(
    achievement: AchievementDefinition,
    stats: UserStats,
    currentLevel?: number
): CheckResult {
    if (achievement.gameId) {
        const level = currentLevel || stats.levelReached[achievement.gameId] || 0;
        return {
            unlocked: level >= (achievement.target || 0),
            progress: level,
        };
    }

    // Total levels across all games
    const totalLevels = Object.values(stats.levelReached).reduce((acc, l) => acc + l, 0);
    if (achievement.tiers) {
        const { bronze, silver, gold } = achievement.tiers;
        if (totalLevels >= gold.target) {
            return { unlocked: true, tier: 'gold', progress: totalLevels };
        }
        if (totalLevels >= silver.target) {
            return { unlocked: true, tier: 'silver', progress: totalLevels };
        }
        if (totalLevels >= bronze.target) {
            return { unlocked: true, tier: 'bronze', progress: totalLevels };
        }
        return { unlocked: false, progress: totalLevels };
    }

    return {
        unlocked: totalLevels >= (achievement.target || 0),
        progress: totalLevels,
    };
}

function checkDiscoveryAchievement(
    achievement: AchievementDefinition,
    stats: UserStats,
    discovered?: number
): CheckResult {
    if (achievement.id === 'variety_player') {
        const gamesPlayed = Object.keys(stats.gamesPerGame).length;
        return {
            unlocked: gamesPlayed >= 3,
            progress: gamesPlayed,
        };
    }

    if (achievement.gameId === 'alchemy-logic' && discovered !== undefined) {
        if (achievement.tiers) {
            const { bronze, silver, gold } = achievement.tiers;
            if (discovered >= gold.target) {
                return { unlocked: true, tier: 'gold', progress: discovered };
            }
            if (discovered >= silver.target) {
                return { unlocked: true, tier: 'silver', progress: discovered };
            }
            if (discovered >= bronze.target) {
                return { unlocked: true, tier: 'bronze', progress: discovered };
            }
            return { unlocked: false, progress: discovered };
        }
    }

    return { unlocked: false };
}

function checkTimeOfDayAchievement(achievement: AchievementDefinition): CheckResult {
    const hour = new Date().getHours();

    switch (achievement.id) {
        case 'midnight_grinder':
            return { unlocked: hour >= 2 && hour < 4, progress: 1 };
        case 'early_bird':
            return { unlocked: hour < 6, progress: 1 };
        case 'weekend_warrior':
            const day = new Date().getDay();
            return { unlocked: day === 0 || day === 6, progress: 1 };
        default:
            return { unlocked: false };
    }
}

function checkSessionGamesAchievement(achievement: AchievementDefinition, stats: UserStats): CheckResult {
    return {
        unlocked: stats.gamesThisSession >= (achievement.target || 0),
        progress: stats.gamesThisSession,
    };
}

function checkLeaderboardRankAchievement(achievement: AchievementDefinition, stats: UserStats): CheckResult {
    const target = achievement.target || 10;
    const bestRank = Math.min(...stats.leaderboardRanks, Infinity);
    return {
        unlocked: bestRank <= target && bestRank !== Infinity,
        progress: bestRank === Infinity ? 0 : bestRank,
    };
}

// Get user's unlocked achievements
export async function getUserAchievements(userId: string) {
    const achievements = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

    return achievements.map(ua => ({
        ...ua,
        definition: ACHIEVEMENTS.find(a => a.id === ua.achievementId),
    }));
}

// Get achievement progress for display
export async function getAchievementProgress(userId: string) {
    const unlocked = await getUserAchievements(userId);
    const unlockedIds = new Set(unlocked.map(u => u.achievementId));

    return ACHIEVEMENTS.map(achievement => {
        const userAchiev = unlocked.find(u => u.achievementId === achievement.id);
        return {
            ...achievement,
            unlocked: unlockedIds.has(achievement.id),
            tier: userAchiev?.tier,
            progress: userAchiev?.progress || 0,
            unlockedAt: userAchiev?.unlockedAt,
        };
    });
}
