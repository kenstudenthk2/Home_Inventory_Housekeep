import Link from "next/link";
import { Home, Search } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <Home className="h-5 w-5" aria-hidden />
          家居物品管理
        </Link>

        <form action="/items" className="ml-auto flex items-center gap-2">
          <label htmlFor="global-search" className="sr-only">
            搜尋物品
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="global-search"
              name="search"
              type="search"
              placeholder="搜尋物品…"
              className="w-56 rounded-md border border-slate-300 py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
            搜尋
          </button>
        </form>

        <Link href="/items" className="text-sm text-slate-600 hover:text-slate-900">
          全部物品
        </Link>
      </div>
    </header>
  );
}
