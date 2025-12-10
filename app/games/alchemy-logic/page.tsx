import AlchemyLogic from "@/components/games/AlchemyLogic";
import { getLevelProgress } from "@/app/actions";

export default async function AlchemyLogicPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const progress = await getLevelProgress("alchemy-logic");
    const { daily } = await searchParams;
    const autoDaily = daily === 'true';

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Alchemy Logic</h1>
                <p className="text-slate-400">Deductive reasoning and pattern discovery.</p>
            </div>
            <AlchemyLogic initialProgress={progress} autoDaily={autoDaily} />
        </main>
    );
}
