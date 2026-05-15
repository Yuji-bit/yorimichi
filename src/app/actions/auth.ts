"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type ActionState = { error: string } | null;

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/map");
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const handleName = formData.get("handleName") as string;
  const interestTagsRaw = formData.get("interestTags") as string;
  const interestTags = interestTagsRaw
    ? interestTagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (!handleName || handleName.length < 2) {
    return { error: "ハンドルネームは2文字以上必要です" };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "登録に失敗しました" };
  }

  try {
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        handleName,
        interestTags,
      },
    });
  } catch {
    return { error: "ハンドルネームがすでに使われています" };
  }

  revalidatePath("/", "layout");
  redirect("/map");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/map");
}
