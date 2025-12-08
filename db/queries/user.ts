import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserId } from "@/app/actions";

export async function getUser() {
    const userId = await getUserId();
    if (!userId) return null;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    return user;
}

export async function getUserById(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);
    return user;
}
