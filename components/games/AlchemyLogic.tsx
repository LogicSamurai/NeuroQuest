"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Droplets, Wind, Mountain, Zap, Snowflake, Sun, Moon, RotateCcw, Play, Sparkles, Atom, Leaf, Skull, Heart, Star, Cloud, Anchor, Feather, Key, Trophy, ArrowRight, Lock, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveLevelProgress, getLevelProgress, saveDailyResult } from "@/app/actions";
import confetti from "canvas-confetti";

// Extended Icon Set (Fallback)
const ICONS = [
    Flame, Droplets, Wind, Mountain, Zap, Snowflake, Sun, Moon,
    Atom, Leaf, Skull, Heart, Star, Cloud, Anchor, Feather, Key
];

const COLORS = [
    "text-red-500", "text-blue-500", "text-slate-400", "text-amber-700",
    "text-yellow-400", "text-cyan-400", "text-orange-400", "text-purple-400",
    "text-emerald-500", "text-pink-500", "text-indigo-500", "text-lime-500"
];

const BG_COLORS = [
    "bg-red-500/20", "bg-blue-500/20", "bg-slate-400/20", "bg-amber-700/20",
    "bg-yellow-400/20", "bg-cyan-400/20", "bg-orange-400/20", "bg-purple-400/20",
    "bg-emerald-500/20", "bg-pink-500/20", "bg-indigo-500/20", "bg-lime-500/20"
];

interface Element {
    id: string;
    iconIdx: number; // Kept for fallback color
    colorIdx: number;
    name: string;
    tier: number;
    iconUrl?: string;
    description?: string;
}

interface Recipe {
    input1: string;
    input2: string;
    output: string;
}

interface LevelData {
    id: number;
    targetName: string;
    targetId: string;
    description: string;
}

interface AlchemyLogicProps {
    initialProgress?: {
        levelReached: number;
        stars: Record<number, number>;
    };
}

