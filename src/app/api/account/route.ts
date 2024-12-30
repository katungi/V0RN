import { getUserAuth } from "@/lib/auth/utils";
import { db, user } from "@/lib/db/schema/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  const { session } = await getUserAuth();
  if (!session) return new Response("Error", { status: 400 });
  const body = (await request.json()) as { name?: string; email?: string };

  await db.update(user)
    .set(body)
    .where(eq(user.id, session.user.id));
    
  revalidatePath("/account");
  return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
}
