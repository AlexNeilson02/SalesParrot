import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-4 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
