import { CodeBlock, EndpointHeader, ParamTable } from '../../_components'

const requestParams = [
  { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
  { name: 'intent', type: 'string', required: false, description: 'Intent slug (e.g., "onboarding.welcome"). Either intent or intentId is required.' },
  { name: 'intentId', type: 'string', required: false, description: 'Intent ID. Either intentId or intent slug is required.' },
  { name: 'brandId', type: 'string', required: false, description: 'Brand ID. Uses default brand if not provided.' },
  { name: 'data', type: 'object', required: false, description: 'Template variables (Handlebars). e.g., { "firstName": "Sarah" }' },
  { name: 'subject', type: 'string', required: false, description: 'Override the generated subject line. Max 200 characters.' },
  { name: 'tags', type: 'string[]', required: false, description: 'Tags for analytics and grouping.' },
  { name: 'metadata', type: 'object', required: false, description: 'Custom metadata attached to the email.' },
  { name: 'scheduledFor', type: 'string', required: false, description: 'ISO 8601 datetime to schedule the email.' },
]

export default function SendEmailPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Send Email</h1>
      <p className="mt-4 text-lg text-slate-600">
        The primary endpoint for sending emails through IntentMail.
        Provide an intent (by slug or ID) and recipient — IntentMail handles
        template generation, brand styling, and delivery.
      </p>

      <EndpointHeader
        method="POST"
        path="/api/v1/emails/send"
        description="Send an email using an intent"
      />

      {/* Authentication */}
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Authentication</h2>
      <p className="mt-2 text-slate-600">
        Requires a Bearer token with the{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">email:send</code> scope.
      </p>

      {/* Request Body */}
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Request Body</h2>
      <ParamTable params={requestParams} />

      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Note:</strong> You must provide either <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">intent</code> (slug)
        or <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">intentId</code>. If neither is provided, the API
        returns a <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">VALIDATION_ERROR</code>.
      </div>

      {/* Response */}
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Response</h2>
      <h3 className="mt-4 text-sm font-semibold text-emerald-700">Success (200)</h3>
      <CodeBlock
        language="json"
        code={`{
  "data": {
    "messageId": "msg_abc123def456",
    "subject": "Welcome to Example App, Sarah!",
    "to": "user@example.com",
    "status": "sent"
  }
}`}
      />

      <h3 className="mt-4 text-sm font-semibold text-red-700">Error Responses</h3>
      <CodeBlock
        language="json"
        code={`// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}

// 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "API key lacks email:send scope"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Intent not found: onboarding.welcome"
  }
}

// 429 Rate Limited
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded"
  }
}

// 429 Quota Exceeded
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly email quota exceeded (1000 emails)"
  }
}

// 400 Validation Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [...]
  }
}`}
      />

      {/* Examples */}
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Examples</h2>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Minimal Request (curl)
      </h3>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/emails/send \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "intent": "onboarding.welcome",
    "to": "user@example.com"
  }'`}
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Full Request (curl)
      </h3>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/emails/send \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "intent": "onboarding.welcome",
    "to": "user@example.com",
    "brandId": "brand_abc123",
    "data": {
      "firstName": "Sarah",
      "dashboardUrl": "https://app.example.com/dash",
      "trialDays": 14
    },
    "subject": "Welcome aboard, Sarah!",
    "tags": ["onboarding", "trial"],
    "metadata": { "userId": "usr_123" },
    "scheduledFor": "2026-02-11T09:00:00Z"
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

if (!response.ok) {
  const { error } = await response.json()
  throw new Error(\`\${error.code}: \${error.message}\`)
}

const { data } = await response.json()
console.log(data.messageId) // "msg_abc123def456"
console.log(data.status)    // "sent"`}
      />

      {/* Rate Limit Headers */}
      <h2 className="mt-8 text-lg font-semibold text-slate-900">Rate Limit Headers</h2>
      <p className="mt-2 text-slate-600">
        Every response includes rate limit information:
      </p>
      <CodeBlock
        language="text"
        code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1707600000`}
      />
      <p className="mt-2 text-sm text-slate-500">
        When <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">X-RateLimit-Remaining</code> reaches 0,
        subsequent requests return <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">429</code> until the reset timestamp.
      </p>
    </div>
  )
}
