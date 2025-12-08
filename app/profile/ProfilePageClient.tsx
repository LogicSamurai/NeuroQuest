"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Flame, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import FriendsCard from "@/components/social/FriendsCard";
import DailyRewardsCalendar from "@/components/progression/DailyRewardsCalendar";
import StreakProtectionCard from "@/components/progression/StreakProtectionCard";
import LevelProgressBar from "@/components/progression/LevelProgressBar";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { SignOut } from "@/components/auth/SignOut";
import {
    sendFriendRequestAction,
    acceptFriendRequestAction,
    declineFriendRequestAction,
    removeFriendAction,
    purchaseStreakFreezeAction
} from "@/app/actions";

interface Friend {
    friendshipId: string;
    friendId: string | null;
    name: string | null;
    avatarUrl: string | null;
    level: number | null;
    currentStreak: number | null;
}

interface FriendRequest {
    id: string;
    senderId: string;
    senderName: string | null;
    senderAvatar: string | null;
    senderLevel: number | null;
    createdAt: Date | null;
}

interface ProfilePageClientProps {
    user: {
        id: string;
        name: string;
        avatarUrl: string | null;
        bio: string | null;
        currentStreak: number;
        longestStreak: number;
        totalXp: number;
    };
    friendCode: string;
    friends: Friend[];
    pendingRequests: FriendRequest[];
    weeklyRewards: {
        currentDay: number;
        weekNumber: number;
        streak: number;
        rewards: Array<{ day: number; xp: number; description: string; special?: boolean }>;
        claimed: number[];
    };
    streakStatus: {
        freezesOwned: number;
        maxFreezes: number;
        freezeCost: number;
        canPurchase: boolean;
        currentStreak: number;
        totalXp: number;
    };
    levelInfo: {
        level: number;
        currentXp: number;
        xpForNextLevel: number;
        progress: number;
    };
    avatarOptions: Array<{ id: string; emoji: string; color: string }>;
}

export default function ProfilePageClient({
    user,
    friendCode,
    friends: initialFriends,
    pendingRequests: initialPendingRequests,
    weeklyRewards,
    streakStatus: initialStreakStatus,
    levelInfo,
    avatarOptions,
}: ProfilePageClientProps) {
    const [friends, setFriends] = useState(initialFriends);
    const [pendingRequests, setPendingRequests] = useState(initialPendingRequests);
    const [streakStatus, setStreakStatus] = useState(initialStreakStatus);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleAddFriend = async (code: string) => {
        const result = await sendFriendRequestAction(code);
        return result;
    };

    const handleAcceptRequest = async (requestId: string) => {
        const result = await acceptFriendRequestAction(requestId);
        if (result.success) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        }
        return result;
    };

    const handleDeclineRequest = async (requestId: string) => {
        const result = await declineFriendRequestAction(requestId);
        if (result.success) {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        }
        return result;
    };

    const handleRemoveFriend = async (friendId: string) => {
        const result = await removeFriendAction(friendId);
        if (result.success) {
            setFriends(prev => prev.filter(f => f.friendId !== friendId));
        }
        return result;
    };

    const handlePurchaseFreeze = async () => {
        const result = await purchaseStreakFreezeAction();
        if (result.success) {
            setStreakStatus(prev => ({
                ...prev,
                freezesOwned: prev.freezesOwned + 1,
                canPurchase: prev.freezesOwned + 1 < prev.maxFreezes && prev.totalXp - prev.freezeCost >= prev.freezeCost,
                totalXp: prev.totalXp - prev.freezeCost,
            }));
        }
        return result;
    };

    // Get avatar data
    const getAvatarById = (id: string | null) => {
        return avatarOptions.find(a => a.id === id) || avatarOptions[0];
    };
    const currentAvatar = getAvatarById(user.avatarUrl);

    return (
        <>
            {/* Profile Header */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentAvatar.color} flex items-center justify-center text-4xl`}>
                            {currentAvatar.emoji}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                            {user.bio && (
                                <p className="text-slate-400 text-sm mt-1 max-w-md">{user.bio}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1 text-yellow-400">
                                    <Trophy className="w-4 h-4" />
                                    Level {levelInfo.level}
                                </span>
                                <span className="flex items-center gap-1 text-orange-400">
                                    <Flame className="w-4 h-4" />
                                    {user.currentStreak} day streak
                                </span>
                                <span className="flex items-center gap-1 text-blue-400">
                                    <Users className="w-4 h-4" />
                                    {friends.length} friends
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowEditModal(true)}
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                        <SignOut />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Level Progress - Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-2 lg:col-span-3"
                >
                    <LevelProgressBar
                        level={levelInfo.level}
                        currentXp={levelInfo.currentXp}
                        xpForNextLevel={levelInfo.xpForNextLevel}
                        progress={levelInfo.progress}
                    />
                </motion.div>

                {/* Daily Rewards Calendar */}
                <DailyRewardsCalendar
                    currentDay={weeklyRewards.currentDay}
                    weekNumber={weeklyRewards.weekNumber}
                    rewards={weeklyRewards.rewards}
                    claimed={weeklyRewards.claimed}
                    streak={weeklyRewards.streak}
                />

                {/* Streak Protection */}
                <StreakProtectionCard
                    freezesOwned={streakStatus.freezesOwned}
                    maxFreezes={streakStatus.maxFreezes}
                    freezeCost={streakStatus.freezeCost}
                    canPurchase={streakStatus.canPurchase}
                    currentStreak={streakStatus.currentStreak}
                    totalXp={streakStatus.totalXp}
                    onPurchase={handlePurchaseFreeze}
                />

                {/* Friends Card */}
                <FriendsCard
                    friends={friends}
                    pendingRequests={pendingRequests}
                    myFriendCode={friendCode}
                    onAddFriend={handleAddFriend}
                    onAcceptRequest={handleAcceptRequest}
                    onDeclineRequest={handleDeclineRequest}
                    onRemoveFriend={handleRemoveFriend}
                />

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Progress Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Total XP</span>
                            <span className="text-xl font-bold text-yellow-400">
                                {user.totalXp.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Current Streak</span>
                            <span className="text-xl font-bold text-orange-400">
                                🔥 {user.currentStreak} days
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Longest Streak</span>
                            <span className="text-xl font-bold text-red-400">
                                {user.longestStreak} days
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Friends</span>
                            <span className="text-xl font-bold text-blue-400">
                                {friends.length}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Personal Records */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 lg:col-span-2"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Milestones</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Week 1", xp: 100, unlocked: weeklyRewards.weekNumber >= 1 },
                            { label: "Week 4", xp: 500, unlocked: weeklyRewards.weekNumber >= 4 },
                            { label: "Week 12", xp: 1500, unlocked: weeklyRewards.weekNumber >= 12 },
                            { label: "Week 52", xp: 5000, unlocked: weeklyRewards.weekNumber >= 52 },
                        ].map((milestone, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-xl text-center transition-all ${milestone.unlocked
                                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
                                    : "bg-slate-800/50 border border-slate-700/50 opacity-50"
                                    }`}
                            >
                                <p className="text-sm font-medium text-white">{milestone.label}</p>
                                <p className="text-xs text-slate-400">+{milestone.xp} XP</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                currentName={user.name}
                currentAvatarUrl={user.avatarUrl}
                currentBio={user.bio}
            />
        </>
    );
}
