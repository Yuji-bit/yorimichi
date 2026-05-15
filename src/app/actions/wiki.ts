"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function saveWikiEdit(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインが必要です" };

  const placeId = formData.get("placeId") as string;
  const content = formData.get("content") as string;

  if (!content || content.length < 10) {
    return { error: "内容は10文字以上入力してください" };
  }

  await prisma.wikiEdit.create({
    data: { placeId, userId: user.id, content },
  });

  revalidatePath(`/map`);
  return { success: true };
}
