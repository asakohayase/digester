import { useStytch } from '@stytch/nextjs';
import { StytchLogin } from '@stytch/nextjs';
import { Products, OAuthProviders } from '@stytch/vanilla-js';

const REDIRECT_URL = process.env.NEXT_PUBLIC_STYTCH_REDIRECT_URL;

export const LoginOrSignupForm = () => {
  const stytch = useStytch();  // Access the Stytch client

  const styles = {
    container: {
      width: "100%",
    },
    buttons: {
      primary: {
        backgroundColor: "#4F6F52",
        borderColor: "#4F6F52",
      },
    },
  };

  const handleOAuthClick = async (provider: OAuthProviders) => {
    try {
      // Use the Stytch client to initiate OAuth flows
      if (provider === OAuthProviders.Google) {
        await stytch.oauth.google.start({
          login_redirect_url: REDIRECT_URL,
          signup_redirect_url: REDIRECT_URL,
        });
      } else if (provider === OAuthProviders.Github) {
        await stytch.oauth.github.start({
          login_redirect_url: REDIRECT_URL,
          signup_redirect_url: REDIRECT_URL,
        });
      }
    } catch (error) {
      console.error('OAuth start error:', error);
    }
  };

  const config = {
    products: [Products.emailMagicLinks, Products.oauth],  // Include Email Magic Links and OAuth
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
          position: "embedded" as const,  // Add GitHub OAuth
          onClick: () => handleOAuthClick(OAuthProviders.Github),
        },
        {
          type: OAuthProviders.Google,
          position: "embedded" as const,  // Add Google OAuth
          onClick: () => handleOAuthClick(OAuthProviders.Google),
        },
      ],
      loginRedirectURL: REDIRECT_URL,
      signupRedirectURL: REDIRECT_URL,
    },
  };

  return <StytchLogin config={config} styles={styles} />;
};
