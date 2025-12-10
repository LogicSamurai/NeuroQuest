import { getHomepageData } from "@/app/actions";
import { SignIn } from "@/components/auth/SignIn";
import Link from "next/link";
import { ArrowLeft, Sparkles, Trophy, Play, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DailyChallengesPage() {
    const data = await getHomepageData();

    if (!data) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-950">
                <SignIn />
            </main>
        );
    }

    const { challenges } = data;

    const games = [
        { id: 'zip-path', route: 'connect-the-dots', name: 'Zip Path', description: 'Connect numbers to reveal hidden pictures', color: 'cyan' },
        { id: 'alchemy-logic', route: 'alchemy-logic', name: 'Alchemy Logic', description: 'Mix elements to discover new combinations', color: 'purple' },
        // { id: 'stroop-dash', route: 'stroop-dash', name: 'Stroop Dash', description: 'Test your reaction speed and focus', color: 'pink' }
    ];

    // Helper to find challenge status for a game
    const getChallengeStatus = (gameId: string) => {
        const challenge = challenges.list.find(c => c.gameId === gameId);
        if (!challenge) return { status: 'unavailable', completed: false };
        return { status: 'available', completed: challenge.completed, challenge };
    };

    return (
        <main className="min-h-screen p-4 md:p-8 bg-slate-950">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                        Daily Challenges
                    </h1>
                    <p className="text-slate-400">
                        New puzzles every day. Complete them all to earn XP and climb the leaderboard!
                    </p>
                </div>

                <div className="grid gap-6">
                    {games.map(game => {
                        const { status, completed, challenge } = getChallengeStatus(game.id);

                        // Define colors dynamically
                        const colorClasses = {
                            cyan: "border-cyan-500/50 hover:border-cyan-400",
                            purple: "border-purple-500/50 hover:border-purple-400",
                            pink: "border-pink-500/50 hover:border-pink-400"
                        }[game.color] || "border-slate-700";

                        const bgGradient = {
                            cyan: "from-cyan-500/10 to-blue-500/10",
                            purple: "from-purple-500/10 to-indigo-500/10",
                            pink: "from-pink-500/10 to-rose-500/10"
                        }[game.color] || "from-slate-800 to-slate-900";

                        return (
                            <div key={game.id} className={cn(
                                "glass-card p-6 border-l-4 transition-all duration-300",
                                colorClasses,
                                `bg-gradient-to-r ${bgGradient}`
                            )}>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-2">{game.name}</h2>
                                        <p className="text-slate-300 mb-4">{game.description}</p>

                                        {challenge && (
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1 text-yellow-400">
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>+{challenge.xpReward} XP</span>
                                                </div>
                                                {!completed && (
                                                    <div className="flex items-center gap-1 text-slate-400">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Time: {challenges.timeUntilRefresh.hours}h {challenges.timeUntilRefresh.minutes}m</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {completed ? (
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2 text-green-400 font-bold bg-green-500/10 px-4 py-2 rounded-full">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Completed
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
                                                    asChild
                                                >
                                                    <Link href={`/games/${game.route}?daily=true`}>
                                                        <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                                                        View Leaderboard
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="lg"
                                                className={cn(
                                                    "font-bold text-lg px-8 py-6 shadow-lg hover:scale-105 transition-transform",
                                                    game.color === 'cyan' ? "bg-cyan-500 hover:bg-cyan-600 text-black" :
                                                        game.color === 'purple' ? "bg-purple-600 hover:bg-purple-700 text-white" :
                                                            "bg-white text-black"
                                                )}
                                                asChild
                                            >
                                                <Link href={`/games/${game.route}?daily=true`}>
                                                    <Play className="w-5 h-5 mr-2 fill-current" />
                                                    Play Now
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
