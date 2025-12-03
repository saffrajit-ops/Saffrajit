'use client';

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { authAPI } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type EmailFormData = z.infer<typeof emailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'forgot-password' | 'verify-reset-otp' | 'reset-password' | 'login-otp' | 'verify-login-otp'>('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPasswordSuggestion, setShowForgotPasswordSuggestion] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start OTP expiry timer (15 minutes = 900 seconds)
  const startOtpExpiryTimer = () => {
    setOtpExpiryTimer(900);
    const interval = setInterval(() => {
      setOtpExpiryTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.error('OTP has expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format timer display (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetLoginState = () => {
    setMode('login');
    setError(null);
    setFailedAttempts(0);
    setShowForgotPasswordSuggestion(false);
    setOtp(['', '', '', '', '', '']);
    setOtpExpiryTimer(0);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(data.email, data.password);

      if (response.success && response.data) {
        // Reset failed attempts on successful login
        setFailedAttempts(0);
        setShowForgotPasswordSuggestion(false);
        setAuth(response.data.user, response.data.token);
        toast.success('Login successful!');
        router.push(redirectUrl);
      } else {
        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        const errorMessage = response.message || 'Invalid email or password';
        setError(errorMessage);
        toast.error(errorMessage);

        // Show forgot password suggestion after 3 failed attempts
        if (newFailedAttempts >= 3) {
          setShowForgotPasswordSuggestion(true);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (data: EmailFormData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (result.success) {
        setEmail(data.email);
        setMode('verify-reset-otp');
        setOtp(['', '', '', '', '', '']);
        startResendTimer();
        startOtpExpiryTimer();
        toast.success('OTP sent to your email!');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(result.message || 'Failed to send OTP');
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyResetOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    if (otpExpiryTimer === 0) {
      setError('OTP has expired. Please request a new one.');
      toast.error('OTP has expired. Please request a new one.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpValue,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTP verified! Please set your new password.');
        setMode('reset-password');
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(result.message || 'Invalid OTP');
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onResetPasswordSubmit = async (data: ResetPasswordFormData) => {
    if (otpExpiryTimer === 0) {
      setError('Session has expired. Please start over.');
      toast.error('Session has expired. Please start over.');
      resetLoginState();
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Password reset successfully!');
        resetLoginState();
      } else {
        setError(result.message || 'Failed to reset password');
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onLoginWithOTPSubmit = async (data: EmailFormData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (result.success) {
        setEmail(data.email);
        setMode('verify-login-otp');
        setOtp(['', '', '', '', '', '']);
        startResendTimer();
        startOtpExpiryTimer();
        toast.success('OTP sent to your email!');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(result.message || 'Failed to send OTP');
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyLoginOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    if (otpExpiryTimer === 0) {
      setError('OTP has expired. Please request a new one.');
      toast.error('OTP has expired. Please request a new one.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setAuth(result.data.user, result.data.token);
        toast.success('Login successful!');
        router.push(redirectUrl);
      } else {
        setError(result.message || 'Invalid OTP');
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      setError(null);
      setLoading(true);

      const endpoint = (mode === 'verify-reset-otp' || mode === 'reset-password') ? 'forgot-password' : 'send-login-otp';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setOtp(['', '', '', '', '', '']);
        startResendTimer();
        startOtpExpiryTimer();
        toast.success('OTP resent to your email!');
        inputRefs.current[0]?.focus();
      } else {
        toast.error(result.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderOTPInputs = () => (
    <div className="flex justify-center gap-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(index, e)}
          onPaste={handleOtpPaste}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 focus:border-black focus:outline-none transition-colors"
        />
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Cana Gold Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <h1 className="font-serif text-2xl tracking-wider">CANA GOLD</h1>
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-gray-200 p-8">
          <h2 className="text-2xl font-serif tracking-wider mb-6 text-center">
            {mode === 'login' && 'LOGIN'}
            {mode === 'forgot-password' && 'FORGOT PASSWORD'}
            {mode === 'verify-reset-otp' && 'VERIFY OTP'}
            {mode === 'reset-password' && 'RESET PASSWORD'}
            {mode === 'login-otp' && 'LOGIN WITH OTP'}
            {mode === 'verify-login-otp' && 'VERIFY OTP'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {showForgotPasswordSuggestion && mode === 'login' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    Having trouble logging in?
                  </h3>
                  <p className="text-xs text-yellow-700 mb-3">
                    You've had {failedAttempts} failed login attempts. If you've forgotten your password, you can reset it.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setError(null);
                      setShowForgotPasswordSuggestion(false);
                    }}
                    className="text-xs font-semibold text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Reset Password →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs tracking-wider uppercase">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...registerLogin('email')}
                  className="rounded-none border-gray-300 focus:border-black"
                />
                {loginErrors.email && (
                  <p className="text-xs text-red-600">{loginErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs tracking-wider uppercase">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...registerLogin('password')}
                  className="rounded-none border-gray-300 focus:border-black"
                />
                {loginErrors.password && (
                  <p className="text-xs text-red-600">{loginErrors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    setFailedAttempts(0);
                    setShowForgotPasswordSuggestion(false);
                    setError(null);
                  }}
                  className="text-xs text-gray-600 hover:text-black underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 uppercase tracking-wider text-xs py-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <GoogleSignInButton
                mode="signin"
                redirectUrl={redirectUrl}
                onError={(error) => setError(error)}
              />

              <Button
                type="button"
                onClick={() => setMode('login-otp')}
                variant="outline"
                className="w-full rounded-none border-black text-black hover:bg-gray-100 uppercase tracking-wider text-xs py-6"
              >
                Login with OTP
              </Button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleSubmitEmail(onForgotPasswordSubmit)} className="space-y-6">
              <p className="text-sm text-gray-600 text-center">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>

              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-xs tracking-wider uppercase">
                  Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  {...registerEmail('email')}
                  className="rounded-none border-gray-300 focus:border-black"
                />
                {emailErrors.email && (
                  <p className="text-xs text-red-600">{emailErrors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 uppercase tracking-wider text-xs py-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Sending OTP...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetLoginState}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}

          {/* Verify Reset OTP */}
          {mode === 'verify-reset-otp' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit OTP to
                </p>
                <p className="font-semibold text-gray-900 mt-1">{email}</p>
                {otpExpiryTimer > 0 ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-700">
                      Expires in {formatTimer(otpExpiryTimer)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 mt-2 font-semibold">
                    OTP has expired
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-wider uppercase text-center block">
                  Enter OTP
                </Label>
                {renderOTPInputs()}
              </div>

              <Button
                type="button"
                onClick={onVerifyResetOTP}
                disabled={isLoading || otp.join('').length !== 6 || otpExpiryTimer === 0}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 uppercase tracking-wider text-xs py-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm text-gray-600 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetLoginState}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          )}

          {/* Reset Password Form */}
          {mode === 'reset-password' && (
            <form onSubmit={handleSubmitReset(onResetPasswordSubmit)} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  OTP Verified Successfully!
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Please set your new password
                </p>
                {otpExpiryTimer > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Complete within {formatTimer(otpExpiryTimer)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs tracking-wider uppercase">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  {...registerReset('newPassword')}
                  className="rounded-none border-gray-300 focus:border-black"
                />
                {resetErrors.newPassword && (
                  <p className="text-xs text-red-600">{resetErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs tracking-wider uppercase">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...registerReset('confirmPassword')}
                  className="rounded-none border-gray-300 focus:border-black"
                />
                {resetErrors.confirmPassword && (
                  <p className="text-xs text-red-600">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || otpExpiryTimer === 0}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 uppercase tracking-wider text-xs py-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetLoginState}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}

          {/* Verify Login OTP */}
          {mode === 'verify-login-otp' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit OTP to
                </p>
                <p className="font-semibold text-gray-900 mt-1">{email}</p>
                {otpExpiryTimer > 0 ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-700">
                      Expires in {formatTimer(otpExpiryTimer)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 mt-2 font-semibold">
                    OTP has expired
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-wider uppercase text-center block">
                  Enter OTP
                </Label>
                {renderOTPInputs()}
              </div>

              <Button
                type="button"
                onClick={onVerifyLoginOTP}
                disabled={isLoading || otp.join('').length !== 6 || otpExpiryTimer === 0}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 uppercase tracking-wider text-xs py-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Verifying...
                  </span>
                ) : (
                  'Verify & Login'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm text-gray-600 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetLoginState}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          )}

          {/* Login with OTP Form */}
          {mode === 'login-otp' && (
            <form onSubmit={handleSubmitEmail(onLoginWithOTPSubmit)} className="space-y-6">
              <p className="text-sm text-gray-600 text-center">
                Enter your email address and we'll send you an OTP to login.
              </p>

              <div className="space-y-2">
                <Label htmlFor="otp-email" className="text-xs tracking-wider uppercase">
                  Email
                </Label>
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="Enter your email"
                  {...registerEmail('email')}
                  className="rounded-none border-gray-300 focus:border-black"
                />
                {emailErrors.email && (
                  <p className="text-xs text-red-600">{emailErrors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 uppercase tracking-wider text-xs py-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Sending OTP...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetLoginState}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}

          {/* Verify Login OTP */}
          {mode === 'verify-login-otp' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit OTP to
                </p>
                <p className="font-semibold text-gray-900 mt-1">{email}</p>
                <p className="text-xs text-gray-500 mt-2">
                  OTP is valid for 15 minutes
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-wider uppercase text-center block">
                  Enter OTP
                </Label>
                {renderOTPInputs()}
              </div>

              <Button
                type="button"
                onClick={onVerifyLoginOTP}
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full rounded-none bg-black text-white hover:bg-gray-800 uppercase tracking-wider text-xs py-6"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Verifying...
                  </span>
                ) : (
                  'Verify & Login'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm text-gray-600 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetLoginState}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href={`/register${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="text-black underline hover:opacity-60"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
