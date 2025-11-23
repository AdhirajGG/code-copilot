"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md">
        <SignUp
          routing="path"
          path="/sign-up"
          appearance={{
            elements: { card: "mx-auto" },
          }}
        />
        <div className="text-center mt-4">
          <span className="text-sm text-gray-400">Already have an account? </span>
          <Link href="/sign-in" className="text-sm text-indigo-400 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
