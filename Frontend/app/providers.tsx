"use client";

import React from "react";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import Link from "next/link";
/**
 * Providers wraps the app with client-side providers.
 * Put any client-only providers (Clerk, editors, theme providers) here.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // ClerkProvider will pick publishable key from NEXT_PUBLIC_ env vars automatically
    <ClerkProvider>{children}</ClerkProvider>
  );
}

/**
 * AuthHeader is a small client-side header component with Clerk buttons
 * We keep it here (client) so the server layout remains a pure server component.
 */
export function AuthHeader() {
  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      <SignedOut>
        <SignInButton mode="redirect" forceRedirectUrl="/sign-in">
          <button className="text-sm">Sign in</button>
        </SignInButton>

        <SignUpButton mode="redirect" forceRedirectUrl="/sign-up">
          <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm h-10 px-4 cursor-pointer">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}