// pages/login.js
import { getCsrfToken, getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login({ csrfToken }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setWorking(true);

    // signIn with credentials provider; ensure your NextAuth credentials provider expects email/password
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setWorking(false);

    if (res?.ok) {
      router.push("/");
      return;
    }

    if (res?.error) setError(res.error);
    else setError("Login failed. Check credentials.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-lg font-bold">
                ☀
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Sign in to Solar Dashboard</h1>
                <p className="text-sm text-slate-500 mt-0.5">Access your project and device data</p>
              </div>
            </div>

            {error ? (
              <div className="bg-rose-50 text-rose-700 border border-rose-100 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

              <label className="block text-sm">
                <span className="text-slate-600">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block text-sm relative">
                <span className="text-slate-600">Password</span>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-9 text-xs text-slate-500 px-2 py-1"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="rounded" />
                  Remember me
                </label>
                <Link href="/forgot" className="text-indigo-600 hover:underline">Forgot?</Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={working}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {working ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-indigo-600 hover:underline">Create one</Link>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
            By signing in you agree to the project demo usage policy. This session is stored locally for this demo.
          </div>
        </div>
      </div>
    </div>
  );
}

// server-side props: redirect logged-in users away
export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  const csrfToken = await getCsrfToken(ctx);
  return { props: { csrfToken } };
}
