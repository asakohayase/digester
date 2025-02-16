'use client'
import { useEffect, Suspense } from "react";
import { useStytch, useStytchUser } from "@stytch/nextjs";
import { LoginOrSignupForm } from "@/components/LoginOrSignupForm";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  // Handle user profile creation/update and redirect
  useEffect(() => {
    const createOrUpdateProfile = async () => {
      if (isInitialized && user) {
        try {
          // Get primary email from Stytch user
          const primaryEmail = user.emails[0]?.email;
          
          if (!primaryEmail) {
            console.error('No email found for user');
            return;
          }

          // Create or update profile in Supabase
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.user_id,
              email: primaryEmail,
              // If name is available from OAuth, use it
              full_name: user.name?.first_name 
                ? `${user.name.first_name} ${user.name.last_name || ''}`
                : null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (error) {
            console.error('Error updating profile:', error);
            return;
          }

          // Redirect to home page after successful profile creation
          router.push("/");
        } catch (error) {
          console.error('Error in profile creation:', error);
        }
      }
    };

    createOrUpdateProfile();
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