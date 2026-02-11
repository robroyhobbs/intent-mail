import { CodeBlock, EndpointHeader, ParamTable } from '../../_components'

const createParams = [
  { name: 'name', type: 'string', required: true, description: 'Intent display name (1-200 characters)' },
  { name: 'slug', type: 'string', required: true, description: 'Unique slug (lowercase, dots, hyphens). e.g., "onboarding.welcome"' },
  { name: 'purpose', type: 'string', required: true, description: 'What this email accomplishes (1-500 characters)' },
  { name: 'tone', type: 'string', required: true, description: 'Email tone (e.g., "Friendly and encouraging")' },
  { name: 'urgency', type: 'enum', required: true, description: 'NONE | LOW | MEDIUM | HIGH' },
  { name: 'subjectDefault', type: 'string', required: true, description: 'Default subject line (1-200 characters)' },
  { name: 'description', type: 'string', required: false, description: 'Intent description (max 500 characters)' },
  { name: 'brandId', type: 'string | null', required: false, description: 'Associated brand ID. Uses default brand if null.' },
  { name: 'subjectVariants', type: 'string[]', required: false, description: 'Alternative subject line variants' },
  { name: 'subjectMaxLength', type: 'number', required: false, description: 'Max subject length (20-100, default: 50)' },
  { name: 'templateId', type: 'string', required: false, description: 'Template ID (default: "simple")' },
  { name: 'slots', type: 'Slot[]', required: false, description: 'Slot configurations for template customization' },
  { name: 'contentGoal', type: 'string', required: false, description: 'Content generation goal' },
  { name: 'contentMustInclude', type: 'string[]', required: false, description: 'Topics the email must cover' },
  { name: 'contentMustNotInclude', type: 'string[]', required: false, description: 'Topics to avoid' },
  { name: 'ctaText', type: 'string', required: false, description: 'Call-to-action button text' },
  { name: 'ctaUrl', type: 'string', required: false, description: 'Call-to-action button URL' },
  { name: 'ctaStyle', type: 'enum', required: false, description: 'SOFT | MEDIUM | STRONG (default: MEDIUM)' },
  { name: 'isActive', type: 'boolean', required: false, description: 'Whether the intent is active (default: true)' },
]

export default function IntentsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Intents</h1>
      <p className="mt-4 text-lg text-slate-600">
        Intents are the core concept of IntentMail. Instead of writing email templates,
        you declare the <em>purpose</em> of an email &mdash; what it should accomplish,
        its tone, and its structure. IntentMail handles the rest.
      </p>

      {/* Create */}
      <EndpointHeader method="POST" path="/api/v1/intents" description="Create a new intent" />
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request Body</h3>
      <ParamTable params={createParams} />
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/intents \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Welcome Email",
    "slug": "onboarding.welcome",
    "purpose": "Welcome new users and guide them to the dashboard",
    "tone": "Friendly and encouraging",
    "urgency": "MEDIUM",
    "subjectDefault": "Welcome to {{companyName}}!",
    "ctaText": "Go to Dashboard",
    "ctaUrl": "{{dashboardUrl}}",
    "ctaStyle": "STRONG",
    "contentMustInclude": ["getting started steps", "support contact"]
  }'`}
      />
      <CodeBlock
        language="json"
        code={`// 201 Created
{
  "data": {
    "id": "intent_abc123",
    "name": "Welcome Email",
    "slug": "onboarding.welcome",
    "purpose": "Welcome new users and guide them to the dashboard",
    "tone": "Friendly and encouraging",
    "urgency": "MEDIUM",
    "isActive": true,
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`}
      />

      {/* List */}
      <EndpointHeader method="GET" path="/api/v1/intents" description="List all intents for the organization" />
      <p className="text-sm text-slate-600">
        Returns intents with their associated brand name.
      </p>
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/intents \\
  -H "Authorization: Bearer im_live_..."`}
      />
      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "intent_abc123",
      "name": "Welcome Email",
      "slug": "onboarding.welcome",
      "urgency": "MEDIUM",
      "isActive": true,
      "brand": { "id": "brand_abc123", "name": "Acme Corp" },
      "createdAt": "2026-02-10T12:00:00.000Z"
    }
  ]
}`}
      />

      {/* Get by ID */}
      <EndpointHeader method="GET" path="/api/v1/intents/:id" description="Get an intent by ID" />
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/intents/intent_abc123 \\
  -H "Authorization: Bearer im_live_..."`}
      />

      {/* Update */}
      <EndpointHeader method="PUT" path="/api/v1/intents/:id" description="Update an intent" />
      <p className="text-sm text-slate-600">
        All fields are optional on update. Slug changes are validated for uniqueness.
      </p>
      <CodeBlock
        language="bash"
        code={`curl -X PUT https://your-app.com/api/v1/intents/intent_abc123 \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "tone": "Warm and professional",
    "ctaText": "Get Started Now"
  }'`}
      />

      {/* Delete */}
      <EndpointHeader method="DELETE" path="/api/v1/intents/:id" description="Delete an intent" />
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <strong>Warning:</strong> Deleting an intent is irreversible. Any API calls
        using this intent&apos;s slug will return a <code className="rounded bg-red-100 px-1 py-0.5 text-xs">NOT_FOUND</code> error.
      </div>
      <CodeBlock
        language="bash"
        code={`curl -X DELETE https://your-app.com/api/v1/intents/intent_abc123 \\
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
