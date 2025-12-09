"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Play, RotateCcw, ChevronLeft, ChevronRight, Trophy, Clock,
    Star, Lock, Sparkles, Grid, Home, Zap, MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_LEVELS, ZipLevel, calculateScore } from "@/lib/games/zip-path/levels";
import PatternReveal from "./PatternReveal";
import TutorialOverlay from "./TutorialOverlay";
import confetti from "canvas-confetti";
import { saveGameSession, saveLevelProgress } from "@/app/actions";

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
}

export default function ZipPathGame({ initialProgress }: ZipPathGameProps) {
    const router = useRouter();
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

    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(false);
    const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

    useEffect(() => {
        // Show tutorial if no levels completed (stars is empty) and haven't seen it yet
        const hasCompletedLevels = initialProgress?.stars && Object.keys(initialProgress.stars).length > 0;
        if (!hasCompletedLevels && !hasSeenTutorial) {
            setShowTutorial(true);
        }
    }, [initialProgress, hasSeenTutorial]);

    // Initialize unlocked levels based on progress
    const [unlockedLevels, setUnlockedLevels] = useState<Set<number>>(() => {
        const maxLevel = initialProgress?.levelReached || 1;
        const levels = new Set<number>();
        for (let i = 1; i <= maxLevel; i++) {
            levels.add(i);
        }
        return levels;
    });

    const [levelStars, setLevelStars] = useState<Record<number, number>>(initialProgress?.stars || {});

    const gridRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const cellSize = useRef(50);

    // Initialize grid for current level
    const initializeGrid = useCallback(() => {
        const size = currentLevel.gridSize;
        const newGrid: CellState[][] = Array(size).fill(null).map(() =>
            Array(size).fill(null).map(() => ({
                isPath: false,
                pathOrder: -1,
                isNumber: false,
                isBlocked: false,
            }))
        );

        // Mark number cells
        Object.entries(currentLevel.numbers).forEach(([num, pos]) => {
            newGrid[pos.row][pos.col].isNumber = true;
            newGrid[pos.row][pos.col].number = parseInt(num);
        });

        // Mark blocked cells
        currentLevel.blocked.forEach(pos => {
            newGrid[pos.row][pos.col].isBlocked = true;
        });

        setGrid(newGrid);
        setPath([]);
        setCurrentNumber(1);
    }, [currentLevel]);

    // Timer effect
    useEffect(() => {
        if (timerRunning) {
            timerRef.current = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerRunning]);

    // Initialize on level change
    useEffect(() => {
        initializeGrid();
        setTimer(0);
        setTimerRunning(false);
        setShowReveal(false);
    }, [currentLevel, initializeGrid]);

    // Calculate cell size based on container
    useEffect(() => {
        if (gridRef.current) {
            const containerSize = Math.min(window.innerWidth - 32, 400);
            cellSize.current = Math.floor(containerSize / currentLevel.gridSize);
        }
    }, [currentLevel.gridSize]);

    // Get cell from pointer coordinates
    const getCellFromCoords = (e: React.PointerEvent): { row: number; col: number } | null => {
        if (!gridRef.current) return null;
        const rect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / cellSize.current);
        const row = Math.floor(y / cellSize.current);

        if (row >= 0 && row < currentLevel.gridSize && col >= 0 && col < currentLevel.gridSize) {
            return { row, col };
        }
        return null;
    };

    // Check if cells are adjacent
    const isAdjacent = (a: { row: number; col: number }, b: { row: number; col: number }) => {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
    };

    // Start drawing path
    const handlePointerDown = (e: React.PointerEvent) => {
        if (gameState !== 'playing') return;

        const cell = getCellFromCoords(e);
        if (!cell) return;

        const cellState = grid[cell.row][cell.col];

        // Must start from number 1
        if (path.length === 0) {
            if (cellState.isNumber && cellState.number === 1) {
                setIsDrawing(true);
                setPath([cell]);

                // Update grid
                const newGrid = [...grid];
                newGrid[cell.row][cell.col] = { ...cellState, isPath: true, pathOrder: 0 };
                setGrid(newGrid);

                // Start timer
                if (!timerRunning) setTimerRunning(true);
            }
        } else {
            // Check if clicking on last cell to continue
            const lastCell = path[path.length - 1];
            if (cell.row === lastCell.row && cell.col === lastCell.col) {
                setIsDrawing(true);
            }
        }
    };

    // Continue drawing path
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing || gameState !== 'playing') return;

        const cell = getCellFromCoords(e);
        if (!cell) return;

        const cellState = grid[cell.row][cell.col];
        const lastCell = path[path.length - 1];

        // Can't go to blocked cells
        if (cellState.isBlocked) return;

        // Can't revisit cells already in path
        if (cellState.isPath) {
            // Allow backtracking by undoing last move
            if (path.length > 1) {
                const secondLast = path[path.length - 2];
                if (cell.row === secondLast.row && cell.col === secondLast.col) {
                    const newGrid = [...grid];
                    newGrid[lastCell.row][lastCell.col] = {
                        ...grid[lastCell.row][lastCell.col],
                        isPath: false,
                        pathOrder: -1,
                    };
                    setGrid(newGrid);

                    const newPath = path.slice(0, -1);
                    setPath(newPath);

                    // If we removed a number, decrement current number
                    if (grid[lastCell.row][lastCell.col].isNumber) {
                        setCurrentNumber(n => n - 1);
                    }
                }
            }
            return;
        }

        // Must be adjacent to last cell
        if (!isAdjacent(lastCell, cell)) return;

        // If this is a number cell, it must be the next number
        if (cellState.isNumber && cellState.number !== currentNumber + 1) {
            return;
        }

        // Add to path
        const newGrid = [...grid];
        newGrid[cell.row][cell.col] = {
            ...cellState,
            isPath: true,
            pathOrder: path.length,
        };
        setGrid(newGrid);

        const newPath = [...path, cell];
        setPath(newPath);

        // If we hit a number, increment current number
        let newCurrentNumber = currentNumber;
        if (cellState.isNumber) {
            newCurrentNumber = currentNumber + 1;
            setCurrentNumber(newCurrentNumber);
        }

        // Check for completion
        checkCompletion(newGrid, newPath, newCurrentNumber);
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
    };

    // Check if puzzle is complete
    const checkCompletion = (currentGrid: CellState[][], currentPath: { row: number; col: number }[], reachedNumber: number) => {
        // Count non-blocked cells
        let totalCells = 0;
        let pathCells = 0;

        for (let r = 0; r < currentLevel.gridSize; r++) {
            for (let c = 0; c < currentLevel.gridSize; c++) {
                if (!currentGrid[r][c].isBlocked) {
                    totalCells++;
                    if (currentGrid[r][c].isPath) {
                        pathCells++;
                    }
                }
            }
        }



        // STRICT RULE 1: Full Coverage - All non-blocked cells must be filled
        if (pathCells !== totalCells) return;

        // STRICT RULE 2: End Point - The path MUST end at the maximum number
        const maxNumber = Math.max(...Object.keys(currentLevel.numbers).map(Number));
        const lastPathCell = currentPath[currentPath.length - 1];
        const lastCellState = currentGrid[lastPathCell.row][lastPathCell.col];

        // Ensure the last cell in the path is actually the max number
        if (!lastCellState.isNumber || lastCellState.number !== maxNumber) return;

        // STRICT RULE 3: Sequential Order (Implicitly handled by drawing logic, but double check)
        if (reachedNumber !== maxNumber) return;

        // Puzzle complete!
        handleComplete();
    };

    const handleComplete = async () => {
        setTimerRunning(false);
        setGameState('completed');

        const scoreResult = calculateScore(currentLevel, timer);
        setScore(scoreResult);

        // Update level stars
        const currentStars = levelStars[currentLevel.id] || 0;
        if (scoreResult.stars > currentStars) {
            setLevelStars(prev => ({ ...prev, [currentLevel.id]: scoreResult.stars }));
        }

        // Unlock next level
        const nextLevelId = currentLevel.id + 1;
        if (ALL_LEVELS.find(l => l.id === nextLevelId)) {
            setUnlockedLevels(prev => new Set([...prev, nextLevelId]));
        }

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

        // Save to leaderboard
        try {
            await saveGameSession(
                'zip-path',
                scoreResult.score,
                currentLevel.id,
                scoreResult.stars * 33.33,
                { duration: timer, level: currentLevel.id }
            );

            // Save level progress (stars and level reached)
            await saveLevelProgress('zip-path', currentLevel.id, scoreResult.stars);
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
        setTimer(0);
        setTimerRunning(false);
        setShowReveal(false);
        setGameState('playing');
    };

    const nextLevel = () => {
        const nextLevelData = ALL_LEVELS.find(l => l.id === currentLevel.id + 1);
        if (nextLevelData) {
            setCurrentLevel(nextLevelData);
            setGameState('playing');
        }
    };

    const goToMenu = () => {
        setGameState('menu');
        setShowReveal(false);
    };

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render level selection menu
    if (gameState === 'menu') {
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

                <Button
                    variant="outline"
                    className="w-full mb-6 border-slate-700 hover:bg-slate-800 text-slate-300"
                    onClick={() => router.push('/')}
                >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>

                <div className="grid grid-cols-4 gap-3">
                    {ALL_LEVELS.map((level, idx) => {
                        const isUnlocked = unlockedLevels.has(level.id);
                        const stars = levelStars[level.id] || 0;

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
                                        : "bg-slate-800/50 border border-slate-700/50 cursor-not-allowed opacity-60"
                                )}
                            >
                                {isUnlocked ? (
                                    <>
                                        <span className="text-lg font-bold text-white">{level.id}</span>
                                        <div className="flex gap-0.5 mt-1">
                                            {[1, 2, 3].map(s => (
                                                <Star
                                                    key={s}
                                                    className={cn(
                                                        "w-3 h-3",
                                                        s <= stars ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <Lock className="w-5 h-5 text-slate-500" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

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
                    if (ALL_LEVELS.find(l => l.id === currentLevel.id + 1)) {
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
            <div className="w-full max-w-md mx-auto">
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
                                        cell.isNumber && "ring-2 ring-white/50"
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
