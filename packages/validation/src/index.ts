import { z } from "zod";

export const emailSchema = z.email("Enter a valid email address");

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  telephone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(0).optional()
});

export const newsletterSchema = z.object({ email: emailSchema });

export const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  address1: z.string().trim().min(3).max(160),
  address2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(24).optional(),
  countryCode: z.string().length(2),
  phone: z.string().trim().min(6).max(30)
});

export const recipientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  telephone: z.string().trim().min(6).max(30),
  message: z.string().trim().max(500).optional(),
  hidePrices: z.boolean().default(false),
  preferredDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid delivery date").refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a real calendar date").optional().or(z.literal("")),
  instructions: z.string().trim().max(500).optional()
});

export const checkoutSchema = z.object({
  email: emailSchema,
  shippingAddress: addressSchema,
  billingSameAsShipping: z.boolean(),
  billingAddress: addressSchema.optional(),
  shippingOptionId: z.string().regex(/^[A-Za-z0-9_-]+$/).optional(),
  paymentMethod: z.enum(["cod", "sslcommerz", "international"]),
  isGift: z.boolean(),
  recipient: recipientSchema.optional(),
  termsAccepted: z.boolean().refine((accepted) => accepted, "Please accept the terms.")
}).superRefine((input, context) => {
  if (input.isGift && !input.recipient) {
    context.addIssue({ code: "custom", path: ["recipient"], message: "Enter the gift recipient details." });
  }
  if (!input.billingSameAsShipping && !input.billingAddress) {
    context.addIssue({ code: "custom", path: ["billingAddress"], message: "Enter the billing address." });
  }
});

export const inquirySchema = z.object({
  type: z.enum(["contact", "wholesale", "corporate"]),
  company: z.string().trim().max(160).optional(),
  contactPerson: z.string().trim().min(2).max(120),
  email: emailSchema,
  telephone: z.string().trim().max(30).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  budget: z.string().trim().max(80).optional(),
  occasion: z.string().trim().max(120).optional(),
  deliveryDate: z.string().optional(),
  deliveryLocations: z.string().trim().max(500).optional(),
  packaging: z.string().trim().max(200).optional(),
  messageCard: z.string().trim().max(500).optional(),
  notes: z.string().trim().min(5).max(3000)
});

export type ContactInput = z.infer<typeof contactSchema>;
export type CheckoutFormInput = z.input<typeof checkoutSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type InquiryFormInput = z.input<typeof inquirySchema>;
export type InquiryInput = z.infer<typeof inquirySchema>;
