import ZipPathGame from "@/components/games/ZipPathGame";
import { getLevelProgress } from "@/app/actions";

export default async function ZipPathPage() {
    const progress = await getLevelProgress("zip-path");

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-slate-950">
            <div className="mb-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 tracking-tight">
                    Zip Path
                </h1>
                <p className="text-slate-400">
                    Connect the numbers to reveal hidden pictures!
                </p>
            </div>
            <ZipPathGame initialProgress={progress} />
        </main>
    );
}
