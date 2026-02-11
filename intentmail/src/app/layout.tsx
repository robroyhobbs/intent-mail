import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IntentMail - AI-Native Email Platform',
  description: 'Send intent-driven emails with AI-powered generation and brand consistency',
}

function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  // During build time, Clerk key might not be available
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>
  }
  return <ClerkProvider>{children}</ClerkProvider>
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConditionalClerkProvider>{children}</ConditionalClerkProvider>
      </body>
    </html>
  )
}
