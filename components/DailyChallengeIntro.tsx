"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, X } from "lucide-react";

export default function DailyChallengeIntro() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem("seenDailyIntro");
        if (!seen) {
            // Small delay to not overwhelm on load
            const timer = setTimeout(() => setShow(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setShow(false);
        localStorage.setItem("seenDailyIntro", "true");
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(168,85,247,0.2)]"
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-4">
                                Introducing Daily Challenges!
                            </h2>

                            <p className="text-slate-300 mb-6 leading-relaxed">
                                Test your skills with a unique puzzle every day. Compete on the daily leaderboard and earn special rewards!
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                    <div className="text-sm font-bold text-white">Leaderboards</div>
                                    <div className="text-xs text-slate-400">Compete daily</div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                    <div className="text-sm font-bold text-white">New Puzzles</div>
                                    <div className="text-xs text-slate-400">Fresh every 24h</div>
                                </div>
                            </div>

                            <Button
                                onClick={() => {
                                    handleClose();
                                    window.location.href = '/daily-challenges';
                                }}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                Let's Play!
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
