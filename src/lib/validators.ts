import { z } from "zod";
import { EVIDENCE_TYPES, FACILITY_TYPES, ROLES, SERVICE_TYPES, SHIPMENT_TYPES, STATUSES, TRACKING_RE } from "./constants";
import { HttpError } from "./http";

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => z.string().trim().min(1, "This field is required.").max(max);
const optionalEmail = z.union([z.literal(""), z.string().trim().email("Enter a valid email.").max(200)]);
const optionalSigned = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? null : value),
  z.coerce.number().min(-180).max(180).nullable(),
) as z.ZodType<number | null>;
const optionalNumber = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? null : value),
  z.coerce.number().min(0).max(1_000_000_000).nullable(),
) as z.ZodType<number | null>;
const optionalUuid = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().uuid().nullable(),
) as z.ZodType<string | null>;
const optionalDate = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.").nullable(),
) as z.ZodType<string | null>;
const timestamp = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");

const serviceValues = SERVICE_TYPES.map((item) => item.value) as [string, ...string[]];
const shipmentValues = SHIPMENT_TYPES.map((item) => item.value) as [string, ...string[]];

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(128),
});

export const setupSchema = z.object({
  token: z.string().min(16).max(200),
  name: required(120),
  email: z.string().trim().email().max(200),
  password: passwordSchema,
});

export const shipmentSchema = z.object({
  referenceNumber: text(80).optional().default(""),
  status: z.enum(STATUSES),
  serviceType: z.enum(serviceValues),
  shipmentType: z.enum(shipmentValues),
  senderName: required(160),
  senderCompany: text(160).optional().default(""),
  senderPhone: text(40).optional().default(""),
  senderEmail: optionalEmail.optional().default(""),
  senderAddress: text(300).optional().default(""),
  senderCity: text(120).optional().default(""),
  senderState: text(120).optional().default(""),
  senderCountry: text(120).optional().default(""),
  recipientName: required(160),
  recipientCompany: text(160).optional().default(""),
  recipientPhone: text(40).optional().default(""),
  recipientEmail: optionalEmail.optional().default(""),
  recipientAddress: text(300).optional().default(""),
  recipientCity: text(120).optional().default(""),
  recipientState: text(120).optional().default(""),
  recipientCountry: text(120).optional().default(""),
  originFacilityId: optionalUuid.optional(),
  destinationFacilityId: optionalUuid.optional(),
  currentFacilityId: optionalUuid.optional(),
  packageCount: z.coerce.number().int().min(1).max(10000),
  weight: optionalNumber.optional(),
  weightUnit: z.enum(["kg", "lb"]).default("kg"),
  dimensions: text(120).optional().default(""),
  declaredValue: optionalNumber.optional(),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.")
    .default("USD"),
  description: text(2000).optional().default(""),
  publicDescription: text(500).optional().default(""),
  internalNotes: text(4000).optional().default(""),
  estimatedDeliveryDate: optionalDate.optional(),
  actualDeliveryDate: optionalDate.optional(),
  specialInstructions: text(2000).optional().default(""),
  isDemo: z.boolean().optional().default(false),
});

export const eventSchema = z.object({
  status: z.enum(STATUSES),
  title: required(160),
  description: text(2000).optional().default(""),
  location: text(200).optional().default(""),
  facilityId: optionalUuid.optional(),
  eventTime: timestamp,
});

export const facilitySchema = z.object({
  name: required(160),
  facilityCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9-]+$/, "Use uppercase letters, numbers, and hyphens."),
  type: z.enum(FACILITY_TYPES),
  address: text(300).optional().default(""),
  city: text(120).optional().default(""),
  state: text(120).optional().default(""),
  country: text(120).optional().default(""),
  latitude: optionalSigned.optional(),
  longitude: optionalSigned.optional(),
  phone: text(40).optional().default(""),
  email: optionalEmail.optional().default(""),
  operatingHours: text(200).optional().default(""),
  isActive: z.boolean().optional().default(true),
  isDemo: z.boolean().optional().default(true),
});

export const evidenceMetaSchema = z.object({
  evidenceType: z.enum(EVIDENCE_TYPES),
  title: required(160),
  description: text(2000).optional().default(""),
  location: text(200).optional().default(""),
  facilityId: optionalUuid.optional(),
  eventId: optionalUuid.optional(),
  capturedAt: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    timestamp.nullable(),
  ) as z.ZodType<string | null>,
  isPublic: z.boolean().optional().default(false),
  isDemo: z.boolean().optional().default(false),
});

export const settingsSchema = z.object({
  companyName: required(160),
  tagline: required(240),
  phone: text(40).optional().default(""),
  email: optionalEmail.optional().default(""),
  address: text(300).optional().default(""),
  website: z.union([z.literal(""), z.string().trim().url("Enter a valid website URL.").max(200)]).optional().default(""),
  operatingHours: text(200).optional().default(""),
  defaultWeightUnit: z.enum(["kg", "lb"]),
  defaultCurrency: z.string().trim().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code."),
});

export const userSchema = z.object({
  name: required(120),
  email: z.string().trim().email().max(200),
  role: z.enum(ROLES),
  password: passwordSchema,
  isActive: z.boolean().optional().default(true),
});

export const userPatchSchema = z.object({
  name: required(120).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
});

export const contactSchema = z.object({
  name: required(120),
  email: z.string().trim().email().max(200),
  phone: text(40).optional().default(""),
  topic: text(80).optional().default(""),
  message: z.string().trim().min(10, "Add a short message.").max(4000),
});

export const trackingQuerySchema = z.object({
  trackingNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(TRACKING_RE, "Enter a tracking number in the format NKD-YYYYMMDD-XXXX."),
});

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .filter(Boolean)
      .slice(0, 4)
      .join(" ");
    throw new HttpError(400, "invalid_input", message || "Check the form and try again.");
  }
  return result.data;
}
