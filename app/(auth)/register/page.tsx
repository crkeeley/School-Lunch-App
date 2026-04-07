"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validations";
import Link from "next/link";
import { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string;
  roomNumber?: string;
}

export default function RegisterPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    fetch("/api/teachers").then((r) => r.json()).then(setTeachers);
  }, []);

  async function onSubmit(data: RegisterForm) {
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Registration failed");
      return;
    }

    setRegisteredEmail(data.email);
  }

  if (registeredEmail) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox!</h2>
        <p className="text-gray-600 text-sm mb-1">
          We sent a verification link to
        </p>
        <p className="font-semibold text-gray-900 mb-4">{registeredEmail}</p>
        <p className="text-gray-500 text-sm mb-6">
          Click the link in the email to activate your account, then sign in. The link expires in 24 hours.
        </p>
        <Link
          href="/login"
          className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // Group teachers by grade
  const byGrade = teachers.reduce((acc: Record<string, Teacher[]>, t) => {
    const key = t.grade ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
      <p className="text-gray-600 text-sm mb-6">Start ordering school lunches in minutes.</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
          <input
            {...register("name")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Jane Smith"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            {...register("password")}
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="At least 8 characters"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Your Child&apos;s Information</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                {...register("childFirstName")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Alex"
              />
              {errors.childFirstName && <p className="text-red-500 text-xs mt-1">{errors.childFirstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                {...register("childLastName")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Smith"
              />
              {errors.childLastName && <p className="text-red-500 text-xs mt-1">{errors.childLastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homeroom Teacher</label>
            <select
              {...register("teacherId")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select a teacher...</option>
              {Object.entries(byGrade).map(([grade, gradeTeachers]) => (
                <optgroup key={grade} label={grade}>
                  {gradeTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                      {t.roomNumber ? ` (Room ${t.roomNumber})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.teacherId && <p className="text-red-500 text-xs mt-1">{errors.teacherId.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-green-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
