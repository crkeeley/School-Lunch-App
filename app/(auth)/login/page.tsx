"use client";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import Link from "next/link";
import { z } from "zod";

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const tokenExpired = searchParams.get("error") === "invalid_token";
  const hasLeakedCredentials = searchParams.has("email") || searchParams.has("password");

  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!hasLeakedCredentials) {
      return;
    }

    router.replace("/login");
  }, [hasLeakedCredentials, router]);

  async function onSubmit(data: LoginForm) {
    setError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error === "EmailNotVerified") {
      setError("Please verify your email before signing in. Check your inbox for the verification link.");
      return;
    }
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;
    if (role === "ADMIN") router.push("/admin");
    else if (role === "TEACHER") router.push("/teacher");
    else router.push("/dashboard");
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-100 p-8">
      <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back!</h2>
      <p className="text-gray-500 font-medium mb-6 text-sm">Sign in to manage your child&apos;s lunches</p>

      {verified && (
        <div className="mb-5 p-3 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 text-sm font-semibold flex items-center gap-2">
          <span>✅</span> Email verified! You can now sign in.
        </div>
      )}

      {tokenExpired && (
        <div className="mb-5 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-yellow-700 text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span> This verification link is invalid or has expired. Please register again.
        </div>
      )}

      {hasLeakedCredentials && (
        <div className="mb-5 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-yellow-700 text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span> Login form submitted before app was ready. Please try signing in again.
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(onSubmit)(event);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Email address</label>
          <input
            {...register("email")}
            type="email"
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-medium focus:outline-none focus:border-orange-400 transition-colors"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
          <input
            {...register("password")}
            type="password"
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-medium focus:outline-none focus:border-orange-400 transition-colors"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-bounce w-full bg-orange-500 text-white py-3.5 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors disabled:opacity-50 mt-2"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 font-medium mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-orange-500 font-black hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
