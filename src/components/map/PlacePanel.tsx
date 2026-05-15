"use client";

import { useState } from "react";
import { X, MessageSquare, BookOpen, Plus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Place } from "@/types";
import HookForm from "./HookForm";
import WikiSection from "@/components/wiki/WikiSection";

type Props = {
  place: Place;
  currentUserId: string | null;
  onClose: () => void;
};

type Tab = "hooks" | "wiki";

export default function PlacePanel({ place, currentUserId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("hooks");
  const [showHookForm, setShowHookForm] = useState(false);

  const activeHooks = (place.hooks ?? []).filter(
    (h) => new Date(h.expiresAt) > new Date()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-4 border-b border-stone-100">
        <div>
          <h2 className="font-bold text-stone-800 text-lg">{place.name}</h2>
          {place.address && (
            <p className="text-xs text-stone-400 mt-0.5">{place.address}</p>
          )}
          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 p-1"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex border-b border-stone-100">
        <button
          onClick={() => setTab("hooks")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
            tab === "hooks"
              ? "text-green-700 border-b-2 border-green-600"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          <MessageSquare size={14} />
          話のフック
          {activeHooks.length > 0 && (
            <span className="bg-green-100 text-green-700 text-xs rounded-full px-1.5">
              {activeHooks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("wiki")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
            tab === "wiki"
              ? "text-green-700 border-b-2 border-green-600"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          <BookOpen size={14} />
          この場所について
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "hooks" && (
          <div className="space-y-3">
            {!showHookForm && (
              <button
                onClick={() => setShowHookForm(true)}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-green-300 rounded-lg py-3 text-sm text-green-600 hover:bg-green-50 transition-colors"
              >
                <Plus size={14} />
                話のフックを置く
              </button>
            )}

            {showHookForm && (
              <HookForm
                placeId={place.id}
                isLoggedIn={!!currentUserId}
                onCancel={() => setShowHookForm(false)}
                onSuccess={() => setShowHookForm(false)}
              />
            )}

            {activeHooks.length === 0 && !showHookForm && (
              <p className="text-center text-sm text-stone-400 py-8">
                まだフックがありません。
                <br />
                最初のフックを置いてみましょう！
              </p>
            )}

            {activeHooks.map((hook) => (
              <div
                key={hook.id}
                className="rounded-lg border border-stone-100 bg-stone-50 p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-green-700">
                    {hook.isAnonymous ? "匿名" : `@${hook.user?.handleName}`}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      hook.hookType === "REGULAR"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {hook.hookType === "REGULAR" ? "よくいます" : "最近行きました"}
                  </span>
                </div>
                <p className="text-sm text-stone-900">{hook.message}</p>
                {hook.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hook.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-stone-300 mt-2">
                  {format(new Date(hook.createdAt), "M月d日", { locale: ja })}
                  {" · "}
                  {format(new Date(hook.expiresAt), "M月d日まで", { locale: ja })}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "wiki" && (
          <WikiSection
            place={place}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
