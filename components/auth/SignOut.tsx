import { signOutAction } from "@/app/actions"

export function SignOut() {
    return (
        <form action={signOutAction}>
            <button type="submit" className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
                Sign Out
            </button>
        </form>
    )
}
