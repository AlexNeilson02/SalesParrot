import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl">
          🦜
        </div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted">Start tracking your door-to-door route</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <AuthForm action={registerAction} mode="register" />
      </div>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-dark underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
