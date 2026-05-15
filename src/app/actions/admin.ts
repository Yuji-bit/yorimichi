"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// クライアント側アクション（削除ボタン）用の認証チェック
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
