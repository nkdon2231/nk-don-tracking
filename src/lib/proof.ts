export type ProofFile = {
  key: string;
  href: string;
  title: string;
  evidenceType: string;
  fileType: string;
  capturedAt: string | null;
  location: string;
  description: string;
  isDemo: boolean;
};

export type ProofEvent = {
  status: string;
  title: string;
  description?: string;
  location?: string;
  eventTime: string | null;
};

const BEFORE = new Set(["Package Before", "Package", "Package Condition"]);
const AFTER = new Set(["Package After"]);
const PICKUP = new Set(["Pickup/Handover"]);
const DELIVERY = new Set(["Delivery"]);
const SIGNATURE = new Set(["Signature"]);
const RECEIPT = new Set(["Receipt", "Waybill", "Documents"]);
const DRIVER = new Set(["Driver Video", "Courier", "Vehicle", "Transportation"]);

export function isVideo(fileType: string) {
  return fileType.startsWith("video/");
}

export function isImage(fileType: string) {
  return fileType.startsWith("image/");
}

export function proofGroups(files: ProofFile[]) {
  const videos = files.filter((file) => isVideo(file.fileType) && (file.evidenceType === "Driver Video" || DRIVER.has(file.evidenceType)));
  const driverVideo = videos.length ? videos : files.filter((file) => file.evidenceType === "Driver Video");
  return {
    driverVideo,
    vehicle: files.filter((file) => file.evidenceType === "Vehicle" || file.evidenceType === "Courier"),
    before: files.filter((file) => BEFORE.has(file.evidenceType) && isImage(file.fileType)),
    after: files.filter((file) => AFTER.has(file.evidenceType) && isImage(file.fileType)),
    pickup: files.filter((file) => PICKUP.has(file.evidenceType)),
    delivery: files.filter((file) => DELIVERY.has(file.evidenceType) || SIGNATURE.has(file.evidenceType)),
    signature: files.filter((file) => SIGNATURE.has(file.evidenceType)),
    receipt: files.filter((file) => RECEIPT.has(file.evidenceType)),
  };
}

export function deliveryRecord(status: string, actualDeliveryDate: string | null, events: ProofEvent[]) {
  const delivered = events.filter((event) => event.status === "delivered");
  const latest = delivered[delivered.length - 1];
  const confirmed = status === "delivered" || Boolean(actualDeliveryDate) || Boolean(latest);
  return {
    confirmed,
    at: latest?.eventTime ?? actualDeliveryDate,
    location: latest?.location?.trim() || "",
  };
}

export type TimelineRow = {
  key: string;
  at: string | null;
  kind: "event" | "file";
  title: string;
  detail: string;
  href?: string;
};

export function evidenceTimeline(events: ProofEvent[], files: ProofFile[]): TimelineRow[] {
  const rows: TimelineRow[] = [
    ...events.map((event, index) => ({
      key: `event-${index}-${event.eventTime ?? ""}-${event.title}`,
      at: event.eventTime,
      kind: "event" as const,
      title: event.title,
      detail: [event.location, event.description].filter(Boolean).join(" · "),
    })),
    ...files.map((file) => ({
      key: `file-${file.key}`,
      at: file.capturedAt,
      kind: "file" as const,
      title: file.title,
      detail: [file.evidenceType, file.location, file.isDemo ? "DEMO" : ""].filter(Boolean).join(" · "),
      href: file.href,
    })),
  ];
  return rows.sort((left, right) => {
    if (!left.at && !right.at) return 0;
    if (!left.at) return 1;
    if (!right.at) return -1;
    return left.at.localeCompare(right.at);
  });
}
