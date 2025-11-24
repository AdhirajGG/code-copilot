"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md">
        <SignIn
          routing="path"
          path="/sign-in"
          appearance={{
            elements: {
              card: "mx-auto",
            },
          }}
        />
        <div className="text-center mt-4">
          <span className="text-sm text-gray-400">Don’t have an account? </span>
          <Link href="/sign-up" className="text-sm text-indigo-400 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
