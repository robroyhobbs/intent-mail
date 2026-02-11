import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization } from '@/lib/auth'
import { createProvider } from '@/lib/email/providers'

const testSchema = z.object({
  type: z.enum(['RESEND', 'SENDGRID', 'POSTMARK', 'AWS_SES', 'MAILGUN']),
  apiKey: z.string().min(1),
  config: z.record(z.unknown()).optional(),
})

export async function POST(request: Request) {
  try {
    await requireOrganization()

    const body = await request.json()
    const data = testSchema.parse(body)

    // Create provider instance
    const provider = createProvider(
      data.type.toLowerCase() as 'resend' | 'sendgrid' | 'postmark' | 'aws_ses',
      data.apiKey,
      data.config
    )

    // Test connection
    const result = await provider.testConnection()

    return NextResponse.json({
      data: {
        success: result.success,
        error: result.error,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors } },
        { status: 400 }
      )
    }
    console.error('Provider test error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to test provider' } },
      { status: 500 }
    )
  }
}
