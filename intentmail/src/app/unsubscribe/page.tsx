// =============================================================================
// UNSUBSCRIBE CONFIRMATION PAGE
// GET /unsubscribe?token=xxx - Shows confirm button, does NOT auto-unsubscribe
// =============================================================================

import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const masked =
    local.length <= 2
      ? "*".repeat(local.length)
      : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
  return `${masked}@${domain}`;
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">
            Invalid Link
          </h1>
          <p className="text-slate-600">
            This unsubscribe link is invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  const data = verifyUnsubscribeToken(token);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">
            Invalid Link
          </h1>
          <p className="text-slate-600">
            This unsubscribe link is invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  const maskedEmail = maskEmail(data.email);
  const actionUrl = `/api/v1/unsubscribe?token=${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-4 text-xl font-semibold text-slate-900">
          Unsubscribe
        </h1>
        <p className="mb-6 text-slate-600">
          Click the button below to unsubscribe{" "}
          <span className="font-medium text-slate-800">{maskedEmail}</span> from
          future emails.
        </p>
        <form method="POST" action={actionUrl}>
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Confirm Unsubscribe
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-400">
          If you did not request this, you can safely close this page.
        </p>
      </div>
    </div>
  );
}
