'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  redirectUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GoogleSignInButton({ 
  mode = 'signin', 
  redirectUrl = '/',
  onSuccess,
  onError 
}: GoogleSignInButtonProps) {
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const router = useRouter();

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);

        // Exchange the access token for user info
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error('Failed to get user info from Google');
        }

        const userInfo = await userInfoResponse.json();

        // Validate required user info
        if (!userInfo.email || !userInfo.sub) {
          throw new Error('Incomplete user information from Google');
        }

        // Now authenticate with our backend using the access token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: tokenResponse.access_token,
            userInfo: userInfo,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          setAuth(result.data.user, result.data.token);
          
          // Show appropriate success message
          const successMessage = mode === 'signup' 
            ? '🎉 Account created successfully with Google!' 
            : '✅ Signed in successfully with Google!';
          
          toast.success(successMessage);
          
          if (onSuccess) {
            onSuccess();
          }
          
          // Small delay for better UX
          setTimeout(() => {
            router.push(redirectUrl);
          }, 500);
        } else {
          const errorMsg = result.message || 'Google authentication failed';
          toast.error(errorMsg);
          if (onError) {
            onError(errorMsg);
          }
        }
      } catch (error: any) {
        console.error('Google auth error:', error);
        
        // Provide user-friendly error messages
        let errorMsg = 'An error occurred during Google authentication';
        
        if (error.message.includes('Failed to get user info')) {
          errorMsg = 'Could not retrieve your Google account information. Please try again.';
        } else if (error.message.includes('Incomplete user information')) {
          errorMsg = 'Your Google account is missing required information. Please use a different sign-in method.';
        } else if (error.message.includes('fetch')) {
          errorMsg = 'Network error. Please check your internet connection and try again.';
        }
        
        toast.error(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      const errorMsg = 'Failed to sign in with Google. Please try again.';
      toast.error(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    },
  });

  return (
    <Button
      type="button"
      onClick={() => handleGoogleAuth()}
      disabled={isLoading}
      variant="outline"
      className="w-full rounded-none border-gray-300 hover:bg-gray-50 text-gray-700 uppercase tracking-wider text-xs py-6 flex items-center justify-center gap-3"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
    </Button>
  );
}
