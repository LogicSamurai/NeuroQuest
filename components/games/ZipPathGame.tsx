"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Play, RotateCcw, Trophy, Clock,
    Star, Lock, Sparkles, Grid, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_LEVELS, ZipLevel, calculateScore } from "@/lib/games/zip-path/levels";
import { solveZipLevel } from "@/lib/games/zip-path/solver";
import PatternReveal from "./PatternReveal";
import TutorialOverlay from "./TutorialOverlay";
import confetti from "canvas-confetti";
import { saveGameSession, saveLevelProgress, saveDailyResult } from "@/app/actions";

interface CellState {
    isPath: boolean;
    pathOrder: number;
    isNumber: boolean;
    number?: number;
    isBlocked: boolean;
}

type GameState = 'menu' | 'playing' | 'completed' | 'failed';

interface ZipPathGameProps {
    initialProgress?: {
        levelReached: number;
        stars: Record<number, number>;
    };
    autoDaily?: boolean;
}

export default function ZipPathGame({ initialProgress, autoDaily = false }: ZipPathGameProps) {
    const router = useRouter();
    // const searchParams = useSearchParams(); // Removed as we use prop now
    // const autoDaily = searchParams.get('daily') === 'true'; // Removed

    const [gameState, setGameState] = useState<GameState>('menu');
    const [currentLevel, setCurrentLevel] = useState<ZipLevel>(ALL_LEVELS[0]);
    const [grid, setGrid] = useState<CellState[][]>([]);
    const [path, setPath] = useState<{ row: number; col: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentNumber, setCurrentNumber] = useState(1);
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [showReveal, setShowReveal] = useState(false);
    const [score, setScore] = useState({ score: 0, stars: 0, timeBonus: 0 });
    const [isLoadingDaily, setIsLoadingDaily] = useState(autoDaily); // Start loading immediately if autoDaily
    const [dailyLeaderboard, setDailyLeaderboard] = useState<any[]>([]);
    const [showDailyLeaderboard, setShowDailyLeaderboard] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [hintCell, setHintCell] = useState<{ row: number, col: number } | null>(null);

    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(false);
    const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

    const fetchDailyLeaderboard = async () => {
        try {
            const res = await fetch('/api/daily/leaderboard?gameId=zip-path');
            if (res.ok) {
                const data = await res.json();
                setDailyLeaderboard(data.leaderboard || []);
                setShowDailyLeaderboard(true);
            }
        } catch (e) {
            console.error("Failed to fetch leaderboard", e);
        }
    };

    const startDailyChallenge = async () => {
        setIsLoadingDaily(true);
        try {
            const res = await fetch('/api/daily?gameId=zip-path');
            if (!res.ok) throw new Error('Failed to fetch daily');
            const level = await res.json();

            if (level.completed) {
                router.push('/daily-challenges/leaderboard?game=zip-path');
                return;
            }

            // Ensure level has required properties
            if (!level.numbers || !level.gridSize) throw new Error('Invalid level data');

            setCurrentLevel(level);
            setGameState('playing');
        } catch (e) {
            console.error("Failed to load daily challenge:", e);
            // You might want to show a toast here
        } finally {
            setIsLoadingDaily(false);
        }
    };

    useEffect(() => {
        // Show tutorial if no levels completed (stars is empty) and haven't seen it yet
        const hasCompletedLevels = initialProgress?.stars && Object.keys(initialProgress.stars).length > 0;
        if (!hasCompletedLevels && !hasSeenTutorial && !autoDaily) {
            setShowTutorial(true);
        }
    }, [initialProgress, hasSeenTutorial, autoDaily]);

    // Auto-start daily if requested
    useEffect(() => {
        if (autoDaily && gameState === 'menu') {
            startDailyChallenge();
        }
    }, [autoDaily]);

    // Initialize unlocked levels based on progress
    const [unlockedLevels, setUnlockedLevels] = useState<Set<number>>(() => {
        const maxLevel = initialProgress?.levelReached || 1;
        const levels = new Set<number>();
        for (let i = 1; i <= maxLevel; i++) {
            levels.add(i);
        }
        return levels;
    });

    const [levelStars, setLevelStars] = useState<Record<string | number, number>>(initialProgress?.stars || {});
    const [extraLevels, setExtraLevels] = useState<ZipLevel[]>([]);
    const [isLoadingExtra, setIsLoadingExtra] = useState(true);

    // Fetch extra daily levels
    useEffect(() => {
        const fetchExtraLevels = async () => {
            try {
                console.log("Fetching extra levels...");
                const res = await fetch('/api/games/zip-path/levels');
                if (res.ok) {
                    const data = await res.json();
                    console.log("Fetched levels data:", data);
                    // Transform DB levels to ZipLevel format
                    const levels: ZipLevel[] = data.levels.map((l: any) => ({
                        id: l.id, // Use string ID from DB
                        name: l.name,
                        difficulty: l.difficulty,
                        ...JSON.parse(l.data)
                    }));
                    console.log("Parsed extra levels:", levels);
                    setExtraLevels(levels);
                } else {
                    console.error("Failed to fetch extra levels, status:", res.status);
                }
            } catch (e) {
                console.error("Failed to fetch extra levels", e);
            } finally {
                setIsLoadingExtra(false);
            }
        };
        fetchExtraLevels();
    }, []);
    const gridRef = useRef<HTMLDivElement>(null);
    const cellSize = useRef(40);

    const initializeGrid = useCallback(() => {
        if (!currentLevel) return;

        const newGrid: CellState[][] = Array(currentLevel.gridSize).fill(null).map(() =>
            Array(currentLevel.gridSize).fill(null).map(() => ({
                isPath: false,
                pathOrder: -1,
                isNumber: false,
                isBlocked: false
            }))
        );

        // Set numbers
        if (currentLevel.numbers) {
            Object.entries(currentLevel.numbers).forEach(([numStr, pos]) => {
                if (newGrid[pos.row] && newGrid[pos.row][pos.col]) {
                    newGrid[pos.row][pos.col].isNumber = true;
                    newGrid[pos.row][pos.col].number = parseInt(numStr);
                }
            });
        }

        setGrid(newGrid);
        setPath([]);
        setCurrentNumber(1);

        // Find start position (number 1)
        if (currentLevel.numbers && currentLevel.numbers["1"]) {
            const startPos = currentLevel.numbers["1"];
            setPath([{ row: startPos.row, col: startPos.col }]);

            // Update grid for start pos immediately
            newGrid[startPos.row][startPos.col].isPath = true;
            newGrid[startPos.row][startPos.col].pathOrder = 0;
            setGrid([...newGrid]);
        }
    }, [currentLevel]);

    useEffect(() => {
        initializeGrid();
    }, [initializeGrid]);

    // Handle drawing
    const getCellFromPoint = (x: number, y: number) => {
        if (!gridRef.current) return null;
        const rect = gridRef.current.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        const col = Math.floor(relativeX / cellSize.current);
        const row = Math.floor(relativeY / cellSize.current);

        if (row >= 0 && row < currentLevel.gridSize && col >= 0 && col < currentLevel.gridSize) {
            return { row, col };
        }
        return null;
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (gameState !== 'playing') return;
        setIsDrawing(true);
        handlePointerMove(e);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing || gameState !== 'playing') return;

        const cell = getCellFromPoint(e.clientX, e.clientY);
        if (!cell) return;

        // Logic to extend path
        // This is a simplified version of what should be there
        // We need to check adjacency, not crossing, etc.

        setPath(prev => {
            const last = prev[prev.length - 1];
            if (!last) return prev; // Should have start pos

            // If hovering over the last cell, do nothing
            if (last.row === cell.row && last.col === cell.col) return prev;

            // Check adjacency
            const isAdjacent = Math.abs(last.row - cell.row) + Math.abs(last.col - cell.col) === 1;
            if (!isAdjacent) return prev;

            // Check if cell is already in path (backtracking or crossing)
            const existingIndex = prev.findIndex(p => p.row === cell.row && p.col === cell.col);
            if (existingIndex !== -1) {
                // Backtracking: if we go back to a previous cell, cut the path there
                // But only if it's the immediate previous one? 
                // Or allow cutting loops? 
                // For simplicity, let's allow cutting back to any point
                const newPath = prev.slice(0, existingIndex + 1);

                // Update grid to reflect removed path
                setGrid(g => {
                    const ng = g.map(row => row.map(c => ({ ...c })));
                    // Clear path flags for removed cells
                    for (let i = existingIndex + 1; i < prev.length; i++) {
                        const p = prev[i];
                        ng[p.row][p.col].isPath = false;
                        ng[p.row][p.col].pathOrder = -1;
                        // Don't remove number flag
                    }
                    return ng;
                });

                return newPath;
            }

            // Check if blocked or occupied by another number (unless it's the NEXT number)
            const gridCell = grid[cell.row][cell.col];
            if (gridCell.isBlocked) return prev;

            if (gridCell.isNumber) {
                // Can only enter if it's the next number
                // We need to know what the "current target" number is
                // We can deduce it from the path length or keep track
                // Actually, we just check if it's (currentNumber + 1)
                // But currentNumber is state.

                // Let's count numbers passed in path
                let numbersPassed = 0;
                prev.forEach(p => {
                    if (grid[p.row][p.col].isNumber) numbersPassed++;
                });

                // If we are at number 1, numbersPassed is 1. Next is 2.
                // So expected number is numbersPassed + 1.
                if (gridCell.number !== numbersPassed + 1) {
                    return prev; // Wrong number
                }
            }

            // Add to path
            const newPath = [...prev, cell];

            // Update grid
            setGrid(g => {
                const ng = g.map(row => row.map(c => ({ ...c })));
                ng[cell.row][cell.col].isPath = true;
                ng[cell.row][cell.col].pathOrder = newPath.length - 1;
                return ng;
            });

            return newPath;
        });
    };

    const handlePointerUp = () => {
        setIsDrawing(false);

        // Check completion
        // 1. Path must cover all non-blocked cells
        // 2. Path must hit all numbers in order (implicit if we only allow valid moves)
        // 3. Last cell must be the final number

        if (path.length === 0) return;

        const lastPos = path[path.length - 1];
        const lastCell = grid[lastPos.row][lastPos.col];

        // Check if last cell is the max number
        const maxNum = Object.keys(currentLevel.numbers).length;
        if (lastCell.isNumber && lastCell.number === maxNum) {
            // Check if grid is full
            const totalCells = currentLevel.gridSize * currentLevel.gridSize;
            // We assume no blocked cells for now in daily/zip levels usually
            // If there are blocked cells, we subtract them
            // But path.length should equal totalCells - blockedCount

            // For now, just check if path length == totalCells
            if (path.length === totalCells) {
                handleComplete();
            }
        }
    };
    const handleComplete = async () => {
        setTimerRunning(false);
        // Clear saved timer
        localStorage.removeItem(`zip-timer-${currentLevel.id}`);

        setGameState('completed');

        // Calculate score with flat hint penalty based on difficulty
        const rawScore = calculateScore(currentLevel, timer);

        // Hint Penalty: 50 points per hint (Consistent with Alchemy)
        const penaltyPerHint = 50;
        const totalPenalty = hintsUsed * penaltyPerHint;

        // Final Score = (Base + TimeBonus) - Penalty
        // Floor: 50 points
        const finalScore = Math.max(50, rawScore.score - totalPenalty);

        const scoreResult = {
            ...rawScore,
            score: finalScore
        };

        setScore(scoreResult);

        // Celebration
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF69B4', '#00CED1', '#98FB98'],
        });

        // Show pattern reveal after short delay
        setTimeout(() => {
            setShowReveal(true);
        }, 500);

        // Save logic
        try {
            const isDaily = currentLevel.id.toString().startsWith('daily-');

            if (isDaily) {
                // Daily Challenge Save
                await saveDailyResult(
                    'zip-path',
                    currentLevel.id.toString().replace('daily-', ''), // Date is part of ID
                    scoreResult.score,
                    timer
                );
                // Also save session for history, but use 0 or special ID for level/difficulty
                await saveGameSession(
                    'zip-path',
                    scoreResult.score,
                    2, // Medium difficulty equivalent
                    scoreResult.stars * 33.33,
                    { duration: timer, level: -1 }, // -1 indicates daily
                    true // Daily gets base XP
                );
            } else if (typeof currentLevel.id === 'string' && currentLevel.id.includes('extra')) {
                // Extra Daily Level
                // Just save session, maybe no persistent stars for now or handle differently
                await saveGameSession(
                    'zip-path',
                    scoreResult.score,
                    2,
                    scoreResult.stars * 33.33,
                    { duration: timer, level: -1 },
                    true
                );
            } else {
                // Campaign Level Save
                // Update level stars
                const currentStars = levelStars[currentLevel.id] || 0;
                if (scoreResult.stars > currentStars) {
                    setLevelStars(prev => ({ ...prev, [currentLevel.id]: scoreResult.stars }));
                }

                // Unlock next level
                if (typeof currentLevel.id === 'number') {
                    const nextLevelId = currentLevel.id + 1;
                    if (ALL_LEVELS.find(l => l.id === nextLevelId)) {
                        setUnlockedLevels(prev => new Set([...prev, nextLevelId]));
                    }

                    await saveLevelProgress('zip-path', currentLevel.id, scoreResult.stars);
                }

                await saveGameSession(
                    'zip-path',
                    scoreResult.score,
                    typeof currentLevel.id === 'number' ? currentLevel.id : 0,
                    scoreResult.stars * 33.33,
                    { duration: timer, level: typeof currentLevel.id === 'number' ? currentLevel.id : 0 },
                    false // No base XP, only stars
                );
            }
        } catch (e) {
            console.error('Failed to save game session', e);
        }
    };

    const startLevel = (level: ZipLevel) => {
        setCurrentLevel(level);
        setGameState('playing');
    };

    const resetLevel = () => {
        initializeGrid();
        // Do NOT reset timer - keep total time
        // setTimer(0); 
        // localStorage.removeItem(`zip-timer-${currentLevel.id}`);
        setTimerRunning(true); // Auto-restart on reset
        setShowReveal(false);
        setGameState('playing');
    };

    const nextLevel = () => {
        if (typeof currentLevel.id === 'number') {
            const nextLevelData = ALL_LEVELS.find(l => l.id === (currentLevel.id as number) + 1);
            if (nextLevelData) {
                setCurrentLevel(nextLevelData);
                setGameState('playing');
            }
        } else {
            // For daily/extra levels, maybe go back to menu or find next extra?
            goToMenu();
        }
    };

    const goToMenu = () => {
        setTimerRunning(false); // Pause timer
        setGameState('menu');
        setShowReveal(false);
    };

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleHint = () => {
        if (gameState !== 'playing') return;

        // 1. Try to find solution from current path
        const solution = solveZipLevel(currentLevel, path);

        if (solution) {
            // Valid path so far! Show next step
            const nextStep = solution[path.length];
            if (nextStep) {
                setHintCell(nextStep);
                setHintsUsed(h => h + 1);

                // Clear hint after 2 seconds
                setTimeout(() => setHintCell(null), 2000);
            }
        } else {
            // Current path is invalid (dead end)
            // Suggest backtracking
            // We could find the last valid prefix, but for now just alert
            alert("You're off track! Try backtracking.");
        }
    };




    // Render loading screen if daily challenge is loading
    if (isLoadingDaily) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-cyan-400 font-medium animate-pulse">Loading Daily Challenge...</p>
                </div>
            </div>
        );
    }

    // Render level selection menu
    if (gameState === 'menu') {
        if (showDailyLeaderboard) {
            return (
                <div className="w-full max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Daily Leaderboard</h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowDailyLeaderboard(false)}>Close</Button>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                        {dailyLeaderboard.length === 0 ? (
                            <p className="text-slate-400 text-center">No scores yet today. Be the first!</p>
                        ) : (
                            dailyLeaderboard.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-6 h-6 flex items-center justify-center font-bold rounded-full text-xs",
                                            idx === 0 ? "bg-yellow-500 text-black" :
                                                idx === 1 ? "bg-slate-300 text-black" :
                                                    idx === 2 ? "bg-amber-700 text-white" : "bg-slate-600 text-slate-300"
                                        )}>{idx + 1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">{entry.name || 'Anonymous'}</span>
                                            <span className="text-xs text-slate-400">{formatTime(entry.timeTaken)}</span>
                                        </div>
                                    </div>
                                    <div className="text-cyan-400 font-bold">{entry.score} pts</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            );
        }

        const displayLevels = [...ALL_LEVELS, ...extraLevels];

        return (
            <div className="w-full max-w-md mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-2xl font-bold text-white mb-2">Select Level</h2>
                    <p className="text-slate-400">Complete puzzles to unlock more!</p>
                </motion.div>

                <div className="space-y-3 mb-6">
                    <Button
                        variant="outline"
                        className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
                        onClick={() => router.push('/')}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {displayLevels.map((level, idx) => {
                        const isUnlocked = typeof level.id === 'string' ? true : unlockedLevels.has(level.id);
                        const stars = levelStars[level.id] || 0;
                        const isExtra = typeof level.id === 'string';

                        return (
                            <motion.button
                                key={level.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => isUnlocked && startLevel(level)}
                                disabled={!isUnlocked}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all",
                                    isUnlocked
                                        ? "bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600"
                                        : "bg-slate-800/50 border border-slate-700/50 cursor-not-allowed opacity-60",
                                    isExtra && "border-yellow-500/30"
                                )}
                            >
                                {isUnlocked ? (
                                    <>
                                        <span className={cn("text-lg font-bold text-white", isExtra && "text-sm")}>
                                            {isExtra ? level.name.replace('Daily Extra ', '#') : level.id}
                                        </span>
                                        <div className="flex gap-0.5 mt-1">
                                            {isExtra ? (
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    level.difficulty === 'easy' ? "bg-green-500" :
                                                        level.difficulty === 'medium' ? "bg-yellow-500" :
                                                            "bg-orange-500"
                                                )} />
                                            ) : (
                                                [1, 2, 3].map(s => (
                                                    <Star
                                                        key={s}
                                                        className={cn(
                                                            "w-3 h-3",
                                                            s <= stars ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
                                                        )}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <Lock className="w-5 h-5 text-slate-500" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {isLoadingExtra && (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                    </div>
                )}

                {/* Difficulty Legend */}
                <div className="mt-6 flex justify-center gap-4 text-xs">
                    {(['easy', 'medium', 'hard', 'expert'] as const).map(diff => (
                        <div key={diff} className="flex items-center gap-1">
                            <div className={cn(
                                "w-3 h-3 rounded-full",
                                diff === 'easy' ? "bg-green-500" :
                                    diff === 'medium' ? "bg-yellow-500" :
                                        diff === 'hard' ? "bg-orange-500" :
                                            "bg-red-500"
                            )} />
                            <span className="text-slate-400 capitalize">{diff}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Render pattern reveal
    if (showReveal) {
        return (
            <PatternReveal
                level={currentLevel}
                score={score}
                time={timer}
                onContinue={() => {
                    const isDaily = currentLevel.id.toString().startsWith('daily-');
                    if (isDaily) {
                        router.push('/daily-challenges/leaderboard?game=zip-path');
                    } else if (ALL_LEVELS.find(l => l.id === (currentLevel.id as number) + 1)) {
                        nextLevel();
                    } else {
                        goToMenu();
                    }
                }}
                onMenu={goToMenu}
            />
        );
    }

    return (
        <>
            <TutorialOverlay
                isOpen={showTutorial}
                title="How to Play Zip"
                onClose={() => {
                    setShowTutorial(false);
                    setHasSeenTutorial(true);
                }}
                onComplete={() => {
                    setShowTutorial(false);
                    setHasSeenTutorial(true);
                }}
                steps={[
                    {
                        title: "Connect the Numbers",
                        description: "Draw a path starting from 1 to 2, then 3, and so on, until you reach the final number.",
                        image: <div className="flex gap-2 items-center justify-center p-4 bg-slate-800 rounded-lg">
                            <div className="w-8 h-8 rounded bg-cyan-500 flex items-center justify-center font-bold text-white">1</div>
                            <div className="w-8 h-1 bg-cyan-500/50" />
                            <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-cyan-400">2</div>
                        </div>
                    },
                    {
                        title: "Fill the Grid",
                        description: "You must fill EVERY empty square in the grid. No empty spaces allowed!",
                        image: <Grid className="w-16 h-16 text-cyan-400" />
                    },
                    {
                        title: "Don't Cross Paths",
                        description: "Your path cannot cross itself or overlap. Plan your route carefully!",
                        image: <div className="relative w-16 h-16 bg-slate-800 rounded flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-red-500 rounded rotate-45" />
                        </div>
                    }
                ]}
            />
            <div className="w-full max-w-md mx-auto min-h-[90dvh] flex flex-col justify-center">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToMenu}
                        className="text-slate-400 hover:text-white"
                    >
                        <Home className="w-4 h-4 mr-1" />
                        Menu
                    </Button>

                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium",
                            currentLevel.difficulty === 'easy' ? "bg-green-500/20 text-green-400" :
                                currentLevel.difficulty === 'medium' ? "bg-yellow-500/20 text-yellow-400" :
                                    currentLevel.difficulty === 'hard' ? "bg-orange-500/20 text-orange-400" :
                                        "bg-red-500/20 text-red-400"
                        )}>
                            {currentLevel.name}
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleHint}
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-yellow-400"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Hint
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 text-white font-mono">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{formatTime(timer)}</span>
                    </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    {Object.keys(currentLevel.numbers).map((num) => (
                        <div
                            key={num}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                parseInt(num) <= currentNumber
                                    ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white scale-110"
                                    : "bg-slate-700 text-slate-400"
                            )}
                        >
                            {num}
                        </div>
                    ))}
                </div>

                {/* Game Grid */}
                <div
                    ref={gridRef}
                    className="relative mx-auto rounded-2xl overflow-hidden bg-slate-800/50 border border-slate-700 p-1"
                    style={{
                        width: cellSize.current * currentLevel.gridSize + 8,
                        height: cellSize.current * currentLevel.gridSize + 8,
                        touchAction: 'none',
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <div
                        className="grid gap-0.5"
                        style={{ gridTemplateColumns: `repeat(${currentLevel.gridSize}, 1fr)` }}
                    >
                        {grid.map((row, r) =>
                            row.map((cell, c) => (
                                <motion.div
                                    key={`${r}-${c}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (r * currentLevel.gridSize + c) * 0.01 }}
                                    className={cn(
                                        "rounded-lg flex items-center justify-center transition-all duration-100",
                                        cell.isBlocked
                                            ? "bg-slate-900 border border-slate-700"
                                            : cell.isPath
                                                ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                                                : "bg-slate-700/50 hover:bg-slate-700",
                                        cell.isNumber && "ring-2 ring-white/50",
                                        hintCell?.row === r && hintCell?.col === c && "ring-4 ring-yellow-400 animate-pulse bg-yellow-500/20"
                                    )}
                                    style={{
                                        width: cellSize.current - 2,
                                        height: cellSize.current - 2,
                                    }}
                                >
                                    {cell.isBlocked ? (
                                        <div className="w-3 h-3 rounded-full bg-slate-600" />
                                    ) : cell.isNumber ? (
                                        <span className={cn(
                                            "text-lg font-bold",
                                            cell.isPath ? "text-white" : "text-cyan-400"
                                        )}>
                                            {cell.number}
                                        </span>
                                    ) : cell.isPath ? (
                                        <div className="w-2 h-2 rounded-full bg-white/30" />
                                    ) : null}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={resetLevel}
                        className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                </div>

                {/* Hint */}
                <p className="text-center text-slate-500 text-sm mt-4">
                    Connect numbers in order (1→2→3...) while filling every cell
                </p>
            </div>
        </>
    );
}
