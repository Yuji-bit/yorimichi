import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import MapClient from "./MapClient";
import { logout } from "@/app/actions/auth";

async function getPlacesWithActiveHooks() {
  const now = new Date();
  return prisma.place.findMany({
    include: {
      hooks: {
        where: { expiresAt: { gt: now } },
        include: { user: { select: { handleName: true, interestTags: true } } },
        orderBy: { createdAt: "desc" },
      },
      wikiEdits: {
        include: { user: { select: { handleName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({ where: { id: user.id } })
    : null;

  const places = await getPlacesWithActiveHooks();

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-700">寄り道</span>
          <span className="text-xs text-stone-400 hidden sm:block">佐賀の街で話のきっかけを</span>
        </div>
        <div className="flex items-center gap-3">
          {dbUser ? (
            <>
              <span className="text-sm text-stone-600">@{dbUser.handleName}</span>
              <form action={logout}>
                <button className="text-xs text-stone-400 hover:text-stone-600">
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <a href="/login" className="text-xs text-green-600 font-medium hover:underline">
              ログイン
            </a>
          )}
        </div>
      </header>

      <MapClient places={places as any} currentUserId={user?.id ?? null} />
    </div>
  );
}
