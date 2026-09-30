import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { barcodeLayout } from "@/lib/codes";
import { BRAND, SUPPORT_EMAIL } from "@/lib/constants";
import { query } from "@/lib/db";
import { readEvidenceFile } from "@/lib/files";
import { formatWhen } from "@/lib/format";
import { deliveryRecord, isImage, isVideo } from "@/lib/proof";
import { publicOrigin } from "@/lib/site-url";
import { publicTracking } from "./operations";

function pdfText(value: string) {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim().slice(0, 180);
}

function drawTracked(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>, tracking: number) {
  let cursor = x;
  for (const char of text) {
    page.drawText(char, { x: cursor, y, size, font, color });
    cursor += font.widthOfTextAtSize(char, size) + tracking;
  }
}

function place(city: string, country: string) {
  return [city, country].filter(Boolean).join(", ") || "Not recorded";
}

export async function buildProofPdf(trackingNumber: string) {
  const shipment = await publicTracking(trackingNumber);
  if (!shipment) return null;
  const found = await query<{ id: string }>("select id from shipments where tracking_number = $1", [trackingNumber]);
  const shipmentId = found[0]?.id;
  const files = shipmentId
    ? await query<{
        evidence_type: string;
        title: string;
        file_path: string;
        file_type: string;
        location: string;
        captured_at: string | Date | null;
        created_at: string | Date;
      }>(
        `select evidence_type, title, file_path, file_type, location, captured_at, created_at
         from shipment_evidence
         where shipment_id = $1 and is_public = true
         order by captured_at asc nulls last, created_at asc`,
        [shipmentId],
      )
    : [];
  const delivery = deliveryRecord(shipment.status, shipment.actualDeliveryDate, shipment.events);
  const site = publicOrigin();
  const proofUrl = `${site}/proof?number=${encodeURIComponent(shipment.trackingNumber)}`;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const wordmark = await pdf.embedFont(StandardFonts.TimesRoman);
  const navy = rgb(0.027, 0.078, 0.133);
  const gold = rgb(0.902, 0.788, 0.541);
  const cream = rgb(0.953, 0.937, 0.902);
  const ink = rgb(0.12, 0.14, 0.16);
  const muted = rgb(0.35, 0.4, 0.45);

  page.drawRectangle({ x: 0, y: 790, width: 595.28, height: 52, color: navy });
  page.drawRectangle({ x: 0, y: 786, width: 595.28, height: 4, color: gold });
  drawTracked(page, pdfText(BRAND.short), 40, 816, 13, wordmark, cream, 2.1);
  drawTracked(page, "INTERNATIONAL COURIER & EXPRESS", 40, 800, 7, font, rgb(0.82, 0.84, 0.86), 1.15);

  page.drawText(delivery.confirmed ? "Proof of delivery" : "Shipment receipt", { x: 40, y: 752, size: 22, font: bold, color: navy });
  page.drawText(pdfText(shipment.trackingNumber), { x: 40, y: 726, size: 15, font: bold, color: ink });
  page.drawText(delivery.confirmed ? "Delivery is recorded on this file." : "Delivery has not been recorded on this file.", {
    x: 40,
    y: 708,
    size: 10,
    font,
    color: muted,
  });

  const qr = await QRCode.toBuffer(proofUrl, { type: "png", margin: 0, width: 180 });
  const qrImage = await pdf.embedPng(qr);
  page.drawImage(qrImage, { x: 470, y: 692, width: 82, height: 82 });

  const bars = barcodeLayout(shipment.trackingNumber);
  const scale = Math.min(340 / Math.max(bars.width, 1), 0.5);
  for (const bar of bars.rects) {
    page.drawRectangle({
      x: 40 + bar.x * scale,
      y: 652,
      width: Math.max(0.35, bar.width * scale),
      height: 32,
      color: ink,
    });
  }

  const facts: [string, string][] = [
    ["Status", shipment.statusLabel],
    ["Service", `${shipment.serviceType} / ${shipment.shipmentType}`],
    ["From", place(shipment.origin.city, shipment.origin.country)],
    ["To", place(shipment.destination.city, shipment.destination.country)],
    ["Recipient", shipment.recipientName || "Not recorded"],
    ["Packages", String(shipment.packageCount)],
    ["Weight", shipment.weight == null ? "Not recorded" : `${shipment.weight} ${shipment.weightUnit}`],
    ["Delivery time", delivery.at ? formatWhen(delivery.at, true) : "Not recorded"],
    ["Delivery place", delivery.location || "Not recorded"],
    ["Driver", shipment.courier ? `${shipment.courier.name}${shipment.courier.isDemo ? " (DEMO)" : ""}` : "Not assigned"],
    ["Vehicle", shipment.courier?.vehicle || "Not recorded"],
  ];
  let y = 630;
  for (const [label, value] of facts) {
    page.drawText(label, { x: 40, y, size: 8, font, color: muted });
    page.drawText(pdfText(value) || "Not recorded", { x: 145, y, size: 10, font: bold, color: ink });
    y -= 15;
  }

  y -= 6;
  page.drawText("Public evidence", { x: 40, y, size: 12, font: bold, color: navy });
  y -= 16;
  if (files.length === 0) {
    page.drawText("No public photo, video, signature, or receipt has been released.", { x: 40, y, size: 9, font, color: muted });
    y -= 14;
  }
  for (const file of files) {
    if (y < 210) {
      page.drawText("Further files are on the proof page.", { x: 40, y, size: 8, font, color: muted });
      break;
    }
    const when = file.captured_at ?? file.created_at;
    const stamp = when ? formatWhen(new Date(when).toISOString(), true) : "";
    const kind = isVideo(file.file_type) ? "Video" : isImage(file.file_type) ? "Photo" : "Document";
    page.drawText(pdfText(`${kind} · ${file.evidence_type} · ${file.title}`), { x: 40, y, size: 9, font, color: ink });
    y -= 11;
    const meta = [file.location, stamp].filter(Boolean).join(" · ");
    if (meta) {
      page.drawText(pdfText(meta), { x: 48, y, size: 8, font, color: muted });
      y -= 12;
    }
  }

  let imageX = 40;
  for (const file of files.filter((item) => item.file_type === "image/jpeg" || item.file_type === "image/png").slice(0, 3)) {
    try {
      const bytes = await readEvidenceFile(file.file_path);
      const embedded = file.file_type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const width = 150;
      const height = Math.min(100, (embedded.height / embedded.width) * width);
      page.drawImage(embedded, { x: imageX, y: 78, width, height });
      imageX += width + 10;
    } catch {
      // Keep the written list. Do not substitute another image.
    }
  }

  page.drawText(pdfText(`${BRAND.legal}. ${SUPPORT_EMAIL}. Mail is not sent automatically.`), {
    x: 40,
    y: 52,
    size: 8,
    font,
    color: muted,
  });
  page.drawText("This document repeats stored records. It does not add a photo, signature, place, or GPS point.", {
    x: 40,
    y: 38,
    size: 8,
    font,
    color: muted,
  });

  return Buffer.from(await pdf.save());
}
