'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EmailProvider } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const providers = [
  {
    type: 'RESEND',
    name: 'Resend',
    description: 'Modern email API for developers',
    color: 'bg-blue-500',
    apiKeyPlaceholder: 're_...',
    docsUrl: 'https://resend.com/docs',
  },
  {
    type: 'SENDGRID',
    name: 'SendGrid',
    description: 'Email delivery service by Twilio',
    color: 'bg-blue-600',
    apiKeyPlaceholder: 'SG...',
    docsUrl: 'https://docs.sendgrid.com',
  },
  {
    type: 'POSTMARK',
    name: 'Postmark',
    description: 'Transactional email service',
    color: 'bg-yellow-500',
    apiKeyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    docsUrl: 'https://postmarkapp.com/developer',
  },
  {
    type: 'AWS_SES',
    name: 'AWS SES',
    description: 'Amazon Simple Email Service',
    color: 'bg-orange-500',
    apiKeyPlaceholder: 'AKIAXXXXXXXXXXXXXXXX:secretkey',
    docsUrl: 'https://docs.aws.amazon.com/ses',
    extraFields: [{ key: 'region', label: 'Region', placeholder: 'us-east-1' }],
  },
]

interface ProviderFormProps {
  organizationId: string
  provider?: EmailProvider
}

export function ProviderForm({ organizationId, provider }: ProviderFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [selectedType, setSelectedType] = useState(provider?.type ?? '')
  const [name, setName] = useState(provider?.name ?? '')
  const [apiKey, setApiKey] = useState('')
  const [isDefault, setIsDefault] = useState(provider?.isDefault ?? false)
  const [extraConfig, setExtraConfig] = useState<Record<string, string>>(
    (provider?.config as Record<string, string>) ?? {}
  )

  const selectedProvider = providers.find((p) => p.type === selectedType)

  const handleTest = async () => {
    if (!selectedType || !apiKey) return
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/v1/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          apiKey,
          config: extraConfig,
        }),
      })

      const data = await response.json()
      setTestResult({
        success: data.data?.success ?? false,
        message: data.data?.success ? 'Connection successful!' : data.error?.message ?? 'Connection failed',
      })
    } catch (err) {
      setTestResult({ success: false, message: 'Failed to test connection' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        type: selectedType,
        name,
        apiKey,
        isDefault,
        config: extraConfig,
      }

      const url = provider ? `/api/v1/providers/${provider.id}` : '/api/v1/providers'
      const method = provider ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message ?? 'Failed to save provider')
      }

      router.push('/dashboard/providers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!provider) return
    if (!confirm('Are you sure you want to delete this provider?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/providers/${provider.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete provider')
      }

      router.push('/dashboard/providers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Provider Selection */}
      {!provider && (
        <Card>
          <CardHeader>
            <CardTitle>Select Provider</CardTitle>
            <CardDescription>Choose your email service provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {providers.map((p) => (
                <div
                  key={p.type}
                  onClick={() => setSelectedType(p.type)}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    selectedType === p.type
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${p.color}`} />
                    <div>
                      <h4 className="font-medium">{p.name}</h4>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Enter your {selectedProvider?.name} credentials
              {selectedProvider?.docsUrl && (
                <> · <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Documentation</a></>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`My ${selectedProvider?.name} Connection`}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProvider?.apiKeyPlaceholder}
                required={!provider}
              />
              {provider && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the existing API key
                </p>
              )}
            </div>

            {selectedProvider?.extraFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={extraConfig[field.key] ?? ''}
                  onChange={(e) =>
                    setExtraConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isDefault">Set as default provider</Label>
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !apiKey}
              >
                {isTesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Test Connection
              </Button>
              {testResult && (
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                    {testResult.message}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {selectedType && (
        <div className="flex items-center justify-between">
          {provider && !provider.isDefault ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Provider
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name || (!apiKey && !provider)}>
              {isLoading ? 'Saving...' : provider ? 'Save Changes' : 'Add Provider'}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
