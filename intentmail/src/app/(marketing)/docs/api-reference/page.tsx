import Link from 'next/link'
import { CodeBlock } from '../_components'

const endpoints = [
  { method: 'POST', path: '/api/v1/emails/send', description: 'Send an email', link: '/docs/api-reference/send' },
  { method: 'POST', path: '/api/v1/brands', description: 'Create a brand', link: '/docs/api-reference/brands' },
  { method: 'GET', path: '/api/v1/brands', description: 'List brands', link: '/docs/api-reference/brands' },
  { method: 'GET', path: '/api/v1/brands/:id', description: 'Get a brand', link: '/docs/api-reference/brands' },
  { method: 'PUT', path: '/api/v1/brands/:id', description: 'Update a brand', link: '/docs/api-reference/brands' },
  { method: 'DELETE', path: '/api/v1/brands/:id', description: 'Delete a brand', link: '/docs/api-reference/brands' },
  { method: 'POST', path: '/api/v1/intents', description: 'Create an intent', link: '/docs/api-reference/intents' },
  { method: 'GET', path: '/api/v1/intents', description: 'List intents', link: '/docs/api-reference/intents' },
  { method: 'GET', path: '/api/v1/intents/:id', description: 'Get an intent', link: '/docs/api-reference/intents' },
  { method: 'PUT', path: '/api/v1/intents/:id', description: 'Update an intent', link: '/docs/api-reference/intents' },
  { method: 'DELETE', path: '/api/v1/intents/:id', description: 'Delete an intent', link: '/docs/api-reference/intents' },
  { method: 'POST', path: '/api/v1/providers', description: 'Create a provider', link: '/docs/api-reference/providers' },
  { method: 'GET', path: '/api/v1/providers', description: 'List providers', link: '/docs/api-reference/providers' },
  { method: 'GET', path: '/api/v1/providers/:id', description: 'Get a provider', link: '/docs/api-reference/providers' },
  { method: 'PUT', path: '/api/v1/providers/:id', description: 'Update a provider', link: '/docs/api-reference/providers' },
  { method: 'DELETE', path: '/api/v1/providers/:id', description: 'Delete a provider', link: '/docs/api-reference/providers' },
  { method: 'POST', path: '/api/v1/providers/test', description: 'Test a provider', link: '/docs/api-reference/providers' },
  { method: 'POST', path: '/api/v1/api-keys', description: 'Create an API key', link: '/docs/api-reference/api-keys' },
  { method: 'GET', path: '/api/v1/api-keys', description: 'List API keys', link: '/docs/api-reference/api-keys' },
  { method: 'GET', path: '/api/v1/api-keys/:id', description: 'Get an API key', link: '/docs/api-reference/api-keys' },
  { method: 'PATCH', path: '/api/v1/api-keys/:id', description: 'Update an API key', link: '/docs/api-reference/api-keys' },
  { method: 'DELETE', path: '/api/v1/api-keys/:id', description: 'Delete an API key', link: '/docs/api-reference/api-keys' },
]

const methodBadge: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-700',
  POST: 'bg-blue-500/10 text-blue-700',
  PUT: 'bg-amber-500/10 text-amber-700',
  PATCH: 'bg-purple-500/10 text-purple-700',
  DELETE: 'bg-red-500/10 text-red-700',
}

const errorCodes = [
  { code: 'UNAUTHORIZED', status: '401', description: 'Invalid or missing API key' },
  { code: 'FORBIDDEN', status: '403', description: 'API key lacks required scope' },
  { code: 'NOT_FOUND', status: '404', description: 'Resource not found' },
  { code: 'VALIDATION_ERROR', status: '400', description: 'Invalid request data' },
  { code: 'RATE_LIMITED', status: '429', description: 'Request rate exceeded' },
  { code: 'QUOTA_EXCEEDED', status: '429', description: 'Monthly email quota exceeded' },
  { code: 'SEND_FAILED', status: '500', description: 'Provider delivery failure' },
  { code: 'INTERNAL_ERROR', status: '500', description: 'Unexpected server error' },
]

