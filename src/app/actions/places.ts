"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// 手動登録（場所を追加ボタン用）
export async function createPlace(formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (!name || name.length < 2) return { error: "場所名は2文字以上必要です" };
  if (isNaN(lat) || isNaN(lng)) return { error: "緯度・経度を正しく入力してください" };

  const place = await prisma.place.create({
    data: { name, address, lat, lng, tags },
  });

  revalidatePath("/map");
  return { success: true, placeId: place.id };
}

// OSM POIクリック時：同じ名前 & 座標が近い場所を検索 or 自動作成して返す
export async function findOrCreatePlace(input: {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  category?: string;
}) {
  const { name, lat, lng, address, category } = input;

  // 座標が近い（約10m以内）かつ名前が一致する場所を優先検索
  const TIGHT = 0.0001; // ~11m
  const exactMatch = await prisma.place.findFirst({
    where: {
      name,
      lat: { gte: lat - TIGHT, lte: lat + TIGHT },
      lng: { gte: lng - TIGHT, lte: lng + TIGHT },
    },
    include: {
      hooks: {
        where: { expiresAt: { gt: new Date() } },
        include: { user: { select: { handleName: true, interestTags: true } } },
        orderBy: { createdAt: "desc" },
      },
      wikiEdits: {
        include: { user: { select: { handleName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (exactMatch) return { place: exactMatch };

  // 名前なしで座標だけで検索（~30m以内）— 手動登録済み場所を拾う
  const LOOSE = 0.0003;
  const coordMatch = await prisma.place.findFirst({
    where: {
      lat: { gte: lat - LOOSE, lte: lat + LOOSE },
      lng: { gte: lng - LOOSE, lte: lng + LOOSE },
    },
    include: {
      hooks: {
        where: { expiresAt: { gt: new Date() } },
        include: { user: { select: { handleName: true, interestTags: true } } },
        orderBy: { createdAt: "desc" },
      },
      wikiEdits: {
        include: { user: { select: { handleName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // 座標が一致しても名前が大きく違う場合は別の場所として新規作成
  if (coordMatch) {
    const isSameName =
      coordMatch.name === name ||
      coordMatch.name.includes(name) ||
      name.includes(coordMatch.name);
    if (isSameName) return { place: coordMatch };
  }

  // なければ自動作成
  const tags = category ? [category] : [];
  const place = await prisma.place.create({
    data: { name, lat, lng, address: address ?? "", tags },
    include: {
      hooks: true,
      wikiEdits: true,
    },
  });

  revalidatePath("/map");
  return { place };
}
