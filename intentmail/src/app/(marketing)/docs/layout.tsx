import Link from 'next/link'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarToggle } from './_sidebar-toggle'

const navItems = [
  { href: '/docs', label: 'Quickstart' },
  { href: '/docs/api-reference', label: 'API Reference', children: [
    { href: '/docs/api-reference/send', label: 'Send Email' },
    { href: '/docs/api-reference/brands', label: 'Brands' },
    { href: '/docs/api-reference/intents', label: 'Intents' },
    { href: '/docs/api-reference/providers', label: 'Providers' },
    { href: '/docs/api-reference/api-keys', label: 'API Keys' },
  ]},
]

function SidebarNav() {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <div key={item.href}>
          <Link
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600"
          >
            {item.label}
          </Link>
          {item.children && (
            <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <nav className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">IntentMail</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-white">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-400 text-white" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        <SidebarToggle>
          <SidebarNav />
        </SidebarToggle>
        <main className="flex-1 px-6 py-10 lg:pl-72">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
