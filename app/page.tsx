'use client'

import { AuthCheck } from '@/components/AuthCheck'
import Home from '@/components/Home'
import { useStytch } from '@stytch/nextjs'
import { Button } from '@/components/ui/button'
import { useStytchUser } from '@stytch/nextjs'

export default function Page() {
  const stytchClient = useStytch();
  const { user } = useStytchUser();

  const handleGoogleLogin = () => {
    stytchClient.oauth.google.start({
      login_redirect_url: window.location.origin,
      signup_redirect_url: window.location.origin,
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-8">Welcome to Digester</h1>
        <Button onClick={handleGoogleLogin} variant="outline" size="lg">
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <AuthCheck>
      <Home />
    </AuthCheck>
  )
}