import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
      <h2 className="font-semibold">揾唔到呢一頁</h2>
      <p className="mt-2 text-sm text-slate-500">呢個房間或者傢俬可能已經刪除咗。</p>
      <Link href="/" className="mt-4 inline-block text-sm text-slate-900 underline">
        返回房間列表
      </Link>
    </div>
  );
}
