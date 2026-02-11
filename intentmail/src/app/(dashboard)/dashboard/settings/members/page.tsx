import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { Users } from 'lucide-react'
import { MemberActions } from '@/components/settings/member-actions'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const org = await requireOrganization()
  const { userId } = await auth()

  const members = await db.organizationMember.findMany({
    where: { organizationId: org.id },
    orderBy: [
      { role: 'asc' }, // OWNER first
      { createdAt: 'asc' },
    ],
  })

  // Check if current user is OWNER or ADMIN
  const currentMember = members.find((m) => m.userId === userId)
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'

  const roleColors = {
    OWNER: 'default',
    ADMIN: 'secondary',
    MEMBER: 'outline',
  } as const

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Members</h1>
        <p className="text-muted-foreground">
          Manage your organization&apos;s team members and their roles
        </p>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No members</h3>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
            <CardDescription>
              Manage roles: Owner has full access, Admin can manage members and settings, Member can send emails and view analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">User ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                    {canManage && (
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">
                          {member.userId}
                          {member.userId === userId && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleColors[member.role]}>
                          {member.role.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          {member.role !== 'OWNER' && member.userId !== userId && (
                            <MemberActions
                              memberId={member.id}
                              currentRole={member.role}
                              organizationId={org.id}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <p className="text-sm text-muted-foreground">
        To invite new members, use your Clerk organization settings. Members are automatically synced.
      </p>
    </div>
  )
}
