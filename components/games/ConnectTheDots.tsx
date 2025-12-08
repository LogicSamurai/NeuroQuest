"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Check, X, Maximize2, Lock, Star, Grid } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveLevelProgress, getLevelProgress } from "@/app/actions";

// Grid size
const GRID_SIZE = 5;

// Node types
type Color = "RED" | "BLUE" | "GREEN" | "YELLOW" | "PURPLE" | "ORANGE";
const COLORS: Record<Color, string> = {
    RED: "bg-red-500",
    BLUE: "bg-blue-500",
    GREEN: "bg-green-500",
    YELLOW: "bg-yellow-400",
    PURPLE: "bg-purple-500",
    ORANGE: "bg-orange-500",
};

const STROKE_COLORS: Record<Color, string> = {
    RED: "#ef4444",
    BLUE: "#3b82f6",
    GREEN: "#22c55e",
    YELLOW: "#facc15",
    PURPLE: "#a855f7",
    ORANGE: "#f97316",
};

interface Point {
    r: number;
    c: number;
}

interface Level {
    id: number;
    nodes: { color: Color; start: Point; end: Point }[];
}

const LEVELS: Level[] = [
    {
        id: 1,
        nodes: [
            { color: "RED", start: { r: 0, c: 0 }, end: { r: 4, c: 0 } },
            { color: "BLUE", start: { r: 0, c: 1 }, end: { r: 4, c: 1 } },
            { color: "GREEN", start: { r: 0, c: 2 }, end: { r: 4, c: 2 } },
            { color: "YELLOW", start: { r: 0, c: 3 }, end: { r: 4, c: 3 } },
            { color: "PURPLE", start: { r: 0, c: 4 }, end: { r: 4, c: 4 } },
        ],
    },
    {
        id: 2,
        nodes: [
            { color: "RED", start: { r: 0, c: 0 }, end: { r: 0, c: 4 } },
            { color: "BLUE", start: { r: 1, c: 0 }, end: { r: 1, c: 4 } },
            { color: "GREEN", start: { r: 2, c: 0 }, end: { r: 2, c: 4 } },
            { color: "YELLOW", start: { r: 3, c: 0 }, end: { r: 3, c: 4 } },
            { color: "PURPLE", start: { r: 4, c: 0 }, end: { r: 4, c: 4 } },
        ],
    },
    {
        id: 3,
        nodes: [
            { color: "RED", start: { r: 0, c: 0 }, end: { r: 1, c: 0 } },
            { color: "BLUE", start: { r: 0, c: 1 }, end: { r: 1, c: 1 } },
            { color: "GREEN", start: { r: 0, c: 2 }, end: { r: 1, c: 2 } },
            { color: "YELLOW", start: { r: 0, c: 3 }, end: { r: 1, c: 3 } },
            { color: "PURPLE", start: { r: 0, c: 4 }, end: { r: 1, c: 4 } },
            { color: "ORANGE", start: { r: 2, c: 0 }, end: { r: 2, c: 4 } },
        ],
    },
    {
        id: 4,
        nodes: [
            { color: "RED", start: { r: 0, c: 0 }, end: { r: 4, c: 0 } },
            { color: "BLUE", start: { r: 0, c: 1 }, end: { r: 4, c: 1 } },
            { color: "GREEN", start: { r: 0, c: 2 }, end: { r: 4, c: 2 } },
            { color: "YELLOW", start: { r: 0, c: 3 }, end: { r: 4, c: 4 } },
        ],
    },
    {
        id: 5,
        nodes: [
            { color: "RED", start: { r: 0, c: 0 }, end: { r: 4, c: 1 } },
            { color: "BLUE", start: { r: 0, c: 2 }, end: { r: 4, c: 3 } },
            { color: "GREEN", start: { r: 0, c: 4 }, end: { r: 4, c: 4 } },
        ],
    },
];

