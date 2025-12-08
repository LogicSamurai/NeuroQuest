import { db } from "@/lib/db";
import { dailyChallenges, userChallengeProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Challenge templates
const CHALLENGE_TEMPLATES = [
    // Score-based challenges
    { type: 'score', gameId: 'zip-path', targetRange: [300, 800], description: 'Score {target}+ on Zip Path' },
    { type: 'score', gameId: 'alchemy-logic', targetRange: [200, 500], description: 'Score {target}+ on Alchemy Logic' },
    { type: 'score', gameId: 'stroop-dash', targetRange: [400, 1000], description: 'Score {target}+ on Stroop Dash' },

    // Completion challenges
    { type: 'completion', gameId: 'zip-path', targetRange: [2, 5], description: 'Complete {target} Zip Path levels' },
    { type: 'completion', gameId: 'alchemy-logic', targetRange: [2, 5], description: 'Complete {target} Alchemy Logic levels' },
    { type: 'completion', gameId: 'stroop-dash', targetRange: [3, 8], description: 'Complete {target} Stroop Dash rounds' },
    { type: 'completion', gameId: null, targetRange: [5, 10], description: 'Complete {target} games across any mode' },

    // Accuracy challenges
    { type: 'accuracy', gameId: 'stroop-dash', targetRange: [85, 95], description: 'Achieve {target}%+ accuracy on Stroop Dash' },

    // Speed challenges
    { type: 'speed', gameId: 'zip-path', targetRange: [15, 30], description: 'Complete a Zip Path level in under {target} seconds' },

    // Streak challenges
    { type: 'streak', gameId: null, targetRange: [3, 5], description: 'Win {target} games in a row' },
];

// XP rewards based on difficulty
const XP_REWARDS = {
    easy: 30,
    medium: 50,
    hard: 75,
};

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
}

// Generate 3 daily challenges for today
export async function generateDailyChallenges() {
    const today = getTodayDateString();

    // Check if challenges already exist for today
    const existing = await db
        .select()
        .from(dailyChallenges)
        .where(eq(dailyChallenges.date, today));

    if (existing.length >= 3) {
        return existing;
    }

    // Delete any old challenges and generate new ones
    // (In production, you'd keep them for history)

    // Select 3 different challenge templates
    const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffled.slice(0, 3);

    const newChallenges = [];

    for (let i = 0; i < 3; i++) {
        const template = selectedTemplates[i];
        const targetValue = getRandomInt(template.targetRange[0], template.targetRange[1]);
        const description = template.description.replace('{target}', targetValue.toString());

        // Determine difficulty for XP
        const range = template.targetRange[1] - template.targetRange[0];
        const position = (targetValue - template.targetRange[0]) / range;
        const difficulty = position < 0.33 ? 'easy' : position < 0.66 ? 'medium' : 'hard';

        const challenge = {
            id: crypto.randomUUID(),
            date: today,
            challengeIndex: i,
            type: template.type,
            gameId: template.gameId,
            targetValue,
            description,
            xpReward: XP_REWARDS[difficulty],
        };

        await db.insert(dailyChallenges).values(challenge);
        newChallenges.push(challenge);
    }

    return newChallenges;
}

// Get today's challenges for a user
export async function getTodayChallenges(userId: string) {
    const today = getTodayDateString();

    // Ensure challenges exist
    await generateDailyChallenges();

    // Get challenges
    const challenges = await db
        .select()
        .from(dailyChallenges)
        .where(eq(dailyChallenges.date, today));

    // Get user progress for each challenge
    const challengesWithProgress = await Promise.all(
        challenges.map(async (challenge) => {
            const progress = await db
                .select()
                .from(userChallengeProgress)
                .where(
                    and(
                        eq(userChallengeProgress.userId, userId),
                        eq(userChallengeProgress.challengeId, challenge.id)
                    )
                )
                .limit(1)
                .then(res => res[0]);

            return {
                ...challenge,
                currentProgress: progress?.currentProgress || 0,
                completed: progress?.completed || false,
                completedAt: progress?.completedAt,
            };
        })
    );

    return challengesWithProgress;
}

