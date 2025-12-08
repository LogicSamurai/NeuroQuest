import { getAchievementProgress } from "@/lib/achievements/checker";
import { getUserId } from "@/app/actions";
import AchievementsPageClient from "./AchievementsPageClient";

export default async function AchievementsPage() {
    const userId = await getUserId();
    const achievements = await getAchievementProgress(userId);

    // Group by category
    const grouped = achievements.reduce((acc, achievement) => {
        const category = achievement.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(achievement);
        return acc;
    }, {} as Record<string, typeof achievements>);

    // Calculate stats
    const totalUnlocked = achievements.filter(a => a.unlocked).length;
    const totalAchievements = achievements.length;

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <AchievementsPageClient
                    achievements={achievements}
                    grouped={grouped}
                    totalUnlocked={totalUnlocked}
                    totalAchievements={totalAchievements}
                />
            </div>
        </main>
    );
}
