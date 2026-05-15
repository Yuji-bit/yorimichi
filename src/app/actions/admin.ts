"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("未ログインです");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    throw new Error("管理者権限がありません");
  }
  return user;
}

export async function adminDeletePlace(placeId: string) {
  await assertAdmin();
  await prisma.place.delete({ where: { id: placeId } });
  revalidatePath("/map");
  revalidatePath("/admin");
  return { success: true };
}

export async function adminDeleteHook(hookId: string) {
  await assertAdmin();
  await prisma.hook.delete({ where: { id: hookId } });
  revalidatePath("/map");
  revalidatePath("/admin");
  return { success: true };
}

export async function adminDeleteWikiEdit(editId: string) {
  await assertAdmin();
  await prisma.wikiEdit.delete({ where: { id: editId } });
  revalidatePath("/map");
  revalidatePath("/admin");
  return { success: true };
}

export async function getAdminData() {
  await assertAdmin();

  const [places, hooks, wikiEdits] = await Promise.all([
    prisma.place.findMany({
      include: {
        _count: { select: { hooks: true, wikiEdits: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.hook.findMany({
      include: {
        user: { select: { handleName: true, email: true } },
        place: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wikiEdit.findMany({
      include: {
        user: { select: { handleName: true, email: true } },
        place: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { places, hooks, wikiEdits };
}
