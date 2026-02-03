import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nnos-blue to-blue-700 py-12">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-nnos-blue rounded-xl items-center justify-center mb-4">
              <span className="text-white font-bold text-3xl">N</span>
            </div>
            <h1 className="text-3xl font-bold text-nnos-blue">NNOS</h1>
            <p className="text-gray-500 mt-2">Crie sua conta</p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Já tem uma conta? </span>
            <Link href="/login" className="text-nnos-blue font-semibold hover:underline">
              Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
