import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import type { Organization, Plan } from "@prisma/client";

export async function getCurrentUser() {
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}

export async function getOrganization(): Promise<Organization | null> {
  const { orgId } = await auth();
  if (!orgId) return null;

  const org = await db.organization.findUnique({
    where: { clerkId: orgId },
  });

  return org;
}

export async function getOrganizationWithLimits() {
  const org = await getOrganization();
  if (!org) return null;

  const limits = getPlanLimits(org.plan);
  return {
    ...org,
    limits,
    emailsRemaining: Math.max(
      0,
      limits.emailsPerMonth - org.emailsUsedThisMonth,
    ),
    isOverLimit: org.emailsUsedThisMonth >= limits.emailsPerMonth,
  };
}

export async function requireOrganization() {
  const org = await getOrganization();
  if (!org) {
    throw new Error(
      "Organization not found. Please create or join an organization.",
    );
  }
  return org;
}

export async function ensureOrganizationExists(): Promise<Organization> {
  const { orgId, orgSlug } = await auth();
  const user = await currentUser();

  if (!orgId || !user) {
    throw new Error("Not authenticated");
  }

  // Check if org exists
  let org = await db.organization.findUnique({
    where: { clerkId: orgId },
  });

  if (!org) {
    // Create organization
    org = await db.organization.create({
      data: {
        clerkId: orgId,
        name: orgSlug || "My Organization",
        slug: orgSlug || `org-${orgId.slice(0, 8)}`,
        billingCycleStart: new Date(),
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Create default brand
    const brand = await db.brand.create({
      data: {
        organizationId: org.id,
        name: "Default",
        isDefault: true,
      },
    });

    // Create starter intents
    await db.intent.createMany({
      data: [
        {
          organizationId: org.id,
          brandId: brand.id,
          name: "Welcome Email",
          slug: "onboarding.welcome",
          purpose: "Welcome new users and guide them to their first action",
          tone: "Warm, friendly, encouraging",
          urgency: "NONE",
          subjectDefault: "Welcome to {{productName}}, {{firstName}}!",
          subjectVariants: [
            "Your {{productName}} account is ready",
            "Let's get started, {{firstName}}",
          ],
          templateId: "simple",
          slots: [
            {
              id: "greeting",
              prompt: "Warm welcome greeting using their first name",
            },
            {
              id: "main_copy",
              prompt:
                "Brief welcome message explaining what they can do next. Keep it to 2-3 sentences.",
            },
            {
              id: "cta",
              buttonText: "Go to Dashboard",
              url: "{{dashboardUrl}}",
            },
            { id: "signoff", static: "The {{productName}} Team" },
          ],
          contentGoal: "Get the user to click through to the dashboard",
          contentMustInclude: [
            "Confirmation they signed up",
            "Clear next step",
          ],
          contentMustNotInclude: ["Pricing information", "Feature lists"],
          ctaText: "Go to Dashboard",
          ctaUrl: "{{dashboardUrl}}",
          ctaStyle: "STRONG",
        },
        {
          organizationId: org.id,
          brandId: brand.id,
          name: "Purchase Confirmation",
          slug: "transactional.purchase",
          purpose: "Confirm a purchase and provide order details",
          tone: "Professional, reassuring, clear",
          urgency: "NONE",
          subjectDefault: "Order confirmed — #{{orderId}}",
          subjectVariants: [
            "Your receipt from {{productName}}",
            "Thanks for your purchase, {{firstName}}",
          ],
          templateId: "transactional",
          slots: [
            { id: "greeting", prompt: "Brief thank you for their purchase" },
            {
              id: "details",
              prompt: "Order summary with order ID, item, and amount",
            },
            { id: "cta", buttonText: "View Order", url: "{{orderUrl}}" },
            { id: "signoff", static: "The {{productName}} Team" },
          ],
          contentGoal: "Confirm the purchase and provide receipt details",
          contentMustInclude: [
            "Order ID",
            "Amount paid",
            "What they purchased",
          ],
          contentMustNotInclude: ["Upsell offers", "Unrelated promotions"],
          ctaText: "View Order",
          ctaUrl: "{{orderUrl}}",
          ctaStyle: "MEDIUM",
        },
        {
          organizationId: org.id,
          brandId: brand.id,
          name: "Password Reset",
          slug: "security.password-reset",
          purpose: "Provide a secure password reset link",
          tone: "Direct, clear, helpful",
          urgency: "HIGH",
          subjectDefault: "Reset your {{productName}} password",
          subjectVariants: [],
          templateId: "security",
          slots: [
            {
              id: "greeting",
              prompt: "Brief acknowledgment of their password reset request",
            },
            {
              id: "details",
              prompt:
                "Instructions to reset password. Mention link expires in 1 hour.",
            },
            { id: "cta", buttonText: "Reset Password", url: "{{resetUrl}}" },
            { id: "signoff", static: "The {{productName}} Security Team" },
          ],
          contentGoal: "Get the user to click the reset link quickly",
          contentMustInclude: [
            "Link expiration time",
            "Ignore if not requested",
          ],
          contentMustNotInclude: ["Marketing content", "Social links"],
          ctaText: "Reset Password",
          ctaUrl: "{{resetUrl}}",
          ctaStyle: "STRONG",
        },
        {
          organizationId: org.id,
          brandId: brand.id,
          name: "Trial Expiring",
          slug: "lifecycle.trial-expiring",
          purpose:
            "Notify users their trial is ending soon and encourage upgrade",
          tone: "Helpful, slightly urgent, value-focused",
          urgency: "MEDIUM",
          subjectDefault: "Your trial ends in {{daysLeft}} days",
          subjectVariants: [
            "Don't lose access, {{firstName}}",
            "Upgrade before your trial ends",
          ],
          templateId: "info-box",
          slots: [
            {
              id: "greeting",
              prompt: "Friendly reminder about their trial ending",
            },
            {
              id: "intro",
              prompt: "Remind them what they will lose access to",
            },
            {
              id: "info_box",
              prompt:
                "Summary of their usage during the trial — highlight value received",
            },
            { id: "cta", buttonText: "Upgrade Now", url: "{{upgradeUrl}}" },
            { id: "signoff", static: "The {{productName}} Team" },
          ],
          contentGoal: "Get the user to upgrade to a paid plan",
          contentMustInclude: [
            "Days remaining",
            "What they lose",
            "How to upgrade",
          ],
          contentMustNotInclude: [
            "Guilt-tripping language",
            "Aggressive sales tactics",
          ],
          ctaText: "Upgrade Now",
          ctaUrl: "{{upgradeUrl}}",
          ctaStyle: "STRONG",
        },
        {
          organizationId: org.id,
          brandId: brand.id,
          name: "Invoice / Payment Receipt",
          slug: "billing.invoice",
          purpose: "Send payment receipt with invoice details",
          tone: "Professional, concise",
          urgency: "NONE",
          subjectDefault: "Invoice #{{invoiceId}} — {{amount}}",
          subjectVariants: [
            "Your {{productName}} receipt",
            "Payment received — thank you",
          ],
          templateId: "transactional",
          slots: [
            { id: "greeting", prompt: "Brief payment confirmation" },
            {
              id: "details",
              prompt: "Invoice number, amount, date, and plan name",
            },
            { id: "cta", buttonText: "View Invoice", url: "{{invoiceUrl}}" },
            { id: "signoff", static: "The {{productName}} Billing Team" },
          ],
          contentGoal: "Provide a clear payment receipt",
          contentMustInclude: ["Invoice number", "Amount", "Date", "Plan name"],
          contentMustNotInclude: ["Upsell offers"],
          ctaText: "View Invoice",
          ctaUrl: "{{invoiceUrl}}",
          ctaStyle: "SOFT",
        },
      ],
    });
  }

  return org;
}

// Plan limits
export interface PlanLimits {
  emailsPerMonth: number;
  maxBrands: number;
  maxApiKeys: number;
  rateLimitPerMinute: number;
  webhooksEnabled: boolean;
  analyticsRetentionDays: number;
  customDomain: boolean;
  prioritySupport: boolean;
}

export function getPlanLimits(plan: Plan): PlanLimits {
  switch (plan) {
    case "FREE":
      return {
        emailsPerMonth: 1000,
        maxBrands: 1,
        maxApiKeys: 2,
        rateLimitPerMinute: 100,
        webhooksEnabled: false,
        analyticsRetentionDays: 7,
        customDomain: false,
        prioritySupport: false,
      };
    case "STARTER":
      return {
        emailsPerMonth: 10000,
        maxBrands: 3,
        maxApiKeys: 5,
        rateLimitPerMinute: 500,
        webhooksEnabled: true,
        analyticsRetentionDays: 30,
        customDomain: false,
        prioritySupport: false,
      };
    case "GROWTH":
      return {
        emailsPerMonth: 50000,
        maxBrands: 10,
        maxApiKeys: 20,
        rateLimitPerMinute: 2000,
        webhooksEnabled: true,
        analyticsRetentionDays: 90,
        customDomain: true,
        prioritySupport: true,
      };
    case "ENTERPRISE":
      return {
        emailsPerMonth: Infinity,
        maxBrands: Infinity,
        maxApiKeys: Infinity,
        rateLimitPerMinute: 10000,
        webhooksEnabled: true,
        analyticsRetentionDays: 365,
        customDomain: true,
        prioritySupport: true,
      };
  }
}

export function canCreateBrand(
  org: Organization & { _count?: { brands: number } },
  limits: PlanLimits,
): boolean {
  const brandCount = org._count?.brands ?? 0;
  return brandCount < limits.maxBrands;
}

export function canCreateApiKey(
  org: Organization & { _count?: { apiKeys: number } },
  limits: PlanLimits,
): boolean {
  const apiKeyCount = org._count?.apiKeys ?? 0;
  return apiKeyCount < limits.maxApiKeys;
}

export function canSendEmail(org: Organization, limits: PlanLimits): boolean {
  return org.emailsUsedThisMonth < limits.emailsPerMonth;
}
