import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) redirect("/map");

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

  // Date を文字列に変換してクライアントに渡す
  const serialized = {
    places: places.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    hooks: hooks.map((h) => ({
      ...h,
      expiresAt: h.expiresAt.toISOString(),
      createdAt: h.createdAt.toISOString(),
    })),
    wikiEdits: wikiEdits.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    })),
  };

  return (
    <AdminClient
      places={serialized.places as any}
      hooks={serialized.hooks as any}
      wikiEdits={serialized.wikiEdits as any}
    />
  );
}