// Update progress on a challenge
export async function updateChallengeProgress(
    userId: string,
    gameId: string,
    context: {
        score?: number;
        gamesCompleted?: number;
        accuracy?: number;
        duration?: number;
        wonGame?: boolean;
    }
) {
    const today = getTodayDateString();

    // Get today's challenges
    const challenges = await db
        .select()
        .from(dailyChallenges)
        .where(eq(dailyChallenges.date, today));

    const completedChallenges: string[] = [];

    for (const challenge of challenges) {
        // Skip if challenge doesn't match game or is cross-game
        if (challenge.gameId !== null && challenge.gameId !== gameId) continue;

        // Get or create progress
        let progress = await db
            .select()
            .from(userChallengeProgress)
            .where(
                and(
                    eq(userChallengeProgress.userId, userId),
                    eq(userChallengeProgress.challengeId, challenge.id)
                )
            )
            .limit(1)
            .then(res => res[0]);

        if (!progress) {
            await db.insert(userChallengeProgress).values({
                id: crypto.randomUUID(),
                userId,
                challengeId: challenge.id,
                currentProgress: 0,
                completed: false,
            });
            progress = await db
                .select()
                .from(userChallengeProgress)
                .where(
                    and(
                        eq(userChallengeProgress.userId, userId),
                        eq(userChallengeProgress.challengeId, challenge.id)
                    )
                )
                .limit(1)
                .then(res => res[0]);
        }

        if (progress?.completed) continue;

        let newProgress = progress?.currentProgress || 0;
        let isCompleted = false;

        switch (challenge.type) {
            case 'score':
                if (context.score && context.score >= challenge.targetValue) {
                    newProgress = challenge.targetValue;
                    isCompleted = true;
                } else if (context.score) {
                    newProgress = Math.max(newProgress, context.score);
                }
                break;

            case 'completion':
                newProgress += context.gamesCompleted || 1;
                if (newProgress >= challenge.targetValue) {
                    isCompleted = true;
                }
                break;

            case 'accuracy':
                if (context.accuracy && context.accuracy >= challenge.targetValue) {
                    newProgress = challenge.targetValue;
                    isCompleted = true;
                } else if (context.accuracy) {
                    newProgress = Math.max(newProgress, Math.round(context.accuracy));
                }
                break;

            case 'speed':
                if (context.duration && context.duration <= challenge.targetValue) {
                    newProgress = challenge.targetValue;
                    isCompleted = true;
                }
                break;

            case 'streak':
                if (context.wonGame) {
                    newProgress += 1;
                    if (newProgress >= challenge.targetValue) {
                        isCompleted = true;
                    }
                } else {
                    newProgress = 0; // Reset streak on loss
                }
                break;
        }

        // Update progress
        await db
            .update(userChallengeProgress)
            .set({
                currentProgress: newProgress,
                completed: isCompleted,
                completedAt: isCompleted ? new Date() : null,
            })
            .where(eq(userChallengeProgress.id, progress!.id));

        if (isCompleted) {
            completedChallenges.push(challenge.id);
        }
    }

    return completedChallenges;
}

// Get time until next challenge refresh (non-async utility)
export function getTimeUntilRefresh(): { hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
}

// Calculate daily challenges completed count
export async function getDailyChallengeStats(userId: string) {
    const challenges = await getTodayChallenges(userId);
    const completed = challenges.filter(c => c.completed).length;
    const total = challenges.length;
    const totalXpEarned = challenges
        .filter(c => c.completed)
        .reduce((acc, c) => acc + c.xpReward, 0);

    return {
        completed,
        total,
        totalXpEarned,
        challenges,
    };
}
