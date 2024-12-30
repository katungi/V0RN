"use client";

import { signIn } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

const Page = () => {
  return (
    <main className="bg-popover max-w-lg mx-auto my-4 rounded-lg p-10">
      <h1 className="text-2xl font-bold text-center">
        Sign in to your account
      </h1>
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full flex items-center justify-center space-x-2 py-6 text-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={() => signIn('github', { callbackUrl: "/dashboard" })}
        >
          <Github className="w-6 h-6 mr-2" />
          <span>Continue with GitHub</span>
        </Button>
      </div>
    </main>
  );
};

export default Page;
