import StroopDash from "@/components/games/StroopDash";
import { getUserId } from "@/app/actions";
import { getUserRank } from "@/db/queries/leaderboard";

export default async function StroopDashPage() {
    const userId = await getUserId();
    const userRank = userId ? await getUserRank(userId, "stroop-dash", "alltime") : null;
    const highScore = userRank?.score || 0;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Stroop Dash</h1>
                <p className="text-slate-400">Inhibition control and cognitive flexibility.</p>
            </div>
            <StroopDash initialStats={{ highScore }} />
        </main>
    );
}
