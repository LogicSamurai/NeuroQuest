"use server";

import { db } from "@/lib/db";
import { gameSessions, users, userProgress, globalStats, dailyPuzzles, dailyPuzzleResults } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath, unstable_cache } from "next/cache";
import { updateLeaderboardEntry, incrementGlobalGameCount, getTopPlayersPreview, getUserRank } from "@/db/queries/leaderboard";
import { checkAchievements, getAchievementProgress } from "@/lib/achievements/checker";
import { updateChallengeProgress, getTodayChallenges, getTimeUntilRefresh } from "@/lib/challenges/challenges";
import { awardXp, getUserLevel, handleDailyLogin, XP_AWARDS, getCurrentMultiplier } from "@/lib/progression/xp";
import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { sendFriendRequest as sendFriendRequestLib, acceptFriendRequest as acceptFriendRequestLib, declineFriendRequest as declineFriendRequestLib, removeFriend as removeFriendLib } from "@/lib/social/friends";
import { purchaseStreakFreeze as purchaseStreakFreezeLib } from "@/lib/progression/streaks";

export async function signInAction() {
    await signIn("google");
}

export async function signOutAction() {
    await signOut({ redirectTo: '/' });
}

// Helper to get authenticated user
export async function getUserId() {
    const session = await auth();
    return session?.user?.id;
}

export async function ensureUser() {
    const userId = await getUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }
    return userId;
}

export async function getCurrentUser() {
    const userId = await getUserId();
    if (!userId) return null;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    return user;
}

// Enhanced game save with competitive features
export async function saveGameSession(
    gameId: string,
    score: number,
    difficultyLevel: number,
    accuracy: number,
    metadata?: {
        duration?: number;
        level?: number;
        moves?: number;
        discoveredElements?: number;
    },
    awardBaseXp: boolean = false // Default to false for strict XP
) {
    const userId = await ensureUser();
    const sessionId = crypto.randomUUID();

    // Save game session
    await db.insert(gameSessions).values({
        id: sessionId,
        userId,
        gameId,
        score,
        difficultyLevel,
        accuracy,
        duration: metadata?.duration,
        metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // Handle daily login (check streak)
    const loginResult = await handleDailyLogin(userId);

    // Increment global game count
    await incrementGlobalGameCount();

    // Update leaderboard
    await updateLeaderboardEntry(userId, gameId, score, {
        level: metadata?.level,
        accuracy,
        duration: metadata?.duration,
    });

    // Award XP for game completion
    const multiplier = getCurrentMultiplier();
    let totalXpAwarded = 0;
    let leveledUp = false;
    let newLevel = 0;

    // Base XP for completing (Only if explicitly requested, e.g. for non-level games)
    if (awardBaseXp) {
        const baseXp = XP_AWARDS.gameComplete;
        const xpResult = await awardXp(userId, baseXp, 'game', { gameId, score }, multiplier.value);
        totalXpAwarded += xpResult.xpAwarded || 0;
        if (xpResult.leveledUp) {
            leveledUp = true;
            newLevel = xpResult.newLevel;
        }
    }

    // Bonus XP for high scores (top 10 on leaderboard)
    const userRank = await getUserRank(userId, gameId, 'alltime');
    if (userRank.rank && userRank.rank <= 10) {
        const highScoreXp = await awardXp(userId, XP_AWARDS.highScore, 'game', { gameId, reason: 'high_score' }, multiplier.value);
        totalXpAwarded += highScoreXp.xpAwarded || 0;
        if (highScoreXp.leveledUp) {
            leveledUp = true;
            newLevel = highScoreXp.newLevel;
        }
    }

    // Check daily challenges
    const completedChallenges = await updateChallengeProgress(userId, gameId, {
        score,
        gamesCompleted: 1,
        accuracy,
        duration: metadata?.duration,
        wonGame: score > 0,
    });

    // Award XP for completed challenges
    for (const _challengeId of completedChallenges) {
        const challengeXp = await awardXp(userId, XP_AWARDS.challengeComplete, 'challenge', { gameId });
        totalXpAwarded += challengeXp.xpAwarded || 0;
        if (challengeXp.leveledUp) {
            leveledUp = true;
            newLevel = challengeXp.newLevel;
        }
    }

    // Check achievements
    const newAchievements = await checkAchievements({
        userId,
        gameId,
        score,
        accuracy,
        duration: metadata?.duration,
        level: metadata?.level,
        discoveredElements: metadata?.discoveredElements,
    });

    // Award XP for achievements
    for (const achievement of newAchievements) {
        const rarity = achievement.achievement.rarity;
        const achievementXp = rarity === 'legendary' ? XP_AWARDS.achievementLegendary :
            rarity === 'epic' ? XP_AWARDS.achievementEpic :
                rarity === 'rare' ? XP_AWARDS.achievementRare :
                    XP_AWARDS.achievementCommon;
        const achievementXpResult = await awardXp(userId, achievementXp, 'achievement', { achievementId: achievement.achievement.id });
        if (achievementXpResult.leveledUp) {
            leveledUp = true;
            newLevel = achievementXpResult.newLevel;
        }
    }

    // Get updated level info
    const levelInfo = await getUserLevel(userId);
    // If we didn't level up from actions, use current level
    if (!newLevel) newLevel = levelInfo.level;

    revalidatePath("/");
    revalidatePath(`/games/${gameId}`);
    revalidatePath("/leaderboard");

    return {
        sessionId,
        xpAwarded: totalXpAwarded,
        multiplier: multiplier.value > 1 ? multiplier : null,
        levelInfo,
        leveledUp,
        newLevel,
        completedChallenges: completedChallenges.length,
        newAchievements,
        loginResult,
    };
}

export async function saveLevelProgress(gameId: string, level: number | string, stars: number) {
    const userId = await ensureUser();

    const progress = await db.select().from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.gameId, gameId)))
        .limit(1)
        .then(res => res[0]);

    if (progress) {
        const currentStars = JSON.parse(progress.stars || "{}");
        const oldStars = currentStars[level] || 0;

        // Only update if new stars are higher
        if (stars > oldStars) {
            const newStarsMap = { ...currentStars, [level]: stars };
            const deltaStars = stars - oldStars;

            const updateData: any = {
                stars: JSON.stringify(newStarsMap),
                updatedAt: new Date()
            };

            // Only update levelReached for numeric campaign levels
            if (typeof level === 'number') {
                updateData.levelReached = Math.max(progress.levelReached, level + 1);
            }

            await db.update(userProgress)
                .set(updateData)
                .where(eq(userProgress.id, progress.id));

            // Award XP for NEW stars only
            if (deltaStars > 0) {
                await awardXp(userId, deltaStars * XP_AWARDS.star, 'game', { gameId, level, starsEarned: deltaStars });
            }
        }
    } else {
        const initialLevelReached = typeof level === 'number' ? level + 1 : 1;

        await db.insert(userProgress).values({
            id: crypto.randomUUID(),
            userId,
            gameId,
            levelReached: initialLevelReached,
            stars: JSON.stringify({ [level]: stars }),
        });

        // First time playing this game? Award for initial stars
        await awardXp(userId, stars * XP_AWARDS.star, 'game', { gameId, level, starsEarned: stars });
    }
    revalidatePath(`/games/${gameId}`);
}

