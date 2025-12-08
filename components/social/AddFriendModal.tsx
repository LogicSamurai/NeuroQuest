"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Copy, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AddFriendModalProps {
    isOpen: boolean;
    onClose: () => void;
    myFriendCode: string;
    onAddFriend: (friendCode: string) => Promise<{ success: boolean; error?: string }>;
}

export default function AddFriendModal({
    isOpen,
    onClose,
    myFriendCode,
    onAddFriend,
}: AddFriendModalProps) {
    const [friendCode, setFriendCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(myFriendCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendCode.trim() || friendCode.length !== 6) {
            setError("Please enter a valid 6-character friend code");
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await onAddFriend(friendCode.toUpperCase());

        setIsLoading(false);
        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFriendCode("");
                onClose();
            }, 1500);
        } else {
            setError(result.error || "Failed to send friend request");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md p-6 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-400" />
                                Add Friend
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* My Friend Code */}
                        <div className="mb-6 p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                            <p className="text-sm text-slate-400 mb-2">Your Friend Code</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 text-2xl font-mono font-bold tracking-widest text-white">
                                    {myFriendCode}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopy}
                                    className={cn(
                                        "transition-colors",
                                        copied ? "text-green-400" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Share this code with friends to connect
                            </p>
                        </div>

                        {/* Add Friend Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">
                                    Enter Friend&apos;s Code
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={friendCode}
                                        onChange={(e) => {
                                            setFriendCode(e.target.value.toUpperCase().slice(0, 6));
                                            setError(null);
                                        }}
                                        placeholder="ABC123"
                                        maxLength={6}
                                        className={cn(
                                            "w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700 border text-white placeholder-slate-500",
                                            "font-mono text-lg tracking-widest uppercase",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                            error ? "border-red-500" : "border-slate-600"
                                        )}
                                    />
                                </div>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-red-400 mt-2"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || friendCode.length !== 6}
                                className={cn(
                                    "w-full py-3 rounded-xl font-medium transition-all",
                                    success
                                        ? "bg-green-500 text-white"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                )}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                        Sending...
                                    </span>
                                ) : success ? (
                                    <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Request Sent!
                                    </span>
                                ) : (
                                    "Send Friend Request"
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
