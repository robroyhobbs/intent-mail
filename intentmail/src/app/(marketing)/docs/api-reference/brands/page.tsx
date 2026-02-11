import { CodeBlock, EndpointHeader, ParamTable } from '../../_components'

const createParams = [
  { name: 'name', type: 'string', required: true, description: 'Brand name (1-100 characters)' },
  { name: 'tagline', type: 'string', required: false, description: 'Brand tagline (max 200 characters)' },
  { name: 'colorPrimary', type: 'string', required: false, description: 'Primary color as hex (e.g., "#4598fa")' },
  { name: 'colorSecondary', type: 'string', required: false, description: 'Secondary color as hex' },
  { name: 'colorSuccess', type: 'string', required: false, description: 'Success color as hex' },
  { name: 'colorWarning', type: 'string', required: false, description: 'Warning color as hex' },
  { name: 'colorError', type: 'string', required: false, description: 'Error color as hex' },
  { name: 'colorBackground', type: 'string', required: false, description: 'Background color as hex' },
  { name: 'colorSurface', type: 'string', required: false, description: 'Surface color as hex' },
  { name: 'colorText', type: 'string', required: false, description: 'Text color as hex' },
  { name: 'colorTextMuted', type: 'string', required: false, description: 'Muted text color as hex' },
  { name: 'colorBorder', type: 'string', required: false, description: 'Border color as hex' },
  { name: 'fontHeadings', type: 'string', required: false, description: 'Heading font family' },
  { name: 'fontBody', type: 'string', required: false, description: 'Body font family' },
  { name: 'fontImportUrl', type: 'string', required: false, description: 'Font import URL (Google Fonts)' },
  { name: 'voiceTone', type: 'string', required: false, description: 'Brand voice tone description' },
  { name: 'voiceDoSay', type: 'string[]', required: false, description: 'Phrases the brand should use' },
  { name: 'voiceDontSay', type: 'string[]', required: false, description: 'Phrases the brand should avoid' },
  { name: 'logoUrl', type: 'string', required: false, description: 'Logo image URL' },
  { name: 'logoWidth', type: 'number', required: false, description: 'Logo width in pixels (10-500)' },
  { name: 'logoAlt', type: 'string', required: false, description: 'Logo alt text' },
  { name: 'fromEmail', type: 'string', required: false, description: 'Default sender email address' },
  { name: 'fromName', type: 'string', required: false, description: 'Default sender name' },
  { name: 'isDefault', type: 'boolean', required: false, description: 'Set as the default brand' },
]

export default function BrandsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Brands</h1>
      <p className="mt-4 text-lg text-slate-600">
        Brands define the visual identity and voice for your emails &mdash; colors,
        typography, logo, tone. Each organization can have multiple brands.
      </p>

      {/* Create */}
      <EndpointHeader method="POST" path="/api/v1/brands" description="Create a new brand" />
      <p className="text-sm text-slate-600">
        The first brand created is automatically set as the default. Plan limits apply to the number of brands.
      </p>
      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request Body</h3>
      <ParamTable params={createParams} />
      <CodeBlock
        language="bash"
        code={`curl -X POST https://your-app.com/api/v1/brands \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Corp",
    "colorPrimary": "#4598fa",
    "colorBackground": "#ffffff",
    "colorText": "#1e293b",
    "fontHeadings": "Inter",
    "fontBody": "Inter",
    "voiceTone": "Professional but friendly",
    "fromEmail": "hello@acme.com",
    "fromName": "Acme Team"
  }'`}
      />
      <CodeBlock
        language="json"
        code={`// 201 Created
{
  "data": {
    "id": "brand_abc123",
    "name": "Acme Corp",
    "colorPrimary": "#4598fa",
    "isDefault": true,
    "createdAt": "2026-02-10T12:00:00.000Z"
  }
}`}
      />

      {/* List */}
      <EndpointHeader method="GET" path="/api/v1/brands" description="List all brands for the organization" />
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/brands \\
  -H "Authorization: Bearer im_live_..."`}
      />
      <CodeBlock
        language="json"
        code={`{
  "data": [
    {
      "id": "brand_abc123",
      "name": "Acme Corp",
      "colorPrimary": "#4598fa",
      "isDefault": true,
      "createdAt": "2026-02-10T12:00:00.000Z"
    }
  ]
}`}
      />

      {/* Get by ID */}
      <EndpointHeader method="GET" path="/api/v1/brands/:id" description="Get a brand by ID" />
      <CodeBlock
        language="bash"
        code={`curl https://your-app.com/api/v1/brands/brand_abc123 \\
  -H "Authorization: Bearer im_live_..."`}
      />

      {/* Update */}
      <EndpointHeader method="PUT" path="/api/v1/brands/:id" description="Update a brand" />
      <p className="text-sm text-slate-600">
        All fields are optional on update. Only provided fields are changed.
      </p>
      <CodeBlock
        language="bash"
        code={`curl -X PUT https://your-app.com/api/v1/brands/brand_abc123 \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "colorPrimary": "#3b82f6",
    "voiceTone": "Casual and fun"
  }'`}
      />

      {/* Delete */}
      <EndpointHeader method="DELETE" path="/api/v1/brands/:id" description="Delete a brand" />
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <strong>Warning:</strong> Deleting a brand is irreversible. You cannot delete the default brand &mdash;
        set another brand as default first.
      </div>
      <CodeBlock
        language="bash"
        code={`curl -X DELETE https://your-app.com/api/v1/brands/brand_abc123 \\
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
