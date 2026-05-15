"use client";

import { useState, useTransition } from "react";
import { createHook } from "@/app/actions/hooks";

type Props = {
  placeId: string;
  isLoggedIn: boolean;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function HookForm({ placeId, isLoggedIn, onCancel, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [asAnonymous, setAsAnonymous] = useState(!isLoggedIn);

  async function handleSubmit(formData: FormData) {
    formData.set("isAnonymous", asAnonymous ? "true" : "false");
    startTransition(async () => {
      const result = await createHook(formData);
      if (!result?.error) onSuccess();
    });
  }

  return (
    <form action={handleSubmit} className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <input type="hidden" name="placeId" value={placeId} />

      {/* ログイン済みの場合のみ種類・匿名選択を表示 */}
      {isLoggedIn && (
        <>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">種類</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="hookType" value="REGULAR" defaultChecked />
                <span className="text-sm text-stone-700">よくいます（30日）</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="hookType" value="RECENT" />
                <span className="text-sm text-stone-700">最近行きました（7日）</span>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={asAnonymous}
              onChange={(e) => setAsAnonymous(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-stone-600">匿名で投稿する（24時間で消えます）</span>
          </label>
        </>
      )}

      {/* 未ログインの場合は匿名固定のお知らせ */}
      {!isLoggedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          ログインなしで投稿できます。投稿は <strong>24時間</strong> で自動的に消えます。
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">話したいこと</label>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={200}
          rows={3}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          placeholder="例：コーヒーの産地について話したいです"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">タグ（任意）</label>
        <input
          name="tags"
          type="text"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          placeholder="珈琲, 佐賀, 旅行"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-stone-300 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "送信中..." : asAnonymous ? "匿名で置く" : "フックを置く"}
        </button>
      </div>
    </form>
  );
}