export async function getLevelProgress(gameId: string) {
    const userId = await getUserId();
    if (!userId) return { levelReached: 1, stars: {} };

    const progress = await db.select().from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.gameId, gameId)))
        .limit(1)
        .then(res => res[0]);

    return {
        levelReached: progress?.levelReached || 1,
        stars: JSON.parse(progress?.stars || "{}")
    };
}

export async function getUserStats() {
    const userId = await getUserId();
    if (!userId) return null;

    // Get aggregates (count and sum score)
    const [aggregates] = await db
        .select({
            count: sql<number>`count(*)`,
            totalScore: sql<number>`sum(${gameSessions.score})`
        })
        .from(gameSessions)
        .where(eq(gameSessions.userId, userId));

    // Get recent sessions
    const sessions = await db
        .select()
        .from(gameSessions)
        .where(eq(gameSessions.userId, userId))
        .orderBy(desc(gameSessions.playedAt))
        .limit(50);

    const levelInfo = await getUserLevel(userId);

    const stats = {
        totalGames: Number(aggregates?.count || 0),
        totalScore: Number(aggregates?.totalScore || 0),
        recentSessions: sessions,
        level: levelInfo.level,
        currentXp: levelInfo.currentXp,
        xpForNextLevel: levelInfo.xpForNextLevel,
        progress: levelInfo.progress,
        totalXp: levelInfo.totalXp,
    };

    return stats;
}

