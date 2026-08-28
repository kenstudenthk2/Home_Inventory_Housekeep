"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="font-semibold text-red-900">出咗問題</h2>
      <p className="mt-2 text-sm text-red-800">{error.message || "發生咗未知錯誤。"}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white"
      >
        再試一次
      </button>
    </div>
  );
}
