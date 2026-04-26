"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Unable to login.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center p-6 soft-enter">
      <form
        onSubmit={onSubmit}
        className="card-surface w-full space-y-4 rounded-2xl p-6 shadow-lg"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          U Bring I String
        </p>
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <p className="text-sm text-slate-600">
          Sign in to manage jobs, schedule, and status updates.
        </p>

        <input
          className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-xl border border-slate-300 bg-white p-2.5"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 py-2.5 font-semibold text-white hover:from-blue-600 hover:to-indigo-500"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
      </form>
    </div>
  );
}
