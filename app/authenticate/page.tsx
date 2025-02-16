'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStytch, useStytchUser } from "@stytch/nextjs"
import { StytchError } from '@stytch/vanilla-js'

export default function AuthenticatePage() {
  const { user, isInitialized } = useStytchUser()
  const stytch = useStytch()
  const router = useRouter()

  useEffect(() => {
    const authenticateToken = async () => {
      console.log('Auth State:', { 
        stytchInitialized: !!stytch, 
        isInitialized, 
        hasUser: !!user 
      })

      if (!stytch || !isInitialized) {
        console.log('Waiting for Stytch initialization...')
        return
      }

      if (user) {
        console.log('User already authenticated, redirecting to home')
        router.push('/')
        return
      }

      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const tokenType = params.get('stytch_token_type')

      console.log('Token params:', { token, tokenType })

      try {
        if (token && tokenType === 'oauth') {
          console.log('Attempting OAuth authentication...')
          const authResult = await stytch.oauth.authenticate(token, {
            session_duration_minutes: 60,
          })
          console.log('Auth result:', authResult)
          
          if (authResult?.session_token) {
            console.log('Successfully authenticated, redirecting to home')
            router.push('/')
          } else {
            console.error('No session token in auth result')
          }
        }
      } catch (error) {
        if (error instanceof StytchError) {
          console.error('Stytch authentication error:', {
            name: error.name,
            message: error.message,
            // Log the entire error object to see its structure
            error
          })
        } else if (error instanceof Error) {
          console.error('Generic error:', {
            message: error.message,
            stack: error.stack
          })
        } else {
          console.error('Unknown error:', error)
        }
        
        // Redirect to login page on error
        router.push('/login')
      }
    }

    authenticateToken()
  }, [isInitialized, router, stytch, user])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Authenticating...</div>
    </div>
  )
}