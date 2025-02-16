'use client'
import { useEffect, Suspense } from "react";
import { useStytch, useStytchUser } from "@stytch/nextjs";
import { LoginOrSignupForm } from "@/components/LoginOrSignupForm";
import { useRouter, useSearchParams } from "next/navigation";

function AuthenticateContent() {
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (stytch && !user && isInitialized) {
      const tokenType = searchParams.get('stytch_token_type');
      const token = searchParams.get('token');
      
      if (token && tokenType === 'magic_links') {
        stytch.magicLinks.authenticate(token, {
          session_duration_minutes: 60,
        });
      } else if(token && tokenType === 'oauth') {
        stytch.oauth.authenticate(token, {
          session_duration_minutes: 60,
        });
      }
    }
  }, [isInitialized, searchParams, stytch, user]);

  useEffect(() => {
    if (isInitialized && user) {
      // Redirect the user to an authenticated page if they are already logged in
      router.push("/");
    }
  }, [user, isInitialized, router]);

  return <LoginOrSignupForm />;
}

export default function Authenticate() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthenticateContent />
    </Suspense>
  );
}