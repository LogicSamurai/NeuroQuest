"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    X, User, Pencil, Check, Loader2
} from "lucide-react";
import { updateProfileAction } from "@/app/actions";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";
import { cn } from "@/lib/utils";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    currentAvatarUrl: string | null;
    currentBio: string | null;
}

export default function EditProfileModal({
    isOpen,
    onClose,
    currentName,
    currentAvatarUrl,
    currentBio,
}: EditProfileModalProps) {
    const [name, setName] = useState(currentName);
    const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarUrl || 'default');
    const [bio, setBio] = useState(currentBio || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            const result = await updateProfileAction({
                name,
                avatarUrl: selectedAvatar,
                bio,
            });

            if (result.success) {
                onClose();
                // Page will be revalidated automatically
            } else {
                setError(result.error || 'Failed to save');
            }
        } catch {
            setError('Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    const getAvatarById = (id: string) => {
        return AVATAR_OPTIONS.find(a => a.id === id) || AVATAR_OPTIONS[0];
    };

    const currentAvatarData = getAvatarById(selectedAvatar);

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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="glass-card p-6 rounded-2xl border border-slate-700">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Pencil className="w-5 h-5 text-purple-400" />
                                    Edit Profile
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Avatar Preview */}
                            <div className="flex justify-center mb-6">
                                <div className={cn(
                                    "w-24 h-24 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br",
                                    currentAvatarData.color
                                )}>
                                    {currentAvatarData.emoji}
                                </div>
                            </div>

                            {/* Avatar Selection */}
                            <div className="mb-6">
                                <label className="block text-sm text-slate-400 mb-3">
                                    Choose Avatar
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {AVATAR_OPTIONS.map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            onClick={() => setSelectedAvatar(avatar.id)}
                                            className={cn(
                                                "aspect-square rounded-xl flex items-center justify-center text-xl bg-gradient-to-br transition-all",
                                                avatar.color,
                                                selectedAvatar === avatar.id
                                                    ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                                                    : "opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            {avatar.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name Input */}
                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">
                                    Display Name
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    maxLength={20}
                                    className="bg-slate-900 border-slate-700"
                                />
                                <p className="mt-1 text-xs text-slate-500 text-right">
                                    {name.length}/20
                                </p>
                            </div>

                            {/* Bio Input */}
                            <div className="mb-6">
                                <label className="block text-sm text-slate-400 mb-2">
                                    Bio (optional)
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    maxLength={150}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                />
                                <p className="mt-1 text-xs text-slate-500 text-right">
                                    {bio.length}/150
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="flex-1 bg-slate-800 border-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !name.trim()}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
