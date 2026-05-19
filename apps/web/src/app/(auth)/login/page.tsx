import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in to your account</h2>
      <p className="text-sm text-gray-500 mb-6">Enter your hospital credentials to continue</p>
      <LoginForm />
    </>
  );
}
