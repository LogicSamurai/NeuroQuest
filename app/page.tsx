import Link from "next/link";
import { Grid, Sparkles, Zap, Trophy, Medal, TrendingUp, User } from "lucide-react";
import { getHomepageData } from "@/app/actions";
import Dashboard from "@/components/Dashboard";
import LeaderboardCard from "@/components/leaderboard/LeaderboardCard";
import DailyChallengesCard from "@/components/challenges/DailyChallengesCard";
import LevelProgressBar from "@/components/progression/LevelProgressBar";
import DailyChallengeIntro from "@/components/DailyChallengeIntro";
import { SignIn } from "@/components/auth/SignIn";

export default async function Home() {
  const data = await getHomepageData();

  if (!data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-950">
        <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-white/10">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
            NeuroQuest
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Train your brain with daily challenges, track your progress, and compete with friends.
          </p>
          <div className="flex justify-center">
            <SignIn />
          </div>
        </div>
      </main>
    );
  }

  const { user, stats, leaderboard, challenges, achievements } = data;

  if (!stats) return null;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <DailyChallengeIntro />
      <div className="max-w-7xl mx-auto">
        {/* Header with Level */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
                NeuroQuest
              </h1>
              <p className="text-lg text-slate-400">
                Welcome back, <span className="text-white font-medium">{user?.name}</span>!
                {user?.currentStreak && user.currentStreak > 0 && (
                  <span className="ml-2 text-orange-400">
                    🔥 {user.currentStreak} day streak
                  </span>
                )}
              </p>
            </div>

            {/* Navigation links */}
            <div className="flex items-center gap-3">
              <Link
                href="/daily-challenges"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/30 text-orange-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)]"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline font-bold">Daily Challenges</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>
              <Link
                href="/achievements"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors"
              >
                <Medal className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {achievements.totalUnlocked}/{achievements.total}
                </span>
              </Link>
            </div>
          </div>

          {/* Level Progress Bar */}
          <LevelProgressBar
            level={stats.level}
            currentXp={stats.currentXp}
            xpForNextLevel={stats.xpForNextLevel}
            progress={stats.progress}
            compact
          />
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Games */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Dashboard */}
            <Dashboard stats={stats} />

            {/* Games Grid */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Brain Training Games
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/games/connect-the-dots" className="group">
                  <div className="glass-card p-6 h-full hover:scale-[1.02] transition-all duration-300 border-t-4 border-cyan-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                    <div className="mb-4 bg-cyan-500/10 w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <Grid className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Zip Path</h3>
                    <p className="text-sm text-slate-400">
                      Connect numbers to reveal hidden pictures.
                    </p>
                  </div>
                </Link>

                <Link href="/games/alchemy-logic" className="group">
                  <div className="glass-card p-6 h-full hover:scale-[1.02] transition-all duration-300 border-t-4 border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                    <div className="mb-4 bg-purple-500/10 w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Zap className="w-7 h-7 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Alchemy Logic</h3>
                    <p className="text-sm text-slate-400">
                      Mix elements to discover new combinations.
                    </p>
                  </div>
                </Link>

                <Link href="/games/stroop-dash" className="group">
                  <div className="glass-card p-6 h-full hover:scale-[1.02] transition-all duration-300 border-t-4 border-pink-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]">
                    <div className="mb-4 bg-pink-500/10 w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                      <TrendingUp className="w-7 h-7 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Stroop Dash</h3>
                    <p className="text-sm text-slate-400">
                      Test your reaction speed and focus.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Social & Challenges */}
          <div className="space-y-6">
            <DailyChallengesCard
              challenges={challenges.list}
              timeUntilRefresh={challenges.timeUntilRefresh}
            />
            <LeaderboardCard
              entries={leaderboard.topPlayers}
              userRank={leaderboard.userRank}
              currentUserId={user?.id}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm pb-8">
          <p>© 2024 NeuroQuest. Train your brain daily.</p>
        </footer>
      </div>
    </main>
  );
}
