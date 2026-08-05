import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Request datang dari web (session login) atau dari bot Telegram (service key + telegramId).
export async function resolveActingUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const botKey = process.env.BOT_SERVICE_KEY;

  if (botKey && authHeader === `Bearer ${botKey}`) {
    const body = await req.clone().json().catch(() => null);
    const telegramId = body?.telegramId as string | undefined;
    if (!telegramId) return null;
    const user = await prisma.user.findUnique({ where: { telegramId } });
    return user?.id ?? null;
  }

  const session = await auth();
  return session?.user?.id ?? null;
}
