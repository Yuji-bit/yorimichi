"use client";

import { useState, useTransition } from "react";
import { MapPin, MessageSquare, BookOpen, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { adminDeletePlace, adminDeleteHook, adminDeleteWikiEdit } from "@/app/actions/admin";

type Place = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  tags: string[];
  createdAt: string;
  hookCount: number;
  wikiCount: number;
};

type Hook = {
  id: string;
  message: string;
  isAnonymous: boolean;
  hookType: string;
  expiresAt: string;
  createdAt: string;
  user: { handleName: string; email: string } | null;
  place: { name: string };
};

type WikiEdit = {
  id: string;
  content: string;
  createdAt: string;
  user: { handleName: string; email: string };
  place: { name: string };
};

type Props = {
  places: Place[];
  hooks: Hook[];
  wikiEdits: WikiEdit[];
};

type Tab = "places" | "hooks" | "wiki";

function ConfirmDelete({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <AlertTriangle size={14} className="text-red-500 shrink-0" />
      <span className="text-xs text-red-700">「{label}」を削除しますか？</span>
      <button onClick={onConfirm} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">削除</button>
      <button onClick={onCancel} className="text-xs text-stone-500 hover:text-stone-700">キャンセル</button>
    </div>
  );
}

export default function AdminClient({ places: initialPlaces, hooks: initialHooks, wikiEdits: initialWikiEdits }: Props) {
  const [tab, setTab] = useState<Tab>("places");
  const [places, setPlaces] = useState(initialPlaces);
  const [hooks, setHooks] = useState(initialHooks);
  const [wikiEdits, setWikiEdits] = useState(initialWikiEdits);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeletePlace = (id: string) => {
    startTransition(async () => {
      await adminDeletePlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setHooks((prev) => prev.filter((h) => h.place.name !== places.find(p => p.id === id)?.name));
      setConfirmId(null);
    });
  };

  const handleDeleteHook = (id: string) => {
    startTransition(async () => {
      await adminDeleteHook(id);
      setHooks((prev) => prev.filter((h) => h.id !== id));
      setConfirmId(null);
    });
  };

  const handleDeleteWikiEdit = (id: string) => {
    startTransition(async () => {
      await adminDeleteWikiEdit(id);
      setWikiEdits((prev) => prev.filter((w) => w.id !== id));
      setConfirmId(null);
    });
  };

  const tabs = [
    { key: "places" as Tab, label: "場所", icon: MapPin, count: places.length },
    { key: "hooks" as Tab, label: "フック", icon: MessageSquare, count: hooks.length },
    { key: "wiki" as Tab, label: "Wiki編集", icon: BookOpen, count: wikiEdits.length },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-800">寄り道 管理画面</h1>
            <p className="text-xs text-stone-400 mt-0.5">場所・投稿の管理</p>
          </div>
          <a href="/map" className="text-sm text-green-600 hover:underline">← 地図に戻る</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* タブ */}
        <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 mb-6 w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-stone-800 text-white"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Icon size={14} />
              {label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                tab === key ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {/* 場所一覧 */}
        {tab === "places" && (
          <div className="space-y-3">
            {places.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-12">場所がありません</p>
            )}
            {places.map((place) => (
              <div key={place.id} className="bg-white rounded-xl border border-stone-200 p-4">
                {confirmId === place.id ? (
                  <ConfirmDelete
                    label={place.name}
                    onConfirm={() => handleDeletePlace(place.id)}
                    onCancel={() => setConfirmId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-800">{place.name}</span>
                        {place.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {place.address && (
                        <p className="text-xs text-stone-400 mt-1">{place.address}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                        <span>📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                        <span>💬 フック {place.hookCount}件</span>
                        <span>📝 Wiki {place.wikiCount}件</span>
                        <span>{format(new Date(place.createdAt), "M月d日登録", { locale: ja })}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmId(place.id)}
                      disabled={isPending}
                      className="shrink-0 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-100"
                    >
                      <Trash2 size={13} />
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* フック一覧 */}
        {tab === "hooks" && (
          <div className="space-y-3">
            {hooks.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-12">フックがありません</p>
            )}
            {hooks.map((hook) => (
              <div key={hook.id} className="bg-white rounded-xl border border-stone-200 p-4">
                {confirmId === hook.id ? (
                  <ConfirmDelete
                    label={hook.message.slice(0, 20) + "..."}
                    onConfirm={() => handleDeleteHook(hook.id)}
                    onCancel={() => setConfirmId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-medium text-stone-500">
                          📍 {hook.place.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          hook.isAnonymous ? "bg-stone-100 text-stone-500" : "bg-blue-50 text-blue-600"
                        }`}>
                          {hook.isAnonymous ? "匿名" : `@${hook.user?.handleName}`}
                        </span>
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                          {hook.hookType === "REGULAR" ? "よくいます" : "最近行きました"}
                        </span>
                      </div>
                      <p className="text-sm text-stone-800">{hook.message}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-400">
                        <span>{format(new Date(hook.createdAt), "M月d日 HH:mm", { locale: ja })}</span>
                        <span>〜{format(new Date(hook.expiresAt), "M月d日まで", { locale: ja })}</span>
                        {hook.user && <span>{hook.user.email}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmId(hook.id)}
                      disabled={isPending}
                      className="shrink-0 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-100"
                    >
                      <Trash2 size={13} />
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Wiki編集一覧 */}
        {tab === "wiki" && (
          <div className="space-y-3">
            {wikiEdits.length === 0 && (
              <p className="text-stone-400 text-sm text-center py-12">Wiki編集がありません</p>
            )}
            {wikiEdits.map((edit) => (
              <div key={edit.id} className="bg-white rounded-xl border border-stone-200 p-4">
                {confirmId === edit.id ? (
                  <ConfirmDelete
                    label={edit.content.slice(0, 20) + "..."}
                    onConfirm={() => handleDeleteWikiEdit(edit.id)}
                    onCancel={() => setConfirmId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-medium text-stone-500">
                          📍 {edit.place.name}
                        </span>
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                          @{edit.user.handleName}
                        </span>
                        <span className="text-xs text-stone-400">{edit.user.email}</span>
                      </div>
                      <p className="text-sm text-stone-800 line-clamp-2">{edit.content}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {format(new Date(edit.createdAt), "M月d日 HH:mm", { locale: ja })}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmId(edit.id)}
                      disabled={isPending}
                      className="shrink-0 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-100"
                    >
                      <Trash2 size={13} />
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
