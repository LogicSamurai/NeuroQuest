import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getUser } from "@/db/queries/user";
import { getFriends, getPendingFriendRequests, ensureFriendCode } from "@/lib/social/friends";
import { getWeeklyRewardStatus, getStreakFreezeStatus } from "@/lib/progression/streaks";
import { getUserLevel } from "@/lib/progression/xp";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";
import ProfilePageClient from "./ProfilePageClient";

export default async function ProfilePage() {
    const user = await getUser();

    if (!user) {
        return (
            <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Not logged in</h1>
                    <p className="text-slate-400">Please create a profile to continue.</p>
                </div>
            </main>
        );
    }

    // Fetch all profile data
    const [friendCode, friends, pendingRequests, weeklyRewards, streakStatus, levelInfo] = await Promise.all([
        ensureFriendCode(user.id),
        getFriends(user.id),
        getPendingFriendRequests(user.id),
        getWeeklyRewardStatus(user.id),
        getStreakFreezeStatus(user.id),
        getUserLevel(user.id),
    ]);

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Pass data to client component (includes header) */}
                <ProfilePageClient
                    user={{
                        id: user.id,
                        name: user.name || "Anonymous",
                        avatarUrl: user.avatarUrl,
                        bio: user.bio,
                        currentStreak: user.currentStreak,
                        longestStreak: user.longestStreak,
                        totalXp: user.totalXp,
                    }}
                    friendCode={friendCode}
                    friends={friends}
                    pendingRequests={pendingRequests}
                    weeklyRewards={weeklyRewards}
                    streakStatus={{
                        ...streakStatus,
                        currentStreak: user.currentStreak,
                        totalXp: user.totalXp,
                    }}
                    levelInfo={levelInfo}
                    avatarOptions={AVATAR_OPTIONS}
                />
            </div>
        </main>
    );
}
