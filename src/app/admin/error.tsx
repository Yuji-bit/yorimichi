"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center space-y-4">
        <h2 className="text-lg font-bold text-red-700">管理画面でエラーが発生しました</h2>
        <p className="text-sm text-stone-600 bg-stone-50 rounded p-3 text-left break-all">
          {error.message || "不明なエラー"}
        </p>
        {error.digest && (
          <p className="text-xs text-stone-400">digest: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700"
          >
            再試行
          </button>
          <a href="/map" className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
            地図に戻る
          </a>
        </div>
      </div>
    </div>
  );
}