export default function ApiReferencePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">API Reference</h1>
      <p className="mt-4 text-lg text-slate-600">
        Everything you need to integrate IntentMail into your application.
      </p>

      {/* Base URL */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">Base URL</h2>
      <p className="mt-2 text-slate-600">
        All API endpoints are relative to your application&apos;s base URL:
      </p>
      <CodeBlock language="text" code="https://your-app.com/api/v1" />

      {/* Authentication */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">Authentication</h2>
      <p className="mt-2 text-slate-600">
        All API requests require a Bearer token in the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">Authorization</code> header.
        API keys are created in the dashboard under <strong>API Keys</strong>.
      </p>
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/brands \\
  -H "Authorization: Bearer im_live_..."`}
      />
      <p className="mt-3 text-slate-600">
        Each API key has <strong>scopes</strong> that control access:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
        <li><code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">email:send</code> &mdash; Permission to send emails</li>
        <li><code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">*</code> &mdash; Full access to all endpoints</li>
      </ul>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Keep your API keys secret.</strong> Do not expose them in client-side code or public repositories.
        API keys are hashed with SHA-256 and cannot be recovered.
      </div>

      {/* Rate Limiting */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">Rate Limiting</h2>
      <p className="mt-2 text-slate-600">
        API requests are rate limited based on your plan. Rate limit information is
        included in response headers:
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-2 pr-4 font-semibold text-slate-700">Header</th>
              <th className="pb-2 font-semibold text-slate-700">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50/50">
              <td className="py-2 pr-4"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">X-RateLimit-Limit</code></td>
              <td className="py-2 text-slate-600">Maximum requests per window</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">X-RateLimit-Remaining</code></td>
              <td className="py-2 text-slate-600">Remaining requests in current window</td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="py-2 pr-4"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">X-RateLimit-Reset</code></td>
              <td className="py-2 text-slate-600">Unix timestamp when the window resets</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">
        When rate limited, the API returns a <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">429</code> status code.
        Wait until the reset time before retrying.
      </p>

      {/* Error Format */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">Error Format</h2>
      <p className="mt-2 text-slate-600">
        All errors follow a consistent format:
      </p>
      <CodeBlock
        language="json"
        code={`{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {}
  }
}`}
      />

      <h3 className="mt-6 text-lg font-semibold text-slate-900">Error Codes</h3>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-2 pr-4 font-semibold text-slate-700">Code</th>
              <th className="pb-2 pr-4 font-semibold text-slate-700">Status</th>
              <th className="pb-2 font-semibold text-slate-700">Description</th>
            </tr>
          </thead>
          <tbody>
            {errorCodes.map((err, i) => (
              <tr key={err.code} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                <td className="py-2 pr-4">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium">{err.code}</code>
                </td>
                <td className="py-2 pr-4 text-slate-600">{err.status}</td>
                <td className="py-2 text-slate-600">{err.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Endpoints Overview */}
      <h2 className="mt-10 text-xl font-semibold text-slate-900">Endpoints</h2>
      <p className="mt-2 mb-4 text-slate-600">
        IntentMail exposes 22 endpoints across 5 resource groups:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-2 pr-4 font-semibold text-slate-700">Method</th>
              <th className="pb-2 pr-4 font-semibold text-slate-700">Endpoint</th>
              <th className="pb-2 font-semibold text-slate-700">Description</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep, i) => (
              <tr key={`${ep.method}-${ep.path}`} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                <td className="py-2 pr-4">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${methodBadge[ep.method]}`}>
                    {ep.method}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <Link href={ep.link} className="text-blue-600 hover:text-blue-500">
                    <code className="text-xs">{ep.path}</code>
                  </Link>
                </td>
                <td className="py-2 text-slate-600">{ep.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
