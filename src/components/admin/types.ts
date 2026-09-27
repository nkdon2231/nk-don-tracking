import type { Role } from "@/lib/constants";

export type Staff = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  authProvider: "local" | "supabase";
};

export type SessionInfo = {
  user: Staff | null;
  database: string;
  storage: string;
  notifications: { email: boolean; sms: boolean; whatsapp: boolean };
};

export type Facility = {
  id: string;
  name: string;
  facilityCode: string;
  type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  operatingHours: string;
  isActive: boolean;
  isDemo: boolean;
};

export type Shipment = {
  id: string;
  trackingNumber: string;
  referenceNumber: string;
  status: string;
  statusLabel: string;
  serviceType: string;
  serviceLabel: string;
  shipmentType: string;
  shipmentTypeLabel: string;
  senderName: string;
  senderCompany: string;
  senderPhone: string;
  senderEmail: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderCountry: string;
  recipientName: string;
  recipientCompany: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientCountry: string;
  originFacilityId: string | null;
  destinationFacilityId: string | null;
  currentFacilityId: string | null;
  packageCount: number;
  weight: number | null;
  weightUnit: string;
  dimensions: string;
  declaredValue: number | null;
  currency: string;
  description: string;
  publicDescription: string;
  internalNotes: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  specialInstructions: string;
  isDemo: boolean;
  archivedAt: string | null;
  createdAt: string | null;
};

export type ShipmentEvent = {
  id: string;
  status: string;
  statusLabel: string;
  title: string;
  description: string;
  location: string;
  facilityId: string | null;
  facilityName: string;
  eventTime: string | null;
  createdByName: string;
};

export type EvidenceItem = {
  id: string;
  shipmentId: string;
  eventId: string | null;
  publicToken: string;
  evidenceType: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: number;
  location: string;
  facilityId: string | null;
  capturedAt: string | null;
  isPublic: boolean;
  isDemo: boolean;
  createdAt: string | null;
  trackingNumber: string;
};
