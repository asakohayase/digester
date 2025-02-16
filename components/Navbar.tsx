'use client'

import { useStytch, useStytchUser } from "@stytch/nextjs"
import { useRouter } from "next/navigation"
import { Settings, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Navbar() {
  const { user, isInitialized } = useStytchUser()
  const stytch = useStytch()
  const router = useRouter()

  // Don't render navbar if not authenticated
  if (!isInitialized || !user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await stytch.session.revoke()
      router.push('/') // Will show login since session is revoked
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-full p-2">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <Link className="font-serif text-xl" href="/">Briefing</Link>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-primary hover:text-opacity-80 font-medium">
              Archives
            </button>
            <Link 
          href="/settings" 
          className="p-2 hover:bg-gray-100 rounded-full"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
            <Button 
              onClick={handleLogout}
              className="bg-secondary hover:bg-secondary/90 text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}