"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Trophy, Flame, MoreVertical, UserMinus, X, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import AddFriendModal from "./AddFriendModal";

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

interface FriendsCardProps {
    friends: Friend[];
    pendingRequests: FriendRequest[];
    myFriendCode: string;
    onAddFriend: (friendCode: string) => Promise<{ success: boolean; error?: string }>;
    onAcceptRequest: (requestId: string) => Promise<{ success: boolean }>;
    onDeclineRequest: (requestId: string) => Promise<{ success: boolean }>;
    onRemoveFriend: (friendId: string) => Promise<{ success: boolean }>;
}

export default function FriendsCard({
    friends,
    pendingRequests,
    myFriendCode,
    onAddFriend,
    onAcceptRequest,
    onDeclineRequest,
    onRemoveFriend,
}: FriendsCardProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const handleAccept = async (requestId: string) => {
        setActionInProgress(requestId);
        await onAcceptRequest(requestId);
        setActionInProgress(null);
    };

    const handleDecline = async (requestId: string) => {
        setActionInProgress(requestId);
        await onDeclineRequest(requestId);
        setActionInProgress(null);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Friends</h3>
                            <p className="text-xs text-slate-400">
                                {friends.length} friend{friends.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg mb-4">
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={cn(
                            "flex-1 py-1.5 rounded-md text-sm font-medium transition-colors",
                            activeTab === 'friends'
                                ? "bg-slate-700 text-white"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        Friends ({friends.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={cn(
                            "flex-1 py-1.5 rounded-md text-sm font-medium transition-colors relative",
                            activeTab === 'requests'
                                ? "bg-slate-700 text-white"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        Requests
                        {pendingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'friends' ? (
                        <motion.div
                            key="friends"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-2"
                        >
                            {friends.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                                    <p className="text-slate-400 text-sm">No friends yet</p>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="text-blue-400 text-sm hover:underline mt-1"
                                    >
                                        Add your first friend
                                    </button>
                                </div>
                            ) : (
                                friends.slice(0, 5).map((friend) => (
                                    <motion.div
                                        key={friend.friendshipId}
                                        layout
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors group"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {friend.name?.charAt(0) || '?'}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">
                                                {friend.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span>Lv.{friend.level || 1}</span>
                                                {friend.currentStreak && friend.currentStreak > 0 && (
                                                    <span className="flex items-center gap-0.5 text-orange-400">
                                                        <Flame className="w-3 h-3" />
                                                        {friend.currentStreak}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Remove button (hidden by default) */}
                                        <button
                                            onClick={() => friend.friendId && onRemoveFriend(friend.friendId)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="Remove friend"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                            {friends.length > 5 && (
                                <p className="text-center text-sm text-slate-400 pt-2">
                                    +{friends.length - 5} more friends
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-2"
                        >
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-8">
                                    <Clock className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                                    <p className="text-slate-400 text-sm">No pending requests</p>
                                </div>
                            ) : (
                                pendingRequests.map((request) => (
                                    <motion.div
                                        key={request.id}
                                        layout
                                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                            {request.senderName?.charAt(0) || '?'}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">
                                                {request.senderName}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Lv.{request.senderLevel || 1}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleAccept(request.id)}
                                                disabled={actionInProgress === request.id}
                                                className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDecline(request.id)}
                                                disabled={actionInProgress === request.id}
                                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Add Friend Modal */}
            <AddFriendModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                myFriendCode={myFriendCode}
                onAddFriend={onAddFriend}
            />
        </>
    );
}
