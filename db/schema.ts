import { pgTable, text, integer, doublePrecision, timestamp, boolean, primaryKey, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { AdapterAccount } from 'next-auth/adapters';

// ============================================
// NEXT AUTH TABLES
// ============================================

export const users = pgTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),

    // Custom Fields
    friendCode: text('friend_code').unique(),
    avatarUrl: text('avatar_url'), // Custom avatar if not using Google image
    bio: text('bio'),
    profileFrame: text('profile_frame').default('default'),

    // XP & Leveling
    xp: integer('xp').notNull().default(0),
    level: integer('level').notNull().default(1),
    totalXp: integer('total_xp').notNull().default(0),

    // Streaks
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    streakFreezes: integer('streak_freezes').notNull().default(0),
    lastLoginDate: text('last_login_date'), // YYYY-MM-DD

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount["type"]>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    })
);

// ============================================
// GAME TABLES
// ============================================

export const gameSessions = pgTable('game_sessions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    gameId: text('game_id').notNull(),
    score: integer('score').notNull(),
    difficultyLevel: doublePrecision('difficulty_level').notNull(),
    accuracy: doublePrecision('accuracy'),
    duration: integer('duration'),
    metadata: text('metadata'), // JSON
    playedAt: timestamp('played_at').defaultNow().notNull(),
}, (table) => ({
    userGameIdx: index('idx_sessions_user_game').on(table.userId, table.gameId),
    playedAtIdx: index('idx_sessions_played_at').on(table.playedAt),
}));

export const userProgress = pgTable('user_progress', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    gameId: text('game_id').notNull(),
    levelReached: integer('level_reached').notNull().default(1),
    stars: text('stars'), // JSON
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaderboardEntries = pgTable('leaderboard_entries', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    gameId: text('game_id').notNull(),
    score: integer('score').notNull(),
    rank: integer('rank'),
    percentile: doublePrecision('percentile'),
    period: text('period').notNull(),
    periodKey: text('period_key').notNull(),
    metadata: text('metadata'),
    previousRank: integer('previous_rank'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    gamePeriodIdx: index('idx_leaderboard_game_period').on(table.gameId, table.period, table.periodKey),
    scoreIdx: index('idx_leaderboard_score').on(table.score),
    userIdx: index('idx_leaderboard_user').on(table.userId),
}));

export const globalStats = pgTable('global_stats', {
    id: text('id').primaryKey().default('global'),
    totalPlayers: integer('total_players').notNull().default(0),
    gamesPlayedToday: integer('games_played_today').notNull().default(0),
    gamesPlayedTotal: integer('games_played_total').notNull().default(0),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const userAchievements = pgTable('user_achievements', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').notNull(),
    tier: text('tier').default('bronze'),
    progress: integer('progress').default(0),
    unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('idx_achievements_user').on(table.userId),
}));

export const dailyChallenges = pgTable('daily_challenges', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    date: text('date').notNull(),
    challengeIndex: integer('challenge_index').notNull(),
    type: text('type').notNull(),
    gameId: text('game_id'),
    targetValue: integer('target_value').notNull(),
    description: text('description').notNull(),
    xpReward: integer('xp_reward').notNull().default(50),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    dateIdx: index('idx_challenges_date').on(table.date),
}));

export const userChallengeProgress = pgTable('user_challenge_progress', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    challengeId: text('challenge_id').notNull().references(() => dailyChallenges.id, { onDelete: 'cascade' }),
    currentProgress: integer('current_progress').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
}, (table) => ({
    userChallengeIdx: index('idx_user_challenges').on(table.userId, table.challengeId),
}));

export const friendships = pgTable('friendships', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    friendId: text('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    acceptedAt: timestamp('accepted_at'),
}, (table) => ({
    userIdx: index('idx_friendships_user').on(table.userId),
    friendIdx: index('idx_friendships_friend').on(table.friendId),
}));

export const activityFeed = pgTable('activity_feed', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    message: text('message').notNull(),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('idx_activity_user').on(table.userId),
    createdIdx: index('idx_activity_created').on(table.createdAt),
}));

export const xpTransactions = pgTable('xp_transactions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    source: text('source').notNull(),
    multiplier: doublePrecision('multiplier').default(1.0),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('idx_xp_user').on(table.userId),
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type ActivityFeedItem = typeof activityFeed.$inferSelect;
