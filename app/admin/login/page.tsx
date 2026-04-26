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
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center p-6">
      <form onSubmit={onSubmit} className="w-full space-y-3 rounded border bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <p className="text-sm text-gray-600">
          Sign in to manage jobs, schedule, and status updates.
        </p>

        <input
          className="w-full rounded border p-2"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded border p-2"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button disabled={isSubmitting} className="w-full rounded bg-black py-2 text-white">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
      </form>
    </div>
  );
}
