// components/Header.js
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function Header() {
  const { data: session } = useSession();
  const { data } = useSWR("/api/latest", fetcher, { refreshInterval: 2000 });
  const latest = data?.latest || null;
  const voltage = latest ? latest.voltage.toFixed(2) : "--";
  const power = latest ? latest.power.toFixed(3) : "--";

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          {/* Use Link directly (no inner <a>) */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold">☀</div>
            <span className="font-semibold text-slate-700">Solar Monitor</span>
          </Link>

          <div className="ml-6 flex gap-4 items-center text-sm text-slate-600">
            <div className="px-3 py-1 rounded bg-slate-50 border">
              <div className="text-xs text-slate-400">Volt</div>
              <div className="text-sm font-medium">{voltage} V</div>
            </div>
            <div className="px-3 py-1 rounded bg-slate-50 border">
              <div className="text-xs text-slate-400">Power</div>
              <div className="text-sm font-medium">{power} W</div>
            </div>
            <div className="px-3 py-1 rounded bg-slate-50 border">
              <div className="text-xs text-slate-400">Device</div>
              <div className="text-sm">{latest?.device_id || "–"}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600 mr-2">Hi, {session.user?.name || session.user?.email}</div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* No <a> inside Link */}
              <Link href="/login" className="px-3 py-1 rounded border text-sm">Sign in</Link>
              <Link href="/signup" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