export default function AlchemyLogic({ initialProgress }: AlchemyLogicProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const autoDaily = searchParams.get('daily') === 'true';

    const [view, setView] = useState<"grid" | "game">("grid");
    const [levelIdx, setLevelIdx] = useState(0);
    const [maxLevel, setMaxLevel] = useState(initialProgress?.levelReached || 1);
    const [levelStars, setLevelStars] = useState<Record<number, number>>(initialProgress?.stars || {});

    const [levels, setLevels] = useState<LevelData[]>([]);
    const [elements, setElements] = useState<Element[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [discovered, setDiscovered] = useState<string[]>([]);
    const [history, setHistory] = useState<{ inputs: string[], output: string }[]>([]);

    const [cauldron, setCauldron] = useState<string[]>([]);
    const [isMixing, setIsMixing] = useState(false);
    const [notification, setNotification] = useState<{ name: string, icon: any } | null>(null);
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [timer, setTimer] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [isDaily, setIsDaily] = useState(false);
    const [dailyDate, setDailyDate] = useState<string>("");
    const [dailyLeaderboard, setDailyLeaderboard] = useState<any[]>([]);
    const [showDailyLeaderboard, setShowDailyLeaderboard] = useState(false);
    const [isLoadingDaily, setIsLoadingDaily] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [hintElements, setHintElements] = useState<string[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const currentLevel = levels[levelIdx];

    // Load Progress (only if not provided or on view change if needed)
    useEffect(() => {
        if (!initialProgress) {
            const loadProgress = async () => {
                const progress = await getLevelProgress("alchemy-logic");
                setMaxLevel(progress.levelReached);
                setLevelStars(progress.stars);
            };
            loadProgress();
        }
    }, [view, initialProgress]);

    // Initialize Game Data and Levels
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Game Data
                const resData = await fetch('/games/alchemy/data.json');
                const data = await resData.json();

                const loadedElements: Element[] = Object.values(data.elements).map((e: any) => ({
                    id: String(e.id),
                    name: e.name,
                    iconIdx: 0,
                    colorIdx: e.colorIdx || 0,
                    tier: e.tier || 0,
                    iconUrl: e.iconUrl,
                    description: e.description
                }));

                const loadedRecipes: Recipe[] = data.recipes.map((r: any) => ({
                    input1: String(r.ingredients[0]),
                    input2: String(r.ingredients[1]),
                    output: String(r.results[0])
                }));

                setElements(loadedElements);
                setRecipes(loadedRecipes);

                // Load Levels
                const resLevels = await fetch('/games/alchemy/levels.json');
                const loadedLevels = await resLevels.json();
                setLevels(loadedLevels);

                // Start with basic elements
                if (data.startingElementIds && Array.isArray(data.startingElementIds)) {
                    setDiscovered(data.startingElementIds.map(String));
                } else {
                    setDiscovered(["1", "2", "3", "4"]);
                }

            } catch (error) {
                console.error("Failed to load alchemy data:", error);
            }
        };
        loadData();
    }, []);

    // Auto-start daily if requested
    useEffect(() => {
        if (autoDaily && view === 'grid' && !isLoadingDaily) {
            // Small delay to ensure functions are ready
            setTimeout(() => {
                startDailyChallenge();
            }, 500);
        }
    }, [autoDaily]);

    // Reset level state when entering game view or changing level
    useEffect(() => {
        if (view === "game") {
            setCauldron([]);
            setIsLevelComplete(false);
            setNotification(null);
            setTimer(0);
            setTimerRunning(true);
            setHintsUsed(0);
            setHintElements([]);

            // Reset discovered elements to basics for the new level
            // This ensures players have to rediscover/recreate complex elements for each level challenge
            // or at least starts them fresh.
            setDiscovered(["1", "2", "3", "4"]);
        } else {
            setTimerRunning(false);
            setIsDaily(false);
        }
    }, [view, levelIdx]);

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerRunning) {
            interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startDailyChallenge = async () => {
        setIsLoadingDaily(true);
        try {
            const res = await fetch('/api/daily?gameId=alchemy-logic');
            if (!res.ok) throw new Error('Failed to fetch daily');
            const level = await res.json();

            // Transform daily level data to match LevelData interface
            const dailyLevel: LevelData = {
                id: 999, // Special ID for daily
                targetName: level.targetName,
                targetId: level.targetId,
                description: level.description
            };

            // Extract date from level ID (daily-YYYY-MM-DD)
            if (level.id && typeof level.id === 'string' && level.id.startsWith('daily-')) {
                setDailyDate(level.id.replace('daily-', ''));
            } else {
                setDailyDate(new Date().toISOString().split('T')[0]);
            }

            // We need to inject this level into the levels array temporarily or handle it separately
            // For simplicity, we'll append it and select it
            setLevels(prev => [...prev, dailyLevel]);
            setLevelIdx(levels.length); // It will be at the end
            setIsDaily(true);
            setView("game");
        } catch (e) {
            console.error("Failed to load daily challenge:", e);
        } finally {
            setIsLoadingDaily(false);
        }
    };

    const fetchDailyLeaderboard = async () => {
        try {
            const res = await fetch('/api/daily/leaderboard?gameId=alchemy-logic');
            if (res.ok) {
                const data = await res.json();
                setDailyLeaderboard(data.leaderboard || []);
                setShowDailyLeaderboard(true);
            }
        } catch (e) {
            console.error("Failed to fetch leaderboard", e);
        }
    };

    // Scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const getElement = (id: string) => elements.find(e => e.id === id);

    const addToCauldron = (id: string) => {
        if (cauldron.length < 2 && !isMixing && !isLevelComplete) {
            setCauldron(prev => [...prev, id]);
        }
    };

    const removeFromCauldron = (index: number) => {
        if (!isMixing && !isLevelComplete) {
            setCauldron(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Auto-mix
    useEffect(() => {
        if (cauldron.length === 2 && !isMixing) {
            setIsMixing(true);
            setTimeout(() => {
                mixElements();
                setIsMixing(false);
            }, 1000);
        }
    }, [cauldron, isMixing]);

    const mixElements = () => {
        const [id1, id2] = cauldron;

        // Find recipe
        let recipe = recipes.find(r =>
            (r.input1 === id1 && r.input2 === id2) ||
            (r.input1 === id2 && r.input2 === id1)
        );

        if (!recipe) {
            setCauldron([]);
            setIsMixing(false);
            return;
        }

        const outputId = recipe.output;
        const resultElement = elements.find(e => e.id === outputId);

        if (!resultElement) {
            setCauldron([]);
            return;
        }

        // Discovery Logic
        let isNewDiscovery = false;
        if (!discovered.includes(outputId)) {
            setDiscovered(prev => [...prev, outputId]);
            isNewDiscovery = true;
        }

        if (isNewDiscovery) {
            setNotification({ name: resultElement.name, icon: resultElement });
            setTimeout(() => setNotification(null), 2000);

            // Check Win
            if (currentLevel && resultElement.id === currentLevel.targetId) {
                handleWin();
            }
        } else {
            // Check Win even if already discovered (in case they are re-playing)
            if (currentLevel && resultElement.id === currentLevel.targetId) {
                handleWin();
            }
        }

        setHistory(prev => [...prev, { inputs: [id1, id2], output: outputId }]);
        setCauldron([]);
    };

    const handleWin = async () => {
        setIsLevelComplete(true);
        setTimerRunning(false);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#3b82f6', '#ef4444', '#eab308']
        });

        if (isDaily) {
            // Use the date from the level, or fallback to today
            const date = dailyDate || new Date().toISOString().split('T')[0];
            // Reduce score by 10 per hint (min 10)
            const score = Math.max(10, 100 - (hintsUsed * 10));
            await saveDailyResult('alchemy-logic', date, score, timer);
        } else {
            // Reduce stars: 0 hints = 3 stars, 1-2 hints = 2 stars, 3+ = 1 star
            const stars = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;
            saveLevelProgress("alchemy-logic", levelIdx + 1, stars);
        }
    };

    const handleHint = () => {
        if (!currentLevel || isLevelComplete) return;

        setHintsUsed(prev => prev + 1);
        setHintElements([]); // Clear previous hints

        const targetId = currentLevel.targetId;

        // Strategy 1: Find a recipe that directly produces the target using discovered elements
        const directRecipe = recipes.find(r =>
            r.output === targetId &&
            discovered.includes(r.input1) &&
            discovered.includes(r.input2)
        );

        if (directRecipe) {
            setHintElements([directRecipe.input1, directRecipe.input2]);
            return;
        }

        // Strategy 2: Find a recipe that produces an undiscovered element using discovered elements
        const intermediateRecipe = recipes.find(r =>
            !discovered.includes(r.output) &&
            discovered.includes(r.input1) &&
            discovered.includes(r.input2)
        );

        if (intermediateRecipe) {
            setHintElements([intermediateRecipe.input1, intermediateRecipe.input2]);
            return;
        }

        // Strategy 3: If no useful recipe found, just highlight two random discovered elements
        if (discovered.length >= 2) {
            const shuffled = [...discovered].sort(() => 0.5 - Math.random());
            setHintElements([shuffled[0], shuffled[1]]);
        } else if (discovered.length === 1) {
            setHintElements([discovered[0]]);
        }
    };

    const nextLevel = () => {
        if (levelIdx + 1 < levels.length) {
            setLevelIdx(l => l + 1);
        } else {
            setView("grid");
        }
    };

    const renderIcon = (element: Element | undefined, size: string = "w-6 h-6") => {
        if (!element) return null;

        if (element.iconUrl) {
            return (
                <div className={cn("relative rounded-md overflow-hidden flex items-center justify-center", size)}>
                    <img
                        src={element.iconUrl}
                        alt={element.name}
                        className="w-full h-full object-contain"
                    />
                </div>
            );
        }

        const Icon = ICONS[element.iconIdx % ICONS.length];
        return <Icon className={cn(size, COLORS[element.colorIdx])} />;
    };

    if (view === "grid") {
        return (
            <div className="w-full max-w-4xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-white text-center flex-1">Select Level</h1>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                        className="border-slate-700 hover:bg-slate-800 text-slate-300"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </Button>
                </div>

                <div className="mb-8 flex justify-center gap-4">
                    <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                        onClick={startDailyChallenge}
                        disabled={isLoadingDaily}
                    >
                        {isLoadingDaily ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Daily Challenge
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={fetchDailyLeaderboard}
                    >
                        View Today's Leaderboard
                    </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {levels.map((level, i) => {
                        const isLocked = i + 1 > maxLevel;
                        const stars = levelStars[i + 1] || 0;

                        // Find target element to get its icon
                        const targetEl = elements.find(e => e.id === level.targetId);

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
                                    "aspect-square rounded-xl flex flex-col items-center justify-center border-2 relative overflow-hidden p-2",
                                    isLocked
                                        ? "bg-slate-900 border-slate-800 cursor-not-allowed opacity-50"
                                        : "bg-slate-800 border-purple-500/50 hover:border-purple-400 cursor-pointer shadow-lg"
                                )}
                            >
                                {isLocked ? (
                                    <Lock className="w-8 h-8 text-slate-600" />
                                ) : (
                                    <>
                                        <div className="mb-2">
                                            {renderIcon(targetEl, "w-8 h-8")}
                                        </div>
                                        <span className="text-xs font-bold text-white text-center truncate w-full">{level.targetName}</span>
                                        <div className="flex gap-0.5 mt-1">
                                            {[1, 2, 3].map(s => (
                                                <Star
                                                    key={s}
                                                    className={cn("w-2 h-2", s <= stars ? "fill-yellow-400 text-yellow-400" : "text-slate-600")}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.button>
                        );
                    })}
                </div>



                {showDailyLeaderboard && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => setShowDailyLeaderboard(false)}
                            >
                                X
                            </Button>
                            <h2 className="text-2xl font-bold text-white mb-4">Daily Leaderboard</h2>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {dailyLeaderboard.length === 0 ? (
                                    <p className="text-slate-400 text-center">No scores yet today. Be the first!</p>
                                ) : (
                                    dailyLeaderboard.map((entry, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 flex items-center justify-center font-bold rounded-full text-sm",
                                                    idx === 0 ? "bg-yellow-500 text-black" :
                                                        idx === 1 ? "bg-slate-300 text-black" :
                                                            idx === 2 ? "bg-amber-700 text-white" : "bg-slate-700 text-slate-300"
                                                )}>{idx + 1}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{entry.name || 'Anonymous'}</span>
                                                    <span className="text-xs text-slate-400">{formatTime(entry.timeTaken)}</span>
                                                </div>
                                            </div>
                                            <div className="text-cyan-400 font-bold">Completed</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (!currentLevel) return <div className="text-white text-center p-8">Loading...</div>;

    const targetElement = elements.find(e => e.id === currentLevel.targetId);

    return (
        <div className="w-full max-w-6xl mx-auto h-[85vh] md:h-[800px] bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">

            {/* LEFT: Elements Sidebar */}
            <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col order-2 md:order-1 h-1/3 md:h-full">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Elements</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 md:grid-cols-3 gap-2 content-start">
                    {discovered.map(id => {
                        const el = getElement(id);
                        return (
                            <motion.button
                                key={id}
                                layoutId={`element-source-${id}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToCauldron(id)}
                                disabled={isMixing || isLevelComplete}
                                className={cn(
                                    "aspect-square rounded-lg flex flex-col items-center justify-center border border-slate-800 bg-slate-950/50 p-1 hover:bg-slate-800 transition-colors",
                                    BG_COLORS[el?.colorIdx || 0],
                                    hintElements.includes(id) && "ring-2 ring-yellow-400 animate-pulse"
                                )}
                            >
                                {renderIcon(el, "w-6 h-6")}
                                <span className="text-[10px] mt-1 text-slate-300 truncate w-full text-center px-1">{el?.name}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* CENTER: Mixing Area */}
            <div className="flex-1 bg-slate-950 relative flex flex-col order-1 md:order-2 h-2/3 md:h-full">

                {/* Header / Target */}
                <div className="p-4 flex justify-between items-center border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                            {renderIcon(targetElement, "w-6 h-6")}
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Target: {currentLevel.targetName}</h2>
                            <p className="text-xs text-slate-500">{isDaily ? 'Daily Challenge' : `Level ${currentLevel.id}`}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="font-mono text-xl text-white bg-slate-900 px-3 py-1 rounded border border-slate-800">
                            {formatTime(timer)}
                        </div>
                        <Button onClick={() => setView("grid")} variant="ghost" size="sm">
                            Menu
                        </Button>
                        <Button onClick={handleHint} variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
                            <Sparkles className="w-4 h-4 mr-1" /> Hint
                        </Button>
                    </div>
                </div>

                {/* Mixing Zone */}
                <div className="flex-1 flex flex-col items-center justify-center relative">

                    {/* Connection Lines */}
                    <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-slate-800 -z-10" />

                    <div className="flex gap-8 md:gap-16 items-center">
                        {/* Slot 1 */}
                        <div
                            onClick={() => removeFromCauldron(0)}
                            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors relative"
                        >
                            {cauldron[0] !== undefined ? (
                                <motion.div layoutId={`element-${cauldron[0]}`} className="flex flex-col items-center">
                                    {renderIcon(getElement(cauldron[0]), "w-10 h-10 md:w-12 md:h-12")}
                                    <span className="text-xs mt-2 text-slate-300">{getElement(cauldron[0])?.name}</span>
                                </motion.div>
                            ) : (
                                <span className="text-slate-700 text-4xl">+</span>
                            )}
                        </div>

                        {/* Mixing Animation */}
                        <div className="w-16 h-16 flex items-center justify-center relative">
                            {isMixing ? (
                                <motion.div
                                    animate={{ rotate: 360, scale: [1, 1.5, 0] }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full blur-md opacity-80"
                                />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-700" />
                            )}
                        </div>

                        {/* Slot 2 */}
                        <div
                            onClick={() => removeFromCauldron(1)}
                            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors relative"
                        >
                            {cauldron[1] !== undefined ? (
                                <motion.div layoutId={`element-${cauldron[1]}`} className="flex flex-col items-center">
                                    {renderIcon(getElement(cauldron[1]), "w-10 h-10 md:w-12 md:h-12")}
                                    <span className="text-xs mt-2 text-slate-300">{getElement(cauldron[1])?.name}</span>
                                </motion.div>
                            ) : (
                                <span className="text-slate-700 text-4xl">+</span>
                            )}
                        </div>
                    </div>

                    {/* Notification Toast */}
                    <AnimatePresence>
                        {notification && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute bottom-8 bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
                            >
                                <div className="w-8 h-8">
                                    {renderIcon(notification.icon, "w-8 h-8")}
                                </div>
                                <span>Discovered: <span className="font-bold text-cyan-400">{notification.name}</span></span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Level Complete Overlay */}
                    {isLevelComplete && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center"
                        >
                            <Trophy className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-bold text-white mb-2">Congratulations!</h2>
                            <p className="text-slate-300 mb-2 text-lg">You discovered {currentLevel.targetName}!</p>
                            <p className="text-cyan-400 mb-8 text-xl font-mono">Time: {formatTime(timer)}</p>

                            {isDaily ? (
                                <div className="flex gap-4">
                                    <Button onClick={() => setView("grid")} size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                                        Back to Menu
                                    </Button>
                                    <Button onClick={() => { fetchDailyLeaderboard(); setShowDailyLeaderboard(true); setView("grid"); }} size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold">
                                        View Leaderboard
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={nextLevel} size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-8 py-6 text-xl rounded-full shadow-lg hover:scale-105 transition-transform">
                                    Next Level <ArrowRight className="ml-2 w-6 h-6" />
                                </Button>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* RIGHT: History (Desktop Only) */}
                <div className="hidden md:block absolute right-4 top-20 bottom-4 w-64 pointer-events-none">
                    <div className="h-full flex flex-col justify-end gap-2 opacity-50">
                        {history.slice(-5).map((entry, i) => {
                            const in1 = getElement(entry.inputs[0]);
                            const in2 = getElement(entry.inputs[1]);
                            const out = getElement(entry.output);
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-end gap-2 text-xs p-2 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-sm"
                                >
                                    <span className={cn(COLORS[in1?.colorIdx || 0])}>{in1?.name}</span>
                                    <span className="text-slate-600">+</span>
                                    <span className={cn(COLORS[in2?.colorIdx || 0])}>{in2?.name}</span>
                                    <span className="text-slate-600">=</span>
                                    <span className={cn("font-bold", COLORS[out?.colorIdx || 0])}>{out?.name}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
