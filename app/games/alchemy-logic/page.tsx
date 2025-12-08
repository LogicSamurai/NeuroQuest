import AlchemyLogic from "@/components/games/AlchemyLogic";
import { getLevelProgress } from "@/app/actions";

export default async function AlchemyLogicPage() {
    const progress = await getLevelProgress("alchemy-logic");

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Alchemy Logic</h1>
                <p className="text-slate-400">Deductive reasoning and pattern discovery.</p>
            </div>
            <AlchemyLogic initialProgress={progress} />
        </main>
    );
}
