/**
 * Login Page
 *
 * Allows users to sign in with email and password
 */

import Link from 'next/link';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Mercatur CRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Logg inn på kontoen din
          </p>
        </div>

        <LoginForm />

        <div className="text-center text-sm">
          <span className="text-gray-600">Har du ikke konto? </span>
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Registrer deg her
          </Link>
        </div>
      </div>
    </div>
  );
}
