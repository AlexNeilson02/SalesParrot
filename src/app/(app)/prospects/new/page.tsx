import Link from "next/link";
import { ProspectForm } from "@/components/ProspectForm";

export default function NewProspectPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/prospects" className="text-muted">
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Add prospect</h1>
      <ProspectForm />
    </div>
  );
}
