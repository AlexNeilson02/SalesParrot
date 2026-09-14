import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl">
          🦜
        </div>
        <h1 className="text-2xl font-bold">SalesParrot</h1>
        <p className="text-sm text-muted">Log in to your route</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <AuthForm action={loginAction} mode="login" />
      </div>

      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-brand-dark underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
