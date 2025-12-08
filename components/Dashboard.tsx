"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";
import { Activity, Trophy, Target } from "lucide-react";

interface DashboardProps {
    stats: {
        totalGames: number;
        totalScore: number;
        recentSessions: any[];
    };
}

export default function Dashboard({ stats }: DashboardProps) {
    // Format data for chart
    const data = stats.recentSessions.slice().reverse().map((s, i) => ({
        name: i + 1,
        score: s.score,
        game: s.gameId,
    }));

    return (
        <div className="w-full max-w-5xl mx-auto mb-16 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center gap-4"
                >
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                        <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm uppercase tracking-wider">Total Games</div>
                        <div className="text-3xl font-bold text-white">{stats.totalGames}</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center gap-4"
                >
                    <div className="p-4 bg-purple-500/10 rounded-lg">
                        <Trophy className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm uppercase tracking-wider">Total Score</div>
                        <div className="text-3xl font-bold text-white">{stats.totalScore.toLocaleString()}</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center gap-4"
                >
                    <div className="p-4 bg-green-500/10 rounded-lg">
                        <Target className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm uppercase tracking-wider">Avg Score</div>
                        <div className="text-3xl font-bold text-white">
                            {stats.totalGames > 0 ? Math.round(stats.totalScore / stats.totalGames) : 0}
                        </div>
                    </div>
                </motion.div>
            </div>

            {stats.totalGames > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl"
                >
                    <h3 className="text-lg font-semibold text-slate-300 mb-6">Performance History</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
