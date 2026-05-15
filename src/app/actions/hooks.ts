"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addDays, addHours } from "date-fns";
import type { HookType } from "@/types";

export async function createHook(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const placeId = formData.get("placeId") as string;
  const message = formData.get("message") as string;
  const hookType = formData.get("hookType") as HookType;
  const isAnonymous = formData.get("isAnonymous") === "true";
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (!message || message.length < 5) {
    return { error: "メッセージは5文字以上入力してください" };
  }

  // 匿名投稿は24時間、ログイン済みはhookTypeに応じて期限設定
  let expiresAt: Date;
  if (!user || isAnonymous) {
    expiresAt = addHours(new Date(), 24);
  } else {
    expiresAt = hookType === "REGULAR"
      ? addDays(new Date(), 30)
      : addDays(new Date(), 7);
  }

  await prisma.hook.create({
    data: {
      userId: user && !isAnonymous ? user.id : undefined,
      placeId,
      message,
      tags,
      hookType: user && !isAnonymous ? hookType : "RECENT",
      isAnonymous: !user || isAnonymous,
      expiresAt,
    },
  });

  revalidatePath(`/map`);
  return { success: true };
}

export async function deleteHook(hookId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const hook = await prisma.hook.findUnique({ where: { id: hookId } });
  if (!hook || hook.userId !== user.id) return { error: "削除できません" };

  await prisma.hook.delete({ where: { id: hookId } });
  revalidatePath(`/map`);
  return { success: true };
}
