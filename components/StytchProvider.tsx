'use client'
import { StytchProvider as StytchProviderBase } from '@stytch/nextjs'
import { createStytchUIClient } from '@stytch/nextjs/ui'

interface StytchOptions {
  cookieOptions: {
    opaqueTokenCookieName: string
    jwtCookieName: string
    path: string
    availableToSubdomains: boolean
    domain: string
  }
}

const stytchOptions: StytchOptions = {
  cookieOptions: {
    opaqueTokenCookieName: "stytch_session",
    jwtCookieName: "stytch_session_jwt",
    path: "",
    availableToSubdomains: false,
    domain: "",
  }
}

const stytchClient = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!,
  stytchOptions
)

export function StytchProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StytchProviderBase stytch={stytchClient}>
      {children}
    </StytchProviderBase>
  )
}