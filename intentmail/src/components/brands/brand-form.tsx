'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Brand } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'

interface BrandFormProps {
  organizationId: string
  brand?: Brand
}

export function BrandForm({ organizationId, brand }: BrandFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: brand?.name ?? '',
    tagline: brand?.tagline ?? '',
    colorPrimary: brand?.colorPrimary ?? '#4598fa',
    colorSecondary: brand?.colorSecondary ?? '#00b8db',
    colorSuccess: brand?.colorSuccess ?? '#10b981',
    colorWarning: brand?.colorWarning ?? '#f59e0b',
    colorError: brand?.colorError ?? '#ef4444',
    colorBackground: brand?.colorBackground ?? '#f4f4f5',
    colorSurface: brand?.colorSurface ?? '#ffffff',
    colorText: brand?.colorText ?? '#1f2937',
    colorTextMuted: brand?.colorTextMuted ?? '#6b7280',
    colorBorder: brand?.colorBorder ?? '#e5e7eb',
    fontHeadings: brand?.fontHeadings ?? "'Inter', sans-serif",
    fontBody: brand?.fontBody ?? "'Inter', sans-serif",
    fontImportUrl: brand?.fontImportUrl ?? '',
    voiceTone: brand?.voiceTone ?? 'Professional and friendly',
    voiceDoSay: (brand?.voiceDoSay as string[])?.join('\n') ?? '',
    voiceDontSay: (brand?.voiceDontSay as string[])?.join('\n') ?? '',
    logoUrl: brand?.logoUrl ?? '',
    logoWidth: brand?.logoWidth ?? 120,
    logoAlt: brand?.logoAlt ?? '',
    linkHome: brand?.linkHome ?? '',
    linkPrivacy: brand?.linkPrivacy ?? '',
    linkUnsubscribe: brand?.linkUnsubscribe ?? '',
    fromEmail: brand?.fromEmail ?? '',
    fromName: brand?.fromName ?? '',
    isDefault: brand?.isDefault ?? false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        voiceDoSay: formData.voiceDoSay.split('\n').filter(Boolean),
        voiceDontSay: formData.voiceDontSay.split('\n').filter(Boolean),
      }

      const url = brand
        ? `/api/v1/brands/${brand.id}`
        : '/api/v1/brands'
      const method = brand ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message ?? 'Failed to save brand')
      }

      router.push('/dashboard/brands')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!brand) return
    if (!confirm('Are you sure you want to delete this brand?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/brands/${brand.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete brand')
      }

      router.push('/dashboard/brands')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="logo">Logo & Links</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Brand Details</CardTitle>
              <CardDescription>Basic information about your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="My Brand"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="Your brand tagline"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => updateField('fromEmail', e.target.value)}
                    placeholder="hello@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={formData.fromName}
                    onChange={(e) => updateField('fromName', e.target.value)}
                    placeholder="My Brand"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Define your brand&apos;s color palette</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: 'colorPrimary', label: 'Primary' },
                  { key: 'colorSecondary', label: 'Secondary' },
                  { key: 'colorSuccess', label: 'Success' },
                  { key: 'colorWarning', label: 'Warning' },
                  { key: 'colorError', label: 'Error' },
                  { key: 'colorBackground', label: 'Background' },
                  { key: 'colorSurface', label: 'Surface' },
                  { key: 'colorText', label: 'Text' },
                  { key: 'colorTextMuted', label: 'Text Muted' },
                  { key: 'colorBorder', label: 'Border' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: formData[key as keyof typeof formData] as string }}
                      />
                      <Input
                        id={key}
                        type="text"
                        value={formData[key as keyof typeof formData] as string}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Configure font settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fontHeadings">Headings Font</Label>
                  <Input
                    id="fontHeadings"
                    value={formData.fontHeadings}
                    onChange={(e) => updateField('fontHeadings', e.target.value)}
                    placeholder="'Inter', sans-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontBody">Body Font</Label>
                  <Input
                    id="fontBody"
                    value={formData.fontBody}
                    onChange={(e) => updateField('fontBody', e.target.value)}
                    placeholder="'Inter', sans-serif"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontImportUrl">Google Fonts Import URL (optional)</Label>
                <Input
                  id="fontImportUrl"
                  value={formData.fontImportUrl}
                  onChange={(e) => updateField('fontImportUrl', e.target.value)}
                  placeholder="https://fonts.googleapis.com/css2?family=..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice</CardTitle>
              <CardDescription>Define your brand&apos;s tone and language guidelines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voiceTone">Voice Tone</Label>
                <Input
                  id="voiceTone"
                  value={formData.voiceTone}
                  onChange={(e) => updateField('voiceTone', e.target.value)}
                  placeholder="Professional and friendly"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="voiceDoSay">Do Say (one per line)</Label>
                  <Textarea
                    id="voiceDoSay"
                    value={formData.voiceDoSay}
                    onChange={(e) => updateField('voiceDoSay', e.target.value)}
                    placeholder="Ship your vibe&#10;Your ideas, live"
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voiceDontSay">Don&apos;t Say (one per line)</Label>
                  <Textarea
                    id="voiceDontSay"
                    value={formData.voiceDontSay}
                    onChange={(e) => updateField('voiceDontSay', e.target.value)}
                    placeholder="Simply&#10;Revolutionary&#10;Game-changing"
                    rows={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logo & Links Tab */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Links</CardTitle>
              <CardDescription>Configure logo and footer links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => updateField('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoWidth">Logo Width (px)</Label>
                  <Input
                    id="logoWidth"
                    type="number"
                    value={formData.logoWidth}
                    onChange={(e) => updateField('logoWidth', parseInt(e.target.value))}
                    placeholder="120"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoAlt">Logo Alt Text</Label>
                <Input
                  id="logoAlt"
                  value={formData.logoAlt}
                  onChange={(e) => updateField('logoAlt', e.target.value)}
                  placeholder="My Brand"
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="linkHome">Homepage URL</Label>
                  <Input
                    id="linkHome"
                    value={formData.linkHome}
                    onChange={(e) => updateField('linkHome', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkPrivacy">Privacy URL</Label>
                  <Input
                    id="linkPrivacy"
                    value={formData.linkPrivacy}
                    onChange={(e) => updateField('linkPrivacy', e.target.value)}
                    placeholder="https://example.com/privacy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkUnsubscribe">Unsubscribe URL</Label>
                  <Input
                    id="linkUnsubscribe"
                    value={formData.linkUnsubscribe}
                    onChange={(e) => updateField('linkUnsubscribe', e.target.value)}
                    placeholder="https://example.com/unsubscribe"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {brand && !brand.isDefault ? (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Brand
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : brand ? 'Save Changes' : 'Create Brand'}
          </Button>
        </div>
      </div>
    </form>
  )
}
