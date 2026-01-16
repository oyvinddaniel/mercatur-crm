/**
 * Signup Page
 *
 * Allows users to create a new account
 */

import Link from 'next/link';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Mercatur CRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Opprett en ny konto
          </p>
        </div>

        <SignupForm />

        <div className="text-center text-sm">
          <span className="text-gray-600">Har du allerede en konto? </span>
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Logg inn her
          </Link>
        </div>
      </div>
    </div>
  );
}
