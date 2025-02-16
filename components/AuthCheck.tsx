'use client'

import { useStytchUser } from '@stytch/nextjs'
import { StytchLogin } from '@stytch/nextjs'
import { Products, OAuthProviders } from '@stytch/vanilla-js'
import { useStytch } from '@stytch/nextjs'

const REDIRECT_URL = process.env.NEXT_PUBLIC_STYTCH_REDIRECT_URL || 'http://localhost:3000/authenticate'

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useStytchUser()
  const stytch = useStytch()

  if (!isInitialized) {
    return null
  }

  if (!user) {
    const styles = {
      container: {
        width: "100%",
      },
      buttons: {
        primary: {
          backgroundColor: "#4A37BE",
          borderColor: "#4A37BE",
        },
      },
    }
    
    const handleOAuthClick = async (provider: OAuthProviders) => {
      try {
        if (provider === OAuthProviders.Google) {
          await stytch.oauth.google.start({
            login_redirect_url: REDIRECT_URL,
            signup_redirect_url: REDIRECT_URL,
          })
        } else if (provider === OAuthProviders.Github) {
          await stytch.oauth.github.start({
            login_redirect_url: REDIRECT_URL,
            signup_redirect_url: REDIRECT_URL,
          })
        }
      } catch (error) {
        console.error('OAuth start error:', error)
      }
    }

    const config = {
      products: [Products.emailMagicLinks, Products.oauth],
      emailMagicLinksOptions: {
        loginRedirectURL: REDIRECT_URL,
        loginExpirationMinutes: 60,
        signupRedirectURL: REDIRECT_URL,
        signupExpirationMinutes: 60,
      },
      oauthOptions: {
        providers: [
          {
            type: OAuthProviders.Github,
            position: "embedded" as const,
            onClick: () => handleOAuthClick(OAuthProviders.Github)
          },
          {
            type: OAuthProviders.Google,
            position: "embedded" as const,
            onClick: () => handleOAuthClick(OAuthProviders.Google)
          }
        ],
        loginRedirectURL: REDIRECT_URL,
        signupRedirectURL: REDIRECT_URL,
      },
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-serif mb-6 text-center">Welcome to Briefing</h1>
          <StytchLogin config={config} styles={styles} />
        </div>
      </div>
    )
  }

  return <>{children}</>
}