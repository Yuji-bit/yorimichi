"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Edit2, History } from "lucide-react";
import type { Place } from "@/types";
import { saveWikiEdit } from "@/app/actions/wiki";

type Props = {
  place: Place;
  currentUserId: string | null;
};

export default function WikiSection({ place, currentUserId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isPending, startTransition] = useTransition();

  const edits = place.wikiEdits ?? [];
  const latestContent = edits.at(-1)?.content ?? place.description ?? "";

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveWikiEdit(formData);
      if (!result?.error) {
        setIsEditing(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-700">この場所について</h3>
        <div className="flex gap-2">
          {edits.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
            >
              <History size={12} />
              履歴（{edits.length}）
            </button>
          )}
          {currentUserId && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
            >
              <Edit2 size={12} />
              編集
            </button>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="text-sm text-stone-900 leading-relaxed">
          {latestContent ? (
            <p className="whitespace-pre-wrap">{latestContent}</p>
          ) : (
            <p className="text-stone-400 text-center py-8">
              まだ情報がありません。
              <br />
              最初の情報を追加しましょう！
            </p>
          )}
        </div>
      )}

      {isEditing && (
        <form action={handleSubmit} className="space-y-3">
          <input type="hidden" name="placeId" value={place.id} />
          <textarea
            name="content"
            required
            minLength={10}
            rows={8}
            defaultValue={latestContent}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="この場所について知っていることを書いてください。歴史、おすすめの時間帯、地元の人しか知らない情報など..."
          />
          <p className="text-xs text-stone-400">
            評価はしません。あなたが知っている情報を自由に書いてください
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded-lg border border-stone-300 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "保存中..." : "保存する"}
            </button>
          </div>
        </form>
      )}

      {showHistory && edits.length > 0 && (
        <div className="border-t border-stone-100 pt-4 space-y-3">
          <h4 className="text-xs font-medium text-stone-500">編集履歴</h4>
          {[...edits].reverse().map((edit) => (
            <div key={edit.id} className="text-xs text-stone-500">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-stone-600">
                  @{edit.user?.handleName}
                </span>
                <span>
                  {format(new Date(edit.createdAt), "M月d日 HH:mm", { locale: ja })}
                </span>
              </div>
              <p className="text-stone-400 line-clamp-2">{edit.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
