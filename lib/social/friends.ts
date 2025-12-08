import { db } from "@/lib/db";
import { users, friendships, activityFeed, leaderboardEntries } from "@/db/schema";
import { eq, and, or, desc, ne } from "drizzle-orm";

// Generate a unique 6-character friend code
function generateFriendCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Ensure user has a friend code
export async function ensureFriendCode(userId: string): Promise<string> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);

    if (user?.friendCode) {
        return user.friendCode;
    }

    // Generate unique code
    let code = generateFriendCode();
    let attempts = 0;

    while (attempts < 10) {
        const existing = await db.select().from(users).where(eq(users.friendCode, code)).limit(1).then(res => res[0]);
        if (!existing) break;
        code = generateFriendCode();
        attempts++;
    }

    await db.update(users).set({ friendCode: code }).where(eq(users.id, userId));
    return code;
}

// Find user by friend code
export async function findUserByFriendCode(friendCode: string) {
    const user = await db
        .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            level: users.level,
        })
        .from(users)
        .where(eq(users.friendCode, friendCode.toUpperCase()))
        .limit(1)
        .then(res => res[0]);

    return user;
}

// Send friend request
export async function sendFriendRequest(userId: string, friendCode: string) {
    // Find friend by code
    const friend = await findUserByFriendCode(friendCode);
    if (!friend) {
        return { success: false, error: 'User not found with that friend code' };
    }

    if (friend.id === userId) {
        return { success: false, error: "You can't add yourself as a friend" };
    }

    // Check if already friends or pending
    const existing = await db
        .select()
        .from(friendships)
        .where(
            or(
                and(eq(friendships.userId, userId), eq(friendships.friendId, friend.id)),
                and(eq(friendships.userId, friend.id), eq(friendships.friendId, userId))
            )
        )
        .limit(1)
        .then(res => res[0]);

    if (existing) {
        if (existing.status === 'accepted') {
            return { success: false, error: 'Already friends with this user' };
        }
        if (existing.status === 'pending') {
            return { success: false, error: 'Friend request already pending' };
        }
        if (existing.status === 'blocked') {
            return { success: false, error: 'Cannot send friend request' };
        }
    }

    // Create friend request
    await db.insert(friendships).values({
        id: crypto.randomUUID(),
        userId,
        friendId: friend.id,
        status: 'pending',
    });

    return { success: true, friend };
}

// Accept friend request
export async function acceptFriendRequest(userId: string, requestId: string) {
    const request = await db
        .select()
        .from(friendships)
        .where(eq(friendships.id, requestId))
        .limit(1)
        .then(res => res[0]);

    if (!request || request.friendId !== userId || request.status !== 'pending') {
        return { success: false, error: 'Invalid friend request' };
    }

    // Update status
    await db
        .update(friendships)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(friendships.id, requestId));

    // Create reverse friendship entry
    await db.insert(friendships).values({
        id: crypto.randomUUID(),
        userId,
        friendId: request.userId,
        status: 'accepted',
    });

    // Add to activity feed
    await db.insert(activityFeed).values({
        id: crypto.randomUUID(),
        userId: request.userId,
        type: 'friend_added',
        message: `Became friends with a new player`,
    });

    return { success: true };
}

// Decline/remove friend request
export async function declineFriendRequest(userId: string, requestId: string) {
    const request = await db
        .select()
        .from(friendships)
        .where(eq(friendships.id, requestId))
        .limit(1)
        .then(res => res[0]);

    if (!request || request.friendId !== userId) {
        return { success: false, error: 'Invalid friend request' };
    }

    await db.delete(friendships).where(eq(friendships.id, requestId));
    return { success: true };
}

// Remove friend
export async function removeFriend(userId: string, friendId: string) {
    // Delete both directions
    await db
        .delete(friendships)
        .where(
            or(
                and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
                and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
            )
        );

    return { success: true };
}

