'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Role } from '@prisma/client'

interface MemberActionsProps {
  memberId: string
  currentRole: Role
  organizationId: string
}

export function MemberActions({ memberId, currentRole, organizationId }: MemberActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateRole(newRole: Role) {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/organization/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, organizationId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function removeMember() {
    if (!confirm('Are you sure you want to remove this member?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/organization/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {currentRole === 'MEMBER' && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => updateRole('ADMIN')}
        >
          Make Admin
        </Button>
      )}
      {currentRole === 'ADMIN' && (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => updateRole('MEMBER')}
        >
          Make Member
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={removeMember}
      >
        Remove
      </Button>
    </div>
  )
}
