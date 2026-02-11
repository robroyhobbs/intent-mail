import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg text-slate-400">Page not found</p>
      <Button asChild className="mt-8 bg-blue-500 hover:bg-blue-400">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
