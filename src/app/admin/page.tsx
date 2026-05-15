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

  // DB からデータ取得
  const [places, hooks, wikiEdits] = await Promise.all([
    prisma.place.findMany({
      include: {
        hooks: { select: { id: true } },
        wikiEdits: { select: { id: true } },
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
  const serializedPlaces = places.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    tags: p.tags,
    createdAt: p.createdAt.toISOString(),
    hookCount: p.hooks.length,
    wikiCount: p.wikiEdits.length,
  }));

  const serializedHooks = hooks.map((h) => ({
    id: h.id,
    message: h.message,
    isAnonymous: h.isAnonymous,
    hookType: h.hookType,
    expiresAt: h.expiresAt.toISOString(),
    createdAt: h.createdAt.toISOString(),
    user: h.user,
    place: h.place,
  }));

  const serializedWikiEdits = wikiEdits.map((w) => ({
    id: w.id,
    content: w.content,
    createdAt: w.createdAt.toISOString(),
    user: w.user,
    place: w.place,
  }));

  return (
    <AdminClient
      places={serializedPlaces}
      hooks={serializedHooks}
      wikiEdits={serializedWikiEdits}
    />
  );
}
