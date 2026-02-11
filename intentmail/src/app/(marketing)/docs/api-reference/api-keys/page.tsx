import { CodeBlock, EndpointHeader, ParamTable } from '../../_components'

const createParams = [
  { name: 'name', type: 'string', required: true, description: 'Key name for identification (1-100 characters)' },
  { name: 'scopes', type: 'string[]', required: false, description: 'Permission scopes. Default: ["email:send"]. Use ["*"] for full access.' },
  { name: 'expiresAt', type: 'string', required: false, description: 'ISO 8601 expiration datetime. Null for no expiration.' },
]

const updateParams = [
  { name: 'name', type: 'string', required: false, description: 'Updated key name' },
  { name: 'isActive', type: 'boolean', required: false, description: 'Enable or disable the key' },
  { name: 'scopes', type: 'string[]', required: false, description: 'Updated permission scopes' },
]

export default function ApiKeysPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">API Keys</h1>
      <p className="mt-4 text-lg text-slate-600">
        API keys authenticate requests to the IntentMail API. Keys are hashed with
        SHA-256 before storage &mdash; the full key is only returned once at creation time.
        Keys use the prefix format <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">im_live_...</code>
      </p>

      {/* Create */}
      <EndpointHeader method="POST" path="/api/v1/api-keys" description="Create a new API key" />
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request Body</h3>
      <ParamTable params={createParams} />
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Important:</strong> The full API key is only returned in the creation response.
        Store it securely &mdash; it cannot be retrieved again. Plan limits apply to the number of keys.
      </div>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/api-keys \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Key",
    "scopes": ["email:send"],
    "expiresAt": "2027-02-10T00:00:00Z"
  }'`}
      />
      <CodeBlock
        language="json"
        code={`// 201 Created
{
  "data": {
    "id": "key_abc123",
    "name": "Production Key",
    "key": "im_live_a1b2c3d4e5f6...",
    "keyPrefix": "im_live_a1b2",
    "scopes": ["email:send"],
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`}
      />

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        TypeScript
      </h3>
      <CodeBlock
        language="typescript"
        code={`const response = await fetch('https://your-app.com/api/v1/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer im_live_...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Production Key',
    scopes: ['email:send'],
  }),
})

const { data } = await response.json()
// IMPORTANT: Store data.key securely — it won't be shown again
console.log(data.key)       // "im_live_a1b2c3d4e5f6..."
console.log(data.keyPrefix) // "im_live_a1b2"`}
      />

      {/* List */}
      <EndpointHeader method="GET" path="/api/v1/api-keys" description="List all API keys for the organization" />
      <p className="text-sm text-slate-600">
        Returns keys with prefix only (never the full key). Includes usage info.
      </p>
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/api-keys \\
  -H "Authorization: Bearer im_live_..."`}
      />
      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "key_abc123",
      "name": "Production Key",
      "keyPrefix": "im_live_a1b2",
      "scopes": ["email:send"],
      "lastUsedAt": "2026-02-10T11:30:00.000Z",
      "expiresAt": "2027-02-10T00:00:00.000Z",
      "isActive": true,
      "createdAt": "2026-02-10T12:00:00.000Z"
    }
  ]
}`}
      />

      {/* Get by ID */}
      <EndpointHeader method="GET" path="/api/v1/api-keys/:id" description="Get an API key by ID" />
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/api-keys/key_abc123 \\
  -H "Authorization: Bearer im_live_..."`}
      />

      {/* Update (PATCH) */}
      <EndpointHeader method="PATCH" path="/api/v1/api-keys/:id" description="Update an API key" />
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request Body</h3>
      <ParamTable params={updateParams} />
      <p className="text-sm text-slate-600">
        Use this to rename keys, change scopes, or disable keys without deleting them.
      </p>
      <CodeBlock
        language="bash"
        code={`curl -X PATCH https://your-app.com/api/v1/api-keys/key_abc123 \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Key (v2)",
    "scopes": ["email:send", "brands:read"]
  }'`}
      />
      <CodeBlock
        language="json"
        code={`{
  "data": {
    "id": "key_abc123",
    "name": "Production Key (v2)",
    "keyPrefix": "im_live_a1b2",
    "scopes": ["email:send", "brands:read"],
    "isActive": true,
    "updatedAt": "2026-02-10T13:00:00.000Z"
  }
}`}
      />

      {/* Delete */}
      <EndpointHeader method="DELETE" path="/api/v1/api-keys/:id" description="Delete an API key" />
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <strong>Warning:</strong> Deleting an API key is irreversible. Any applications
        using this key will immediately lose access.
      </div>
      <CodeBlock
        language="bash"
        code={`curl -X DELETE https://your-app.com/api/v1/api-keys/key_abc123 \\
  -H "Authorization: Bearer im_live_..."`}
      />
      <CodeBlock
        language="json"
        code={`{
  "data": { "success": true }
}`}
      />
    </div>
  )
}
