"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800">寄り道</h1>
          <p className="mt-2 text-sm text-stone-500">アカウントを作成して始める</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              ハンドルネーム
            </label>
            <input
              name="handleName"
              type="text"
              required
              minLength={2}
              maxLength={20}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="さが太郎"
            />
            <p className="mt-1 text-xs text-stone-400">2〜20文字。地図に表示される名前です</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              話したいこと・趣味タグ
            </label>
            <input
              name="interestTags"
              type="text"
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="珈琲, 佐賀の歴史, 登山"
            />
            <p className="mt-1 text-xs text-stone-400">カンマ区切りで入力（後から変更可）</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              メールアドレス
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              パスワード
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="8文字以上"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "登録中..." : "登録する"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
