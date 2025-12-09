"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Play, RotateCcw, AlertTriangle, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveGameSession } from "@/app/actions";
import TutorialOverlay from "./TutorialOverlay";

const COLORS = [
    { name: "RED", value: "bg-red-500", text: "text-red-500" },
    { name: "BLUE", value: "bg-blue-500", text: "text-blue-500" },
    { name: "GREEN", value: "bg-green-500", text: "text-green-500" },
    { name: "YELLOW", value: "bg-yellow-400", text: "text-yellow-400" },
];

type Mode = "MATCH_COLOR" | "MATCH_WORD";

interface StroopDashProps {
    initialStats?: {
        highScore: number;
    };
}

export default function StroopDash({ initialStats }: StroopDashProps) {
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [mode, setMode] = useState<Mode>("MATCH_COLOR");
    const [highScore, setHighScore] = useState(initialStats?.highScore || 0);

    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(false);
    const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

    useEffect(() => {
        // Show tutorial if no high score (first time) and haven't seen it yet
        if ((!initialStats?.highScore || initialStats.highScore === 0) && !hasSeenTutorial) {
            setShowTutorial(true);
        }
    }, [initialStats, hasSeenTutorial]);

    // Current Challenge
    const [wordIdx, setWordIdx] = useState(0); // The text displayed (e.g., "RED")
    const [colorIdx, setColorIdx] = useState(1); // The color of the text (e.g., Blue)

    const [feedback, setFeedback] = useState<"CORRECT" | "WRONG" | null>(null);

    const generateChallenge = useCallback(() => {
        // Randomize Mode occasionally
        if (Math.random() < 0.3) {
            setMode(m => m === "MATCH_COLOR" ? "MATCH_WORD" : "MATCH_COLOR");
        }

        const newWord = Math.floor(Math.random() * 4);
        let newColor = Math.floor(Math.random() * 4);
        // Ensure 50% chance of match vs mismatch for Stroop effect
        if (Math.random() < 0.5) {
            newColor = newWord;
        } else {
            while (newColor === newWord) newColor = Math.floor(Math.random() * 4);
        }

        setWordIdx(newWord);
        setColorIdx(newColor);
    }, []);

    const handleInput = (idx: number) => {
        if (!isPlaying) return;

        const targetIdx = mode === "MATCH_COLOR" ? colorIdx : wordIdx;

        if (idx === targetIdx) {
            setScore(s => s + 100);
            setFeedback("CORRECT");
            generateChallenge();
        } else {
            setScore(s => Math.max(0, s - 50));
            setFeedback("WRONG");
            // Shake effect or penalty
        }

        setTimeout(() => setFeedback(null), 200);
    };

    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && isPlaying) {
            setIsPlaying(false);
            saveGameSession("stroop-dash", score, 1, 100); // Simple difficulty/accuracy for now

            // Update local high score if needed
            if (score > highScore) {
                setHighScore(score);
            }
        }
    }, [isPlaying, timeLeft, score, highScore]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        setIsPlaying(true);
        generateChallenge();
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;
            if (e.key === "ArrowUp") handleInput(0); // Red
            if (e.key === "ArrowDown") handleInput(1); // Blue
            if (e.key === "ArrowLeft") handleInput(2); // Green
            if (e.key === "ArrowRight") handleInput(3); // Yellow
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPlaying, colorIdx, wordIdx, mode]);

    return (
        <div className="relative w-full max-w-2xl mx-auto h-[600px] bg-slate-900/50 rounded-xl p-8 border border-slate-700 shadow-2xl backdrop-blur-sm flex flex-col items-center justify-between">

            {/* HUD */}
            <div className="w-full flex justify-between items-start">
                <div className="text-center">
                    <div className="text-slate-400 text-sm uppercase">Score</div>
                    <div className="text-3xl font-bold text-white font-mono">{score}</div>
                </div>
                <div className="text-center">
                    <div className="text-slate-400 text-sm uppercase">Time</div>
                    <div className={cn("text-3xl font-bold font-mono", timeLeft < 10 ? "text-red-500" : "text-white")}>
                        {timeLeft}s
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                {!isPlaying ? (
                    <div className="text-center">
                        <Zap className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-4">Stroop Dash</h2>
                        {highScore > 0 && (
                            <div className="mb-4 flex flex-col items-center">
                                <span className="text-slate-400 text-sm uppercase tracking-wider">High Score</span>
                                <span className="text-2xl font-bold text-yellow-400">{highScore}</span>
                            </div>
                        )}
                        <p className="text-slate-300 mb-8 max-w-md">
                            React fast! Match the <span className="text-green-400 font-bold">COLOR</span> or the <span className="text-red-400 font-bold">WORD</span> based on the rule.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={startGame} size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-black text-xl font-bold px-12 py-6">
                                <Play className="mr-2 h-6 w-6" /> Start Run
                            </Button>
                            {timeLeft === 0 && (
                                <Button
                                    onClick={() => router.push('/')}
                                    size="lg"
                                    variant="outline"
                                    className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xl font-bold px-8 py-6"
                                >
                                    <Home className="mr-2 h-6 w-6" /> Home
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Rule Indicator */}
                        <div className="absolute top-10">
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                key={mode}
                                className={cn(
                                    "px-6 py-2 rounded-full text-xl font-black uppercase tracking-wider border-2 shadow-lg",
                                    mode === "MATCH_COLOR"
                                        ? "bg-slate-800 border-green-500 text-green-400"
                                        : "bg-slate-800 border-red-500 text-red-400"
                                )}
                            >
                                {mode === "MATCH_COLOR" ? "Match Color" : "Match Word"}
                            </motion.div>
                        </div>

                        {/* The Stimulus */}
                        <motion.div
                            key={`${wordIdx}-${colorIdx}-${mode}`} // Re-render on change
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={cn(
                                "text-8xl font-black tracking-tighter filter drop-shadow-2xl transition-colors duration-200",
                                COLORS[colorIdx].text
                            )}
                        >
                            {COLORS[wordIdx].name}
                        </motion.div>

                        {/* Feedback Overlay */}
                        <AnimatePresence>
                            {feedback && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 1 }}
                                    exit={{ scale: 2, opacity: 0 }}
                                    className={cn(
                                        "absolute inset-0 flex items-center justify-center pointer-events-none font-black text-6xl",
                                        feedback === "CORRECT" ? "text-green-500" : "text-red-500"
                                    )}
                                >
                                    {feedback === "CORRECT" ? "✓" : "✕"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Controls */}
            {isPlaying && (
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {COLORS.map((c, i) => (
                        <button
                            key={c.name}
                            onClick={() => handleInput(i)}
                            className={cn(
                                "h-24 rounded-xl font-bold text-2xl text-white shadow-lg transform transition-all active:scale-95 border-b-4 border-black/20",
                                c.value
                            )}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            <TutorialOverlay
                isOpen={showTutorial}
                title="How to Play StroopDash"
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
                        title: "Watch the Rule",
                        description: "Look at the top of the screen. It will tell you to match either the COLOR or the WORD.",
                        image: <div className="flex flex-col gap-2 items-center justify-center p-4 bg-slate-800 rounded-lg">
                            <div className="px-4 py-1 rounded-full border border-green-500 text-green-400 font-bold uppercase text-xs">Match Color</div>
                            <div className="text-4xl font-black text-blue-500">RED</div>
                        </div>
                    },
                    {
                        title: "React Fast",
                        description: "If the rule is MATCH COLOR, press the button for the color of the text (Blue). If it's MATCH WORD, press the button for what the text says (Red).",
                        image: <Zap className="w-16 h-16 text-yellow-400" />
                    },
                    {
                        title: "Don't Blink",
                        description: "You have 60 seconds. Correct answers give points, wrong answers subtract points. Good luck!",
                        image: <div className="text-4xl font-mono font-bold text-white">60s</div>
                    }
                ]}
            />
        </div>
    );
}
