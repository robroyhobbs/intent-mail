import Link from 'next/link'
import { CodeBlock } from './_components'

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Quickstart</h1>
      <p className="mt-4 text-lg text-slate-600">
        IntentMail is an intent-driven email platform. Instead of writing HTML templates,
        you declare <em>what</em> you want to say and IntentMail generates beautiful,
        brand-consistent emails automatically. Send your first email in under 5 minutes.
      </p>

      {/* Step 1 */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">
        Step 1: Create an Account
      </h2>
      <p className="mt-2 text-slate-600">
        Sign up at{' '}
        <Link href="/sign-up" className="text-blue-600 underline hover:text-blue-500">
          IntentMail
        </Link>{' '}
        to create your account. Once signed in, you&apos;ll have an organization
        automatically created for you.
      </p>

      {/* Step 2 */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">
        Step 2: Get an API Key
      </h2>
      <p className="mt-2 text-slate-600">
        Navigate to <strong>Dashboard &rarr; API Keys &rarr; Create Key</strong>.
        Give it a name like &quot;Development&quot; and select the{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">email:send</code>{' '}
        scope. Copy the key &mdash; it&apos;s only shown once.
      </p>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Important:</strong> Store your API key securely. It cannot be retrieved after creation.
        Keys use the prefix format <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">im_live_...</code>
      </div>

      {/* Step 3 */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">
        Step 3: Configure a Provider
      </h2>
      <p className="mt-2 text-slate-600">
        IntentMail is BYOP (Bring Your Own Provider). Go to{' '}
        <strong>Dashboard &rarr; Providers &rarr; Add Provider</strong> and connect
        your email service. Supported providers:
      </p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
        <li>Resend</li>
        <li>SendGrid</li>
        <li>Postmark</li>
        <li>AWS SES</li>
        <li>Mailgun</li>
      </ul>
      <p className="mt-3 text-sm text-slate-500">
        Your first provider is automatically set as the default.
      </p>

      {/* Step 4 */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">
        Step 4: Create Your First Intent
      </h2>
      <p className="mt-2 text-slate-600">
        Go to <strong>Dashboard &rarr; Intents &rarr; Create Intent</strong>. An intent
        describes the <em>purpose</em> of an email, not its markup. For example:
      </p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
        <li><strong>Name:</strong> Welcome Email</li>
        <li><strong>Slug:</strong> <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">onboarding.welcome</code></li>
        <li><strong>Purpose:</strong> Welcome new users and guide them to the dashboard</li>
        <li><strong>Tone:</strong> Friendly and encouraging</li>
      </ul>

      {/* Step 5 */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">
        Step 5: Send an Email
      </h2>
      <p className="mt-2 text-slate-600">
        Make a POST request to the send endpoint with your API key and intent slug:
      </p>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        curl
      </h3>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/emails/send \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "intent": "onboarding.welcome",
    "to": "user@example.com",
    "data": {
      "firstName": "Sarah",
      "dashboardUrl": "https://app.example.com/dash"
    }
  }'`}
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        TypeScript
      </h3>
      <CodeBlock
        language="typescript"
        code={`const response = await fetch('https://your-app.com/api/v1/emails/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer im_live_...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    intent: 'onboarding.welcome',
    to: 'user@example.com',
    data: {
      firstName: 'Sarah',
      dashboardUrl: 'https://app.example.com/dash',
    },
  }),
})

const { data } = await response.json()
console.log(data.messageId) // Provider message ID`}
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Response
      </h3>
      <CodeBlock
        language="json"
        code={`{
  "data": {
    "messageId": "msg_abc123",
    "subject": "Welcome to Example App, Sarah!",
    "to": "user@example.com",
    "status": "sent"
  }
}`}
      />

      {/* What's Next */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">
        What&apos;s Next
      </h2>
      <ul className="mt-3 space-y-2">
        <li>
          <Link
            href="/docs/api-reference"
            className="text-blue-600 underline hover:text-blue-500"
          >
            API Reference
          </Link>{' '}
          &mdash; Authentication, rate limits, error handling, and all endpoints
        </li>
        <li>
          <Link
            href="/docs/api-reference/send"
            className="text-blue-600 underline hover:text-blue-500"
          >
            Send Email Endpoint
          </Link>{' '}
          &mdash; Full request/response documentation with all options
        </li>
      </ul>
    </div>
  )
}