// Get pending friend requests (received)
export async function getPendingFriendRequests(userId: string) {
    const requests = await db
        .select({
            id: friendships.id,
            senderId: friendships.userId,
            senderName: users.name,
            senderAvatar: users.avatarUrl,
            senderLevel: users.level,
            createdAt: friendships.createdAt,
        })
        .from(friendships)
        .leftJoin(users, eq(friendships.userId, users.id))
        .where(
            and(
                eq(friendships.friendId, userId),
                eq(friendships.status, 'pending')
            )
        )
        .orderBy(desc(friendships.createdAt));

    return requests;
}

// Get friends list
export async function getFriends(userId: string) {
    const friends = await db
        .select({
            friendshipId: friendships.id,
            friendId: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            level: users.level,
            currentStreak: users.currentStreak,
        })
        .from(friendships)
        .leftJoin(users, eq(friendships.friendId, users.id))
        .where(
            and(
                eq(friendships.userId, userId),
                eq(friendships.status, 'accepted')
            )
        )
        .orderBy(desc(users.level));

    return friends;
}

// Get friends leaderboard (scores among friends for a game)
export async function getFriendsLeaderboard(
    userId: string,
    gameId: string = 'combined',
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime'
) {
    // Get friend IDs
    const friendsList = await getFriends(userId);
    const friendIds = friendsList.map(f => f.friendId).filter((id): id is string => id !== null);

    // Include self
    const allIds = [userId, ...friendIds];

    if (allIds.length === 0) return [];

    // Get leaderboard entries for friends
    const periodKey = period === 'alltime' ? 'alltime' :
        period === 'daily' ? new Date().toISOString().split('T')[0] :
            period === 'weekly' ? `${new Date().getFullYear()}-W${Math.ceil(((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7).toString().padStart(2, '0')}` :
                `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

    const entries = await db
        .select({
            userId: leaderboardEntries.userId,
            userName: users.name,
            userAvatar: users.avatarUrl,
            userLevel: users.level,
            score: leaderboardEntries.score,
            rank: leaderboardEntries.rank,
        })
        .from(leaderboardEntries)
        .leftJoin(users, eq(leaderboardEntries.userId, users.id))
        .where(
            and(
                eq(leaderboardEntries.gameId, gameId),
                eq(leaderboardEntries.period, period),
                eq(leaderboardEntries.periodKey, periodKey)
            )
        )
        .orderBy(desc(leaderboardEntries.score));

    // Filter to only include friends
    const friendEntries = entries.filter(e => e.userId && allIds.includes(e.userId));

    // Add friend rank
    return friendEntries.map((entry, index) => ({
        ...entry,
        friendRank: index + 1,
        isCurrentUser: entry.userId === userId,
    }));
}

// Get friend count
export async function getFriendCount(userId: string): Promise<number> {
    const friends = await getFriends(userId);
    return friends.length;
}

// Check if users are friends
export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await db
        .select()
        .from(friendships)
        .where(
            and(
                eq(friendships.userId, userId),
                eq(friendships.friendId, otherUserId),
                eq(friendships.status, 'accepted')
            )
        )
        .limit(1)
        .then(res => res[0]);

    return !!friendship;
}

// Get activity feed from friends
export async function getFriendsActivity(userId: string, limit: number = 20) {
    const friends = await getFriends(userId);
    const friendIds = friends.map(f => f.friendId).filter((id): id is string => id !== null);

    if (friendIds.length === 0) return [];

    // Get recent activities from friends
    const activities = await db
        .select({
            id: activityFeed.id,
            userId: activityFeed.userId,
            userName: users.name,
            userAvatar: users.avatarUrl,
            type: activityFeed.type,
            message: activityFeed.message,
            createdAt: activityFeed.createdAt,
        })
        .from(activityFeed)
        .leftJoin(users, eq(activityFeed.userId, users.id))
        .orderBy(desc(activityFeed.createdAt))
        .limit(limit);

    // Filter to friends only
    return activities.filter(a => a.userId && friendIds.includes(a.userId));
}
