import { CodeBlock, EndpointHeader, ParamTable } from '../../_components'

const createParams = [
  { name: 'type', type: 'enum', required: true, description: 'RESEND | SENDGRID | POSTMARK | AWS_SES | MAILGUN' },
  { name: 'name', type: 'string', required: true, description: 'Display name for this provider (1-100 characters)' },
  { name: 'apiKey', type: 'string', required: true, description: 'Provider API key. Encrypted with AES-256-GCM before storage.' },
  { name: 'isDefault', type: 'boolean', required: false, description: 'Set as default provider. First provider is auto-default.' },
  { name: 'config', type: 'object', required: false, description: 'Provider-specific configuration (e.g., region for AWS SES)' },
]

const updateParams = [
  { name: 'name', type: 'string', required: false, description: 'Updated display name' },
  { name: 'apiKey', type: 'string', required: false, description: 'New API key (re-encrypted on update)' },
  { name: 'isDefault', type: 'boolean', required: false, description: 'Set as default provider' },
  { name: 'isActive', type: 'boolean', required: false, description: 'Enable or disable the provider' },
  { name: 'config', type: 'object', required: false, description: 'Updated provider-specific configuration' },
]

const testParams = [
  { name: 'type', type: 'enum', required: true, description: 'RESEND | SENDGRID | POSTMARK | AWS_SES | MAILGUN' },
  { name: 'apiKey', type: 'string', required: true, description: 'API key to test (not stored)' },
  { name: 'config', type: 'object', required: false, description: 'Provider-specific configuration' },
]

export default function ProvidersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Providers</h1>
      <p className="mt-4 text-lg text-slate-600">
        IntentMail is BYOP (Bring Your Own Provider). Connect your existing email
        service and IntentMail handles template generation and delivery through it.
        Provider API keys are encrypted with AES-256-GCM before storage.
      </p>

      {/* Create */}
      <EndpointHeader method="POST" path="/api/v1/providers" description="Add a new email provider" />
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request Body</h3>
      <ParamTable params={createParams} />
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Security:</strong> Provider API keys are encrypted with AES-256-GCM before storage
        and are <em>never</em> returned in API responses. Only the provider type and name are visible.
      </div>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/providers \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "RESEND",
    "name": "Production Resend",
    "apiKey": "re_abc123..."
  }'`}
      />
      <CodeBlock
        language="json"
        code={`// 201 Created
{
  "data": {
    "id": "prov_abc123",
    "name": "Production Resend",
    "type": "RESEND",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`}
      />

      {/* List */}
      <EndpointHeader method="GET" path="/api/v1/providers" description="List all providers for the organization" />
      <p className="text-sm text-slate-600">
        Returns providers without API keys. Includes usage statistics.
      </p>
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/providers \\
  -H "Authorization: Bearer im_live_..."`}
      />
      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "prov_abc123",
      "name": "Production Resend",
      "type": "RESEND",
      "isDefault": true,
      "isActive": true,
      "emailsSent": 142,
      "lastUsedAt": "2026-02-10T11:30:00.000Z",
      "lastErrorAt": null,
      "lastErrorMsg": null,
      "createdAt": "2026-02-10T12:00:00.000Z"
    }
  ]
}`}
      />

      {/* Get by ID */}
      <EndpointHeader method="GET" path="/api/v1/providers/:id" description="Get a provider by ID" />
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/providers/prov_abc123 \\
  -H "Authorization: Bearer im_live_..."`}
      />

      {/* Update */}
      <EndpointHeader method="PUT" path="/api/v1/providers/:id" description="Update a provider" />
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request Body</h3>
      <ParamTable params={updateParams} />
      <CodeBlock
        language="bash"
        code={`curl -X PUT https://your-app.com/api/v1/providers/prov_abc123 \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Primary Resend",
    "isActive": true
  }'`}
      />

      {/* Delete */}
      <EndpointHeader method="DELETE" path="/api/v1/providers/:id" description="Delete a provider" />
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <strong>Warning:</strong> Deleting a provider is irreversible. You cannot delete
        the default provider &mdash; set another provider as default first.
      </div>
      <CodeBlock
        language="bash"
        code={`curl -X DELETE https://your-app.com/api/v1/providers/prov_abc123 \\
  -H "Authorization: Bearer im_live_..."`}
      />
      <CodeBlock
        language="json"
        code={`{
  "data": { "success": true }
}`}
      />

      {/* Test */}
      <EndpointHeader method="POST" path="/api/v1/providers/test" description="Test a provider connection without saving" />
      <p className="text-sm text-slate-600">
        Tests that the API key and configuration are valid by making a test connection
        to the provider. The API key is <em>not</em> stored.
      </p>
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request Body</h3>
      <ParamTable params={testParams} />
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/providers/test \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "RESEND",
    "apiKey": "re_abc123..."
  }'`}
      />
      <CodeBlock
        language="json"
        code={`// Success
{
  "data": {
    "success": true,
    "error": null
  }
}

// Failure
{
  "data": {
    "success": false,
    "error": "Invalid API key"
  }
}`}
      />
    </div>
  )
}
