import { PartRequest } from "@/types/partRequest";
import { Vendor } from "@/types/vendor";

/**
 * Clean and format phone number for WhatsApp wa.me links.
 * Strips out spaces, dashes, plus signs, parentheses.
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  // Default to Indian country code +91 if 10 digits provided
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Builds standard pre-filled WhatsApp message for Part Procurement Request.
 * Includes unique Ref code [Ref: PR-2026-XXXX] for future Meta API / Webhook correlation.
 */
export function buildPartRequestWhatsAppMessage(params: {
  request_code?: string;
  part_name: string;
  quantity: number;
  job_card_number?: string;
  customer_name?: string;
  device_model?: string;
  priority: string;
  notes?: string;
  image_url?: string;
  requested_by_name?: string;
}): string {
  const isUrgent = params.priority?.toUpperCase() === "URGENT";
  const priorityBadge = isUrgent ? "🚨 *URGENT PART REQUEST*" : "📦 *NEW PART REQUEST*";
  const refCode = params.request_code || "PR-PENDING";

  let message = `${priorityBadge}\n`;
  message += `[Ref: ${refCode}]\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `*Part Details:*\n`;
  message += `• *Item:* ${params.part_name}\n`;
  message += `• *Quantity:* ${params.quantity}\n`;
  message += `• *Priority:* ${params.priority}\n\n`;

  if (params.job_card_number || params.device_model || params.customer_name) {
    message += `*Job Context:*\n`;
    if (params.job_card_number) message += `• *Job Card:* #${params.job_card_number}\n`;
    if (params.device_model) message += `• *Device:* ${params.device_model}\n`;
    if (params.customer_name) message += `• *Customer:* ${params.customer_name}\n`;
    message += `\n`;
  }

  if (params.notes && params.notes.trim()) {
    message += `*Notes / Specs:*\n${params.notes.trim()}\n\n`;
  }

  if (params.image_url) {
    message += `*Reference Image:* ${params.image_url}\n\n`;
  }

  if (params.requested_by_name) {
    message += `*Requested By:* ${params.requested_by_name}\n`;
  }

  message += `*Store:* Robuzta Service Center\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Please reply with price quote and availability. Thank you!`;

  return message;
}

export interface MultiPartItem {
  part_name: string;
  quantity: number;
  notes?: string;
  image_url?: string;
  request_code?: string;
}

/**
 * Builds consolidated WhatsApp message for multiple spare part items.
 */
export function buildMultiPartRequestWhatsAppMessage(params: {
  vendor_name?: string;
  items: MultiPartItem[];
  priority: string;
  job_card_number?: string;
  customer_name?: string;
  device_model?: string;
  requested_by_name?: string;
}): string {
  const isUrgent = params.priority?.toUpperCase() === "URGENT";
  const priorityBadge = isUrgent ? "🚨 *URGENT MULTI-ITEM PART REQUEST*" : "📦 *NEW MULTI-ITEM PART REQUEST*";

  let message = `${priorityBadge}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (params.job_card_number || params.device_model || params.customer_name) {
    message += `*Job Context:*\n`;
    if (params.job_card_number) message += `• *Job Card:* #${params.job_card_number}\n`;
    if (params.device_model) message += `• *Device:* ${params.device_model}\n`;
    if (params.customer_name) message += `• *Customer:* ${params.customer_name}\n`;
    message += `\n`;
  }

  message += `*Requested Parts (${params.items.length} Items):*\n`;
  params.items.forEach((item, index) => {
    const code = item.request_code ? ` [Ref: ${item.request_code}]` : "";
    message += `${index + 1}. *${item.part_name}* (Qty: ${item.quantity})${code}\n`;
    if (item.notes && item.notes.trim()) {
      message += `   • Specs/Notes: ${item.notes.trim()}\n`;
    }
    if (item.image_url) {
      message += `   • Image: ${item.image_url}\n`;
    }
  });

  message += `\n*Priority:* ${params.priority}\n`;

  if (params.requested_by_name) {
    message += `*Requested By:* ${params.requested_by_name}\n`;
  }

  message += `*Store:* Robuzta Service Center\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Please reply with price quote & stock status for all listed items. Thank you!`;

  return message;
}

/**
 * Generates direct wa.me URL with pre-filled message text.
 */
export function buildWhatsAppClickUrl(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  
  if (!formattedPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Stub function for future Meta WhatsApp Cloud API integration.
 */
export async function sendWhatsAppPartRequest(
  request: PartRequest,
  vendor: Vendor
): Promise<{ success: boolean; mode: "client_link" | "api_sent"; waUrl?: string; error?: string }> {
  const message = buildPartRequestWhatsAppMessage({
    request_code: request.request_code,
    part_name: request.part_name,
    quantity: request.quantity,
    job_card_number: request.job_card_number,
    customer_name: request.customer_name,
    device_model: request.device_model,
    priority: request.priority,
    notes: request.notes,
    image_url: request.image_url,
    requested_by_name: request.requested_by_name,
  });

  const waUrl = buildWhatsAppClickUrl(vendor.phone || vendor.whatsapp_number || "", message);

  return {
    success: true,
    mode: "client_link",
    waUrl,
  };
}
