"use client"
import { useState, useEffect } from "react"
import { signOut } from "@/app/(auth)/auth"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlusIcon, ClockIcon, FlagIcon, ArrowUpIcon, MinimizeIcon, Paintbrush, Building2, Gamepad2, Shirt, Rocket, Github, LogOut } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import SparklesText from "@/components/magicui/sparkles-text"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { githubSignIn } from './(auth)/actions';
import { createChat } from './(chat)/actions';

export default function Component() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleLogin = async () => {
    await githubSignIn();
  }

  const handleLogout = () => {
    signOut()
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      {/* Sidebar for desktop (only shown when logged in) */}
      {status === "authenticated" && (
        <div className="hidden md:flex w-16 bg-gray-100 flex-col items-center py-4 border-r">
          <div className="mb-8">
            <div className="mt-auto">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {session.user?.name ? session?.user?.name[0]?.toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mb-4 hover:border-teal-400 hover:border-2 transition-colors"
                  onClick={async () => {
                    try {
                      const chatId = await createChat("New Chat");
                      router.push(`/chat/${chatId}`);
                    } catch (error) {
                      console.error('Failed to create chat:', error);
                    }
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="sr-only">Create new chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Create new chat</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="mb-4">
                  <ClockIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Recent projects</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <FlagIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Flagged items</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="mt-auto">
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Log out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <SparklesText text="What can I help you ship today?" />
          <p className="text-gray-600 mb-8 text-center mt-8">Generate UI, ask questions, debug, execute code, and much more.</p>

          <div className="w-full max-w-3xl mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {status === "authenticated" ? (
                <>
                  <Textarea
                    placeholder="Ask v0rn a question..."
                    className="pr-12 min-h-[120px]"
                  />
                  <Button size="sm" className="absolute right-2 bottom-2">
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full">
                  <Button 
                    onClick={handleLogin} 
                    type='submit' 
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg"
                  >
                    <Github className="w-6 h-6 mr-4" />
                    Sign In with GitHub
                  </Button>
                  <p className="mt-4 text-sm text-gray-500">Start building amazing things today</p>
                </div>
              )}
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex flex-wrap justify-center items-center p-4 border-t text-sm text-gray-500">
          <p className="mx-2 my-1">Made with ❤️ by </p>
          <Link href="https://katungi.vercel.app" className="mx-2 my-1 flex items-center">
            Katungi <ArrowUpIcon className="h-4 w-4 ml-1 transform rotate-45" />
          </Link>
        </footer>
      </div>
    </div>
  )
}