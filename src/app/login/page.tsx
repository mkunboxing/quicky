"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// ─── Demo credentials ──────────────────────────────────────────────────────
const DEMO_EMAIL = "testuser@quicky.com";
const DEMO_PASSWORD = "Test@123";

// ─── Copy button ───────────────────────────────────────────────────────────
function CopyButton({ value, onCopy }: { value: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
    >
      {copied ? (
        <>
          <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── Eye icons ─────────────────────────────────────────────────────────────
function EyeOff() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  );
}

function EyeOn() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // mode: "login" | "signup"
  const [mode, setMode] = useState<"login" | "signup">("login");

  // shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // signup-only
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // status
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError("");
    setSuccess("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/auth/signup", { fname, lname, email, password });
      setSuccess("Account created! Signing you in…");

      // Auto-login after signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setSuccess("");
        setError("Account created. Please sign in.");
        setMode("login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  // ── Fill demo credentials into the login form ─────────────────────────────
  function fillEmail() {
    setEmail(DEMO_EMAIL);
    if (mode !== "login") setMode("login");
  }
  function fillPassword() {
    setPassword(DEMO_PASSWORD);
    if (mode !== "login") setMode("login");
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brown-50 via-white to-brown-100 px-4 py-10">
      {/* Blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-brown-200 opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-brown-300 opacity-20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* ── Demo credentials banner ───────────────────────────────────── */}
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Demo Account</span>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            Don&apos;t want to sign up? Use this test account:
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg bg-white/70 border border-amber-200 px-3 py-1.5">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold">Email</span>
                <p className="text-xs font-mono text-amber-900 select-all">{DEMO_EMAIL}</p>
              </div>
              <CopyButton value={DEMO_EMAIL} onCopy={fillEmail} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/70 border border-amber-200 px-3 py-1.5">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold">Password</span>
                <p className="text-xs font-mono text-amber-900 select-all">{DEMO_PASSWORD}</p>
              </div>
              <CopyButton value={DEMO_PASSWORD} onCopy={fillPassword} />
            </div>
          </div>
        </div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-brown-100 bg-white/80 shadow-2xl backdrop-blur-md px-8 py-10">

          {/* Brand */}
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-extrabold tracking-tight text-brown-900">Quicky</h1>
            </Link>
            <p className="mt-2 text-sm text-brown-400">
              {isLogin ? "Sign in to continue shopping" : "Create your account"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl bg-brown-50 p-1">
            <button
              id="tab-login"
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                isLogin
                  ? "bg-white text-brown-900 shadow-sm"
                  : "text-brown-400 hover:text-brown-700"
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                !isLogin
                  ? "bg-white text-brown-900 shadow-sm"
                  : "text-brown-400 hover:text-brown-700"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error / Success banners */}
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* ── LOGIN FORM ─────────────────────────────────────────────── */}
          {isLogin && (
            <form id="login-form" onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-sm font-medium text-brown-800">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-brown-200 bg-brown-50/50 px-4 py-2.5 text-sm text-brown-900 placeholder-brown-300 outline-none transition focus:border-brown-500 focus:ring-2 focus:ring-brown-200"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-brown-800">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-brown-200 bg-brown-50/50 px-4 py-2.5 pr-11 text-sm text-brown-900 placeholder-brown-300 outline-none transition focus:border-brown-500 focus:ring-2 focus:ring-brown-200"
                  />
                  <button type="button" id="toggle-password-visibility" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-700 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>
              <button id="login-submit-btn" type="submit" disabled={loading}
                className="mt-2 w-full rounded-xl bg-brown-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brown-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Signing in…</span> : "Sign in"}
              </button>
            </form>
          )}

          {/* ── SIGNUP FORM ────────────────────────────────────────────── */}
          {!isLogin && (
            <form id="signup-form" onSubmit={handleSignup} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="signup-fname" className="block text-sm font-medium text-brown-800">First name</label>
                  <input id="signup-fname" type="text" required value={fname} onChange={(e) => setFname(e.target.value)}
                    placeholder="John"
                    className="w-full rounded-xl border border-brown-200 bg-brown-50/50 px-4 py-2.5 text-sm text-brown-900 placeholder-brown-300 outline-none transition focus:border-brown-500 focus:ring-2 focus:ring-brown-200" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="signup-lname" className="block text-sm font-medium text-brown-800">Last name</label>
                  <input id="signup-lname" type="text" required value={lname} onChange={(e) => setLname(e.target.value)}
                    placeholder="Doe"
                    className="w-full rounded-xl border border-brown-200 bg-brown-50/50 px-4 py-2.5 text-sm text-brown-900 placeholder-brown-300 outline-none transition focus:border-brown-500 focus:ring-2 focus:ring-brown-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="block text-sm font-medium text-brown-800">Email address</label>
                <input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-brown-200 bg-brown-50/50 px-4 py-2.5 text-sm text-brown-900 placeholder-brown-300 outline-none transition focus:border-brown-500 focus:ring-2 focus:ring-brown-200" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block text-sm font-medium text-brown-800">Password</label>
                <div className="relative">
                  <input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-brown-200 bg-brown-50/50 px-4 py-2.5 pr-11 text-sm text-brown-900 placeholder-brown-300 outline-none transition focus:border-brown-500 focus:ring-2 focus:ring-brown-200" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-700 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-confirm" className="block text-sm font-medium text-brown-800">Confirm password</label>
                <div className="relative">
                  <input id="signup-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                    className="w-full rounded-xl border border-brown-200 bg-brown-50/50 px-4 py-2.5 pr-11 text-sm text-brown-900 placeholder-brown-300 outline-none transition focus:border-brown-500 focus:ring-2 focus:ring-brown-200" />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-700 transition"
                    aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>
              <button id="signup-submit-btn" type="submit" disabled={loading}
                className="mt-2 w-full rounded-xl bg-brown-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brown-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Creating account…</span> : "Create Account"}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-brown-100" />
            <span className="text-xs font-medium text-brown-300">or continue with</span>
            <div className="h-px flex-1 bg-brown-100" />
          </div>

          {/* Google */}
          <button id="google-login-btn" type="button" onClick={handleGoogleLogin} disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-brown-200 bg-white px-4 py-2.5 text-sm font-medium text-brown-800 shadow-sm transition hover:bg-brown-50 active:scale-[0.98] disabled:opacity-60">
            {googleLoading ? <Spinner /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>{googleLoading ? "Redirecting…" : "Continue with Google"}</span>
          </button>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-brown-400">
            By continuing, you agree to our{" "}
            <Link href="/TermsandConditions" className="text-brown-600 underline hover:text-brown-900">Terms</Link>{" "}&amp;{" "}
            <Link href="/RefundandCancellation" className="text-brown-600 underline hover:text-brown-900">Refund Policy</Link>
          </p>
        </div>

        {/* Back */}
        <div className="mt-5 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-brown-500 hover:text-brown-900 transition">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
