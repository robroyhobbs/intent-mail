'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Copy, Trash2, Check } from 'lucide-react'

interface ApiKeyActionsProps {
  organizationId: string
  apiKeyId?: string
  isActive?: boolean
  canCreate?: boolean
  maxKeys?: number
}

export function ApiKeyActions({
  organizationId,
  apiKeyId,
  isActive,
  canCreate,
  maxKeys,
}: ApiKeyActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [keyName, setKeyName] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!keyName.trim()) return
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Failed to create API key')
      }

      setNewKey(data.data.key)
      setShowCreateDialog(false)
      setShowKeyDialog(true)
      setKeyName('')
      router.refresh()
    } catch (error) {
      console.error('Error creating API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!apiKeyId) return
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/api-keys/${apiKeyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async () => {
    if (!apiKeyId) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/v1/api-keys/${apiKeyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update API key')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Create button (for page header)
  if (!apiKeyId) {
    return (
      <>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button disabled={!canCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {canCreate ? 'New API Key' : 'Limit Reached'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to the email API.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="My API Key"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading || !keyName.trim()}>
                {isLoading ? 'Creating...' : 'Create Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Show new key dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy your API key now. You won&apos;t be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted p-3 font-mono text-sm">
                  {newKey}
                </code>
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Store this key securely. It will only be shown once.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowKeyDialog(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Actions for existing key
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
      >
        {isActive ? 'Disable' : 'Enable'}
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={handleDelete}
        disabled={isLoading}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
