"use client";

import { useState, useTransition, useEffect } from "react";
import { X } from "lucide-react";
import { createPlace } from "@/app/actions/places";

type Props = {
  lat: number;
  lng: number;
  address: string;
  onClose: () => void;
};

export default function AddPlaceForm({ lat, lng, address, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState(address);

  useEffect(() => {
    setResolvedAddress(address);
  }, [address]);

  async function handleSubmit(formData: FormData) {
    formData.set("lat", lat.toString());
    formData.set("lng", lng.toString());
    formData.set("address", resolvedAddress);
    startTransition(async () => {
      const result = await createPlace(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">場所を追加</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={18} />
          </button>
        </div>

        <form action={handleSubmit} className="p-4 space-y-3">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}

          {/* 座標プレビュー */}
          <div className="bg-stone-50 rounded-lg px-3 py-2 text-xs text-stone-500">
            📌 {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">場所名 *</label>
            <input
              name="name"
              required
              autoFocus
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="例：佐賀城跡"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">住所</label>
            <input
              value={resolvedAddress}
              onChange={(e) => setResolvedAddress(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="住所を取得中..."
            />
            <p className="text-xs text-stone-400 mt-1">自動取得されます。修正も可能です</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">タグ</label>
            <input
              name="tags"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="歴史, 観光, カフェ"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-stone-300 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "追加中..." : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
