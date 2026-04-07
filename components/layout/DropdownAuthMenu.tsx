"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function DropdownAuthMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Order Lunch
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            <Link href="/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
              Sign In
            </Link>
            <Link href="/register" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
              Create Account
            </Link>
          </div>
        )}
      </div>
    );
  }

  const role = session.user.role;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm">
          {session.user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <span className="text-gray-700 font-medium">{session.user?.name?.split(" ")[0]}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {role === "PARENT" && (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                Dashboard
              </Link>
              <Link href="/orders" onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                My Orders
              </Link>
              <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                Account
              </Link>
            </>
          )}
          {role === "TEACHER" && (
            <>
              <Link href="/teacher" onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                My Classes
              </Link>
              <Link href="/teacher/order" onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                Place Order
              </Link>
            </>
          )}
          {role === "ADMIN" && (
            <>
              <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                Admin Dashboard
              </Link>
            </>
          )}
          <hr className="my-1 border-gray-100" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
