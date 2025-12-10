"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Clock, ChevronRight, Home, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZipLevel } from "@/lib/games/zip-path/levels";
import confetti from "canvas-confetti";

interface PatternRevealProps {
    level: ZipLevel;
    score: { score: number; stars: number; timeBonus: number };
    time: number;
    onContinue: () => void;
    onMenu: () => void;
}

export default function PatternReveal({
    level,
    score,
    time,
    onContinue,
    onMenu,
}: PatternRevealProps) {
    const [revealPhase, setRevealPhase] = useState<'cells' | 'pattern' | 'stats'>('cells');
    const [revealedCells, setRevealedCells] = useState<boolean[][]>(
        Array(level.gridSize).fill(null).map(() => Array(level.gridSize).fill(false))
    );

    // Animate cell reveal
    useEffect(() => {
        const totalCells = level.gridSize * level.gridSize;
        const blockedSet = new Set(level.blocked.map(b => `${b.row}-${b.col}`));

        let cellIndex = 0;
        const interval = setInterval(() => {
            if (cellIndex >= totalCells) {
                clearInterval(interval);
                // Move to pattern phase
                setTimeout(() => setRevealPhase('pattern'), 300);
                return;
            }

            const row = Math.floor(cellIndex / level.gridSize);
            const col = cellIndex % level.gridSize;

            // Skip blocked cells
            if (!blockedSet.has(`${row}-${col}`)) {
                setRevealedCells(prev => {
                    const next = prev.map(r => [...r]);
                    next[row][col] = true;
                    return next;
                });
            }

            cellIndex++;
        }, 30);

        return () => clearInterval(interval);
    }, [level]);

    // Show stats after pattern
    useEffect(() => {
        if (revealPhase === 'pattern') {
            const timer = setTimeout(() => {
                setRevealPhase('stats');
                // Extra confetti on stat reveal
                if (score.stars === 3) {
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.5 },
                        colors: ['#FFD700', '#FFA500', '#FF69B4'],
                    });
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [revealPhase, score.stars]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const cellSize = Math.min(300 / level.gridSize, 50);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-md mx-auto text-center"
        >
            {/* Pattern Grid - Netflix Puzzled Style */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="relative mx-auto mb-6"
                style={{
                    width: cellSize * level.gridSize + 16,
                    height: cellSize * level.gridSize + 16,
                }}
            >
                {/* Glow effect */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: revealPhase !== 'cells' ? 0.6 : 0,
                        scale: 1.1
                    }}
                    transition={{ delay: 0.5 }}
                    className="absolute inset-0 rounded-3xl blur-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30"
                />

                <div
                    className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl p-1"
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                    <div
                        className="grid gap-0.5"
                        style={{ gridTemplateColumns: `repeat(${level.gridSize}, 1fr)` }}
                    >
                        {level.pattern.colors.map((row, r) =>
                            row.map((color, c) => {
                                const isBlocked = level.blocked.some(b => b.row === r && b.col === c);
                                const isRevealed = revealedCells[r]?.[c] && !isBlocked;

                                return (
                                    <motion.div
                                        key={`${r}-${c}`}
                                        initial={{
                                            backgroundColor: '#1e293b',
                                            scale: 1,
                                        }}
                                        animate={{
                                            backgroundColor: isRevealed ? color : (isBlocked ? '#0f172a' : '#1e293b'),
                                            scale: isRevealed ? [1, 1.1, 1] : 1,
                                        }}
                                        transition={{
                                            backgroundColor: { duration: 0.3 },
                                            scale: { duration: 0.2 },
                                        }}
                                        className="rounded-md"
                                        style={{
                                            width: cellSize - 2,
                                            height: cellSize - 2,
                                            boxShadow: isRevealed ? `0 0 10px ${color}40` : 'none',
                                        }}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Pattern Name & Emoji */}
            <AnimatePresence>
                {revealPhase !== 'cells' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="text-6xl mb-3"
                        >
                            {level.pattern.emoji}
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white">
                            {level.pattern.name}
                        </h2>
                        <p className="text-slate-400 mt-1">Level {level.id} Complete!</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats & Score */}
            <AnimatePresence>
                {revealPhase === 'stats' && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {/* Stars */}
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3].map((star, idx) => (
                                <motion.div
                                    key={star}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{
                                        scale: star <= score.stars ? 1 : 0.6,
                                        rotate: 0,
                                    }}
                                    transition={{
                                        delay: 0.1 * idx,
                                        type: "spring",
                                        stiffness: 200,
                                    }}
                                >
                                    <Star
                                        className={cn(
                                            "w-12 h-12",
                                            star <= score.stars
                                                ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                                : "text-slate-600"
                                        )}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Score breakdown */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-4 mx-auto max-w-xs"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-slate-400">Score</span>
                                <span className="text-2xl font-bold text-white">
                                    {score.score.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Time Taken
                                </span>
                                <span className="text-white font-mono text-lg font-bold">{formatTime(time)}</span>
                            </div>
                            {score.timeBonus > 0 && (
                                <div className="flex flex-col gap-1 mb-2">
                                    <div className="flex items-center justify-between text-green-400">
                                        <span className="flex items-center gap-1">
                                            <Zap className="w-4 h-4" />
                                            Time Bonus
                                        </span>
                                        <span>+{score.timeBonus}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 text-right">(Included in Score)</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Action buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex justify-center gap-3 pt-4"
                        >
                            <Button
                                variant="outline"
                                onClick={onMenu}
                                className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Menu
                            </Button>
                            <Button
                                onClick={onContinue}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                            >
                                Continue
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading indicator during reveal */}
            {revealPhase === 'cells' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 text-slate-400"
                >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>Revealing pattern...</span>
                </motion.div>
            )}
        </motion.div>
    );
}