export default function ConnectTheDots() {
    const [view, setView] = useState<"grid" | "game">("grid");
    const [levelIdx, setLevelIdx] = useState(0);
    const [maxLevel, setMaxLevel] = useState(1);
    const [levelStars, setLevelStars] = useState<Record<number, number>>({});

    const [paths, setPaths] = useState<Record<string, Point[]>>({});
    const [activeColor, setActiveColor] = useState<Color | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [cellSize, setCellSize] = useState(60);
    const [coverage, setCoverage] = useState(0);

    const gridRef = useRef<HTMLDivElement>(null);

    // Load Progress
    useEffect(() => {
        const loadProgress = async () => {
            const progress = await getLevelProgress("connect-the-dots");
            setMaxLevel(progress.levelReached);
            setLevelStars(progress.stars);
        };
        loadProgress();
    }, [view]); // Reload when returning to grid

    const currentLevel = LEVELS[levelIdx];

    // Initialize paths
    useEffect(() => {
        if (view === "game") {
            const initialPaths: Record<string, Point[]> = {};
            currentLevel.nodes.forEach(n => {
                initialPaths[n.color] = [];
            });
            setPaths(initialPaths);
            setCoverage(0);
            setIsComplete(false);
        }
    }, [currentLevel, view]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (gridRef.current) {
                const width = gridRef.current.offsetWidth;
                setCellSize(width / GRID_SIZE);
            }
        };
        if (view === "game") {
            // Small delay to ensure DOM is rendered
            setTimeout(handleResize, 100);
            window.addEventListener("resize", handleResize);
        }
        return () => window.removeEventListener("resize", handleResize);
    }, [view]);

    const getCellFromCoords = (x: number, y: number) => {
        if (!gridRef.current) return null;
        const rect = gridRef.current.getBoundingClientRect();
        const r = Math.floor((y - rect.top) / cellSize);
        const c = Math.floor((x - rect.left) / cellSize);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            return { r, c };
        }
        return null;
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isComplete) return;
        const cell = getCellFromCoords(e.clientX, e.clientY);
        if (!cell) return;

        // Check if clicking a start/end node
        const node = currentLevel.nodes.find(n =>
            (n.start.r === cell.r && n.start.c === cell.c) ||
            (n.end.r === cell.r && n.end.c === cell.c)
        );

        if (node) {
            setActiveColor(node.color);
            setPaths(prev => ({ ...prev, [node.color]: [cell] }));
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!activeColor || isComplete) return;
        e.preventDefault();

        const cell = getCellFromCoords(e.clientX, e.clientY);
        if (!cell) return;

        setPaths(prev => {
            const currentPath = prev[activeColor];
            const lastPoint = currentPath[currentPath.length - 1];

            // Only add if adjacent and not same
            if (lastPoint && (Math.abs(lastPoint.r - cell.r) + Math.abs(lastPoint.c - cell.c) === 1)) {

                // Check collision with other paths
                const isOccupied = Object.entries(prev).some(([color, path]) =>
                    color !== activeColor && path.some(p => p.r === cell.r && p.c === cell.c)
                );

                // Check collision with nodes of OTHER colors
                const isOtherNode = currentLevel.nodes.some(n =>
                    n.color !== activeColor &&
                    ((n.start.r === cell.r && n.start.c === cell.c) || (n.end.r === cell.r && n.end.c === cell.c))
                );

                // Check self collision (backtracking)
                const existingIdx = currentPath.findIndex(p => p.r === cell.r && p.c === cell.c);

                if (!isOccupied && !isOtherNode && existingIdx === -1) {
                    return { ...prev, [activeColor]: [...currentPath, cell] };
                } else if (existingIdx !== -1) {
                    // Backtracking
                    return { ...prev, [activeColor]: currentPath.slice(0, existingIdx + 1) };
                }
            }
            return prev;
        });
    };

    const handlePointerUp = () => {
        setActiveColor(null);
        checkWinCondition();
    };

    const checkWinCondition = useCallback(() => {
        // 1. All pairs connected
        const allConnected = currentLevel.nodes.every(node => {
            const path = paths[node.color];
            if (!path || path.length < 2) return false;
            const start = path[0];
            const end = path[path.length - 1];

            const isStartNode = (start.r === node.start.r && start.c === node.start.c) || (start.r === node.end.r && start.c === node.end.c);
            const isEndNode = (end.r === node.start.r && end.c === node.start.c) || (end.r === node.end.r && end.c === node.end.c);

            return isStartNode && isEndNode && (start.r !== end.r || start.c !== end.c);
        });

        // 2. Calculate Coverage
        const totalCells = GRID_SIZE * GRID_SIZE;
        const filledCells = new Set();
        Object.values(paths).forEach(path => {
            path.forEach(p => filledCells.add(`${p.r},${p.c}`));
        });
        const currentCoverage = Math.round((filledCells.size / totalCells) * 100);
        setCoverage(currentCoverage);

        if (allConnected && currentCoverage === 100) {
            setIsComplete(true);
            // Save Progress
            saveLevelProgress("connect-the-dots", levelIdx + 1, 3); // 3 stars for perfect
        }
    }, [paths, currentLevel, levelIdx]);

    useEffect(() => {
        if (activeColor === null) {
            checkWinCondition();
        }
    }, [activeColor, checkWinCondition]);


    const nextLevel = () => {
        if (levelIdx + 1 < LEVELS.length) {
            setLevelIdx(l => l + 1);
            // Reset handled by useEffect on currentLevel change
        } else {
            setView("grid");
        }
    };

    const resetLevel = () => {
        const initialPaths: Record<string, Point[]> = {};
        currentLevel.nodes.forEach(n => {
            initialPaths[n.color] = [];
        });
        setPaths(initialPaths);
        setCoverage(0);
        setIsComplete(false);
    };

    if (view === "grid") {
        return (
            <div className="w-full max-w-4xl mx-auto p-8">
                <h1 className="text-4xl font-bold text-white mb-8 text-center">Select Level</h1>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {LEVELS.map((level, i) => {
                        const isLocked = i + 1 > maxLevel;
                        const stars = levelStars[i + 1] || 0;
                        return (
                            <motion.button
                                key={level.id}
                                whileHover={!isLocked ? { scale: 1.05 } : {}}
                                whileTap={!isLocked ? { scale: 0.95 } : {}}
                                onClick={() => {
                                    if (!isLocked) {
                                        setLevelIdx(i);
                                        setView("game");
                                    }
                                }}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center border-2 relative overflow-hidden",
                                    isLocked
                                        ? "bg-slate-900 border-slate-800 cursor-not-allowed opacity-50"
                                        : "bg-slate-800 border-cyan-500/50 hover:border-cyan-400 cursor-pointer shadow-lg"
                                )}
                            >
                                {isLocked ? (
                                    <Lock className="w-8 h-8 text-slate-600" />
                                ) : (
                                    <>
                                        <span className="text-2xl font-bold text-white mb-1">{level.id}</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3].map(s => (
                                                <Star
                                                    key={s}
                                                    className={cn("w-3 h-3", s <= stars ? "fill-yellow-400 text-yellow-400" : "text-slate-600")}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto min-h-[600px] bg-slate-900/50 rounded-xl p-4 md:p-8 border border-slate-700 shadow-2xl backdrop-blur-sm flex flex-col items-center justify-center gap-8 select-none">

            <div className="flex justify-between w-full max-w-md items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Level {levelIdx + 1}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Maximize2 className="w-4 h-4 text-cyan-400" />
                            <span className={cn("text-sm font-bold", coverage === 100 ? "text-green-400" : "text-slate-400")}>
                                {coverage}%
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={resetLevel} variant="outline" size="icon">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setView("grid")} variant="outline" size="icon">
                        <Grid className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div
                className="relative bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner w-full max-w-[400px] aspect-square"
            >
                {/* Grid Container */}
                <div
                    ref={gridRef}
                    className="w-full h-full relative touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* Grid Lines */}
                    <div
                        className="absolute inset-0 grid gap-0 pointer-events-none"
                        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
                    >
                        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                            <div key={i} className="w-full h-full border border-slate-800/50" />
                        ))}
                    </div>

                    {/* Nodes */}
                    {currentLevel.nodes.map((node, i) => (
                        <div key={i} className="pointer-events-none">
                            <div
                                className={cn("absolute w-[60%] h-[60%] rounded-full border-4 border-white/20 shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-20", COLORS[node.color])}
                                style={{ left: `${(node.start.c + 0.5) * cellSize}px`, top: `${(node.start.r + 0.5) * cellSize}px`, width: cellSize * 0.6, height: cellSize * 0.6 }}
                            />
                            <div
                                className={cn("absolute w-[60%] h-[60%] rounded-full border-4 border-white/20 shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-20", COLORS[node.color])}
                                style={{ left: `${(node.end.c + 0.5) * cellSize}px`, top: `${(node.end.r + 0.5) * cellSize}px`, width: cellSize * 0.6, height: cellSize * 0.6 }}
                            />
                        </div>
                    ))}

                    {/* SVG Paths Layer */}
                    <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible">
                        {Object.entries(paths).map(([color, path]) => {
                            if (path.length < 2) return null;
                            const d = path.map((p, i) =>
                                `${i === 0 ? 'M' : 'L'} ${(p.c + 0.5) * cellSize} ${(p.r + 0.5) * cellSize}`
                            ).join(' ');

                            return (
                                <motion.path
                                    key={color}
                                    d={d}
                                    stroke={STROKE_COLORS[color as Color]}
                                    strokeWidth={cellSize * 0.4}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.8 }}
                                    transition={{ duration: 0.1 }}
                                />
                            );
                        })}
                    </svg>
                </div>
            </div>

            {isComplete && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 rounded-xl"
                >
                    <div className="text-center bg-slate-900 p-8 rounded-2xl border border-green-500/50 shadow-2xl">
                        <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Perfect Flow!</h2>
                        <p className="text-slate-400 mb-6">Grid 100% Covered.</p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => setView("grid")} variant="outline">
                                Menu
                            </Button>
                            <Button onClick={nextLevel} size="lg" className="bg-green-600 hover:bg-green-500 text-white font-bold">
                                Next Level
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

        </div>
    );
}
