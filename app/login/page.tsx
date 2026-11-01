"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Check your email for the confirmation link, or log in if email confirmations are disabled locally.",
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <form
        onSubmit={handleSignIn}
        className="flex flex-col gap-4 w-80 p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg"
      >
        <h1 className="text-xl font-bold text-center">BudgetWise NZ</h1>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/50 p-2 rounded border border-red-900">
            {error}
          </p>
        )}
        {message && (
          <p className="text-emerald-400 text-sm bg-emerald-950/50 p-2 rounded border border-emerald-900">
            {message}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
        />

        <button
          type="submit"
          className="mt-2 bg-emerald-600 hover:bg-emerald-500 transition-colors p-2.5 rounded-lg font-semibold text-sm"
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={handleSignUp}
          className="bg-slate-800 hover:bg-slate-700 transition-colors p-2.5 rounded-lg text-slate-300 text-sm border border-slate-700"
        >
          Create Account (Sign Up)
        </button>
      </form>
    </div>
  );
}
