'use client'

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        <OrganizationSwitcher
          appearance={{
            elements: {
              rootBox: 'flex items-center',
              organizationSwitcherTrigger: 'flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted',
            }
          }}
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />

        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            }
          }}
        />
      </div>
    </header>
  )
}
