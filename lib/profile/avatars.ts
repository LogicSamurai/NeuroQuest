// Avatar configuration options
export const AVATAR_OPTIONS = [
    { id: 'default', emoji: '🧠', color: 'from-blue-500 to-purple-600' },
    { id: 'fire', emoji: '🔥', color: 'from-orange-500 to-red-500' },
    { id: 'rocket', emoji: '🚀', color: 'from-purple-500 to-pink-500' },
    { id: 'star', emoji: '⭐', color: 'from-yellow-400 to-orange-500' },
    { id: 'lightning', emoji: '⚡', color: 'from-yellow-300 to-yellow-500' },
    { id: 'target', emoji: '🎯', color: 'from-red-500 to-pink-500' },
    { id: 'crown', emoji: '👑', color: 'from-yellow-500 to-amber-600' },
    { id: 'gem', emoji: '💎', color: 'from-cyan-400 to-blue-500' },
    { id: 'heart', emoji: '❤️', color: 'from-pink-500 to-rose-500' },
    { id: 'leaf', emoji: '🌿', color: 'from-green-400 to-emerald-500' },
    { id: 'moon', emoji: '🌙', color: 'from-indigo-500 to-purple-600' },
    { id: 'sun', emoji: '☀️', color: 'from-yellow-400 to-orange-400' },
];

export type AvatarOption = typeof AVATAR_OPTIONS[number];

export function getAvatarById(id: string | null): AvatarOption {
    return AVATAR_OPTIONS.find(a => a.id === id) || AVATAR_OPTIONS[0];
}
