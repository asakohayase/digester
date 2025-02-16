'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStytch, useStytchUser } from "@stytch/nextjs"

export default function AuthenticatePage() {
  const { user, isInitialized } = useStytchUser()
  const stytch = useStytch()
  const router = useRouter()

  useEffect(() => {
    const authenticateToken = async () => {
      if (!stytch || !isInitialized || user) return

      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const tokenType = params.get('stytch_token_type')

      try {
        if (token && tokenType) {
          if (tokenType === 'magic_links') {
            await stytch.magicLinks.authenticate(token, {
              session_duration_minutes: 60,
            })
          } else if (tokenType === 'oauth') {
            await stytch.oauth.authenticate(token, {
              session_duration_minutes: 60,
            })
          }
          router.push('/')
        }
      } catch (error) {
        console.error('Authentication error:', error)
      }
    }

    authenticateToken()
  }, [isInitialized, router, stytch, user])

  return null
}