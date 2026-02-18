// pages/signup.js
import { useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setWorking(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password: pass }),
      });

      setWorking(false);

      if (res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setError(data?.error || "Signup failed");
    } catch (err) {
      setWorking(false);
      setError("Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                ✹
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Create your account</h1>
                <p className="text-sm text-slate-500 mt-0.5">Join the Solar Monitoring Dashboard</p>
              </div>
            </div>

            {error ? (
              <div className="bg-rose-50 text-rose-700 border border-rose-100 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm">
                <span className="text-slate-600">Name</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Your name"
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate-600">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block text-sm relative">
                <span className="text-slate-600">Password</span>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-9 text-xs text-slate-500 px-2 py-1"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </label>

              <div>
                <button
                  type="submit"
                  disabled={working}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {working ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-600 hover:underline">Sign in</Link>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
            Your account is stored securely for this demo environment.
          </div>
        </div>
      </div>
    </div>
  );
}

// Redirect logged-in users away
export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
}