// Get comprehensive data for homepage
export async function getHomepageData() {
    const userId = await getUserId();
    if (!userId) return null;

    // Handle daily login first (might update streaks/xp)
    // await handleDailyLogin(userId); // Removed to prevent streak update on visit

    const getCachedLeaderboard = unstable_cache(
        async () => getTopPlayersPreview('combined', 5),
        ['homepage-leaderboard'],
        { revalidate: 60 } // Cache for 60 seconds
    );

    // Fetch all data in parallel
    const [stats, user, topPlayers, userRank, challenges, achievements] = await Promise.all([
        getUserStats(),
        getCurrentUser(),
        getCachedLeaderboard(),
        getUserRank(userId, 'combined', 'alltime'),
        getTodayChallenges(userId),
        getAchievementProgress(userId),
    ]);

    const timeUntilRefresh = getTimeUntilRefresh();
    const unlockedAchievements = achievements.filter(a => a.unlocked).slice(-3);

    const today = new Date().toISOString().split('T')[0];

    // Fetch daily puzzle completion status
    const dailyPuzzleStatus = await db.select({
        gameId: dailyPuzzles.gameId,
        completed: sql<boolean>`true`
    })
        .from(dailyPuzzleResults)
        .innerJoin(dailyPuzzles, eq(dailyPuzzleResults.puzzleId, dailyPuzzles.id))
        .where(and(
            eq(dailyPuzzleResults.userId, userId),
            eq(dailyPuzzles.date, today)
        ));

    return {
        user,
        stats,
        leaderboard: {
            topPlayers,
            userRank,
        },
        challenges: {
            list: challenges,
            timeUntilRefresh,
            completedCount: challenges.filter(c => c.completed).length,
            dailyPuzzleStatus: dailyPuzzleStatus.reduce((acc, curr) => ({ ...acc, [curr.gameId]: true }), {} as Record<string, boolean>)
        },
        achievements: {
            recent: unlockedAchievements,
            totalUnlocked: achievements.filter(a => a.unlocked).length,
            total: achievements.length,
        },
    };
}

export async function sendFriendRequestAction(friendCode: string) {
    const userId = await ensureUser();
    return sendFriendRequestLib(userId, friendCode);
}

export async function acceptFriendRequestAction(requestId: string) {
    const userId = await ensureUser();
    return acceptFriendRequestLib(userId, requestId);
}

export async function declineFriendRequestAction(requestId: string) {
    const userId = await ensureUser();
    return declineFriendRequestLib(userId, requestId);
}

export async function removeFriendAction(friendId: string) {
    const userId = await ensureUser();
    return removeFriendLib(userId, friendId);
}

export async function purchaseStreakFreezeAction() {
    const userId = await ensureUser();
    const result = await purchaseStreakFreezeLib(userId);
    revalidatePath('/profile');
    return result;
}

// ============================================
// PROFILE UPDATE ACTIONS
// ============================================

export async function updateProfileAction(data: {
    name?: string;
    avatarUrl?: string;
    bio?: string;
}): Promise<{ success: boolean; error?: string }> {
    const userId = await ensureUser();

    // Validate name
    if (data.name !== undefined) {
        const trimmedName = data.name.trim();
        if (trimmedName.length < 1) {
            return { success: false, error: "Name cannot be empty" };
        }
        if (trimmedName.length > 20) {
            return { success: false, error: "Name must be 20 characters or less" };
        }
    }

    // Validate bio
    if (data.bio !== undefined && data.bio.length > 150) {
        return { success: false, error: "Bio must be 150 characters or less" };
    }

    await db.update(users)
        .set({
            ...(data.name && { name: data.name.trim() }),
            ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
            ...(data.bio !== undefined && { bio: data.bio }),
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: true };
}

export async function saveDailyResult(
    gameId: string,
    date: string,
    score: number,
    timeTaken: number
) {
    const userId = await ensureUser();

    // Find the puzzle ID
    const puzzle = await db.query.dailyPuzzles.findFirst({
        where: and(
            eq(dailyPuzzles.date, date),
            eq(dailyPuzzles.gameId, gameId)
        )
    });

    if (!puzzle) {
        throw new Error("Daily puzzle not found");
    }

    // Check for existing result
    const existingResult = await db.select()
        .from(dailyPuzzleResults)
        .where(and(
            eq(dailyPuzzleResults.userId, userId),
            eq(dailyPuzzleResults.puzzleId, puzzle.id)
        ))
        .limit(1)
        .then(res => res[0]);

    if (existingResult) {
        // Only update if score is better, or score is same but time is better
        const isBetterScore = score > existingResult.score;
        const isSameScoreBetterTime = score === existingResult.score && timeTaken < existingResult.timeTaken;

        if (isBetterScore || isSameScoreBetterTime) {
            await db.update(dailyPuzzleResults)
                .set({
                    score,
                    timeTaken,
                    completedAt: new Date(),
                })
                .where(eq(dailyPuzzleResults.id, existingResult.id));
        }
        // If not better, ignore (keep best)
    } else {
        // Save new result
        await db.insert(dailyPuzzleResults).values({
            userId,
            puzzleId: puzzle.id,
            score,
            timeTaken,
        });

        // Award XP for daily completion (only for first time)
        await awardXp(userId, XP_AWARDS.challengeComplete, 'challenge', { gameId, type: 'daily_puzzle' });
    }

    revalidatePath(`/games/${gameId}`);
    return { success: true };
}
