import { Linking, Alert } from 'react-native';

/**
 * Normalizes any raw phone number string into an international WhatsApp-compatible format.
 * Defaults to country code '91' for standard 10-digit Indian mobile numbers.
 */
export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  // 10-digit standard Indian mobile number (e.g., 9876543210 -> 919876543210)
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // 11-digit number starting with 0 (e.g., 09876543210 -> 919876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }

  // 12-digit number already prefixed with 91 (e.g., 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // Any other international number with country code already present
  return digits;
}

/**
 * Directly opens WhatsApp chat for a specific phone number with a pre-filled template message.
 * Falls back to WhatsApp web / universal wa.me link if deep link scheme encounters an issue,
 * or general WhatsApp share if phone number is not available.
 */
export async function openWhatsAppDirect(phone?: string | null, message: string = ''): Promise<boolean> {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedMsg = encodeURIComponent(message);

  if (cleanPhone) {
    const deepLinkUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
    const webFallbackUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    try {
      // First try direct WhatsApp native deep link
      await Linking.openURL(deepLinkUrl);
      return true;
    } catch (err) {
      // Fallback to wa.me universal link (opens WhatsApp app or web)
      try {
        await Linking.openURL(webFallbackUrl);
        return true;
      } catch (fallbackErr) {
        Alert.alert(
          'WhatsApp Not Found',
          'Could not open WhatsApp on this device. Please verify that WhatsApp is installed.'
        );
        return false;
      }
    }
  } else {
    // If no phone number is provided, open WhatsApp with contact selector
    const generalDeepLink = `whatsapp://send?text=${encodedMsg}`;
    const generalWebFallback = `https://api.whatsapp.com/send?text=${encodedMsg}`;

    try {
      await Linking.openURL(generalDeepLink);
      return true;
    } catch {
      try {
        await Linking.openURL(generalWebFallback);
        return true;
      } catch {
        Alert.alert(
          'WhatsApp Not Found',
          'Could not open WhatsApp on this device. Please verify that WhatsApp is installed.'
        );
        return false;
      }
    }
  }
}

/**
 * Format currency helper
 */
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Extracts first name
 */
const first = (name: string) => (name || '').trim().split(' ')[0] || name;

/**
 * 1. Booking Confirmation Template
 */
export function getBookingConfirmationMessage(params: {
  clientName: string;
  dateLong: string;
  time: string;
  meridiem: string;
  serviceNames: string;
  venue: string;
  total: number;
  advance: number;
  balance: number;
  notes?: string;
  artistName: string;
  studioName: string;
}): string {
  const {
    clientName,
    dateLong,
    time,
    meridiem,
    serviceNames,
    venue,
    total,
    advance,
    balance,
    notes,
    artistName,
    studioName,
  } = params;

  return `✨ *BOOKING CONFIRMED* ✨

Hi *${first(clientName)}*, your appointment with *${studioName}* is confirmed!

📅 *Date:* ${dateLong}
⏰ *Time:* ${time} ${meridiem}
💄 *Service:* ${serviceNames}
📍 *Venue:* ${venue || 'Studio / Client Residence'}

💰 *Total:* ${fmt(total)}
💵 *Advance Paid:* ${fmt(advance)}
⏳ *Balance Due:* ${fmt(balance)}${notes && notes.trim() ? `\n📝 *Notes:* ${notes.trim()}` : ''}

Looking forward to styling you!
Warm regards,
*${artistName}*
*${studioName}*`;
}

/**
 * 2. Booking Reminder Template
 */
export function getBookingReminderMessage(params: {
  clientName: string;
  dateLong: string;
  time: string;
  meridiem: string;
  serviceNames: string;
  venue: string;
  balance: number;
  artistName: string;
  studioName: string;
}): string {
  const {
    clientName,
    dateLong,
    time,
    meridiem,
    serviceNames,
    venue,
    balance,
    artistName,
    studioName,
  } = params;

  return `✨ *APPOINTMENT REMINDER* ✨

Hi *${first(clientName)}*, this is a gentle reminder for your upcoming appointment with *${studioName}*.

📅 *Date:* ${dateLong}
⏰ *Time:* ${time} ${meridiem}
💄 *Service:* ${serviceNames}
📍 *Venue:* ${venue || 'Studio / Client Residence'}
${balance > 0 ? `⏳ *Balance Due:* ${fmt(balance)}` : '✅ *Payment:* Fully Settled'}

Please arrive with a clean face and any reference looks or outfits you would like us to match.

Looking forward to styling you!
Warm regards,
*${artistName}*
*${studioName}*`;
}

/**
 * 3. Payment Due Reminder Template
 */
export function getPaymentReminderMessage(params: {
  clientName: string;
  dateLong?: string;
  serviceNames?: string;
  dueAmount: number;
  artistName: string;
  studioName: string;
}): string {
  const {
    clientName,
    dateLong,
    serviceNames,
    dueAmount,
    artistName,
    studioName,
  } = params;

  return `🔔 *PAYMENT REMINDER* 🔔

Hi *${first(clientName)}*, hope you are having a wonderful day!

A gentle reminder from *${studioName}* regarding your pending balance.

⏳ *Pending Balance:* ${fmt(dueAmount)}${dateLong ? `\n📅 *Booking Date:* ${dateLong}` : ''}${serviceNames ? `\n💄 *Service:* ${serviceNames}` : ''}

You can conveniently settle the amount via UPI or Cash. Thank you so much for your support!

Warm regards,
*${artistName}*
*${studioName}*`;
}

/**
 * 4. Client Direct Connect Template
 */
export function getClientDirectMessage(params: {
  clientName: string;
  artistName: string;
  studioName: string;
}): string {
  const { clientName, artistName, studioName } = params;

  return `Hi *${first(clientName)}*, hope you are doing well! ✨

This is *${artistName}* from *${studioName}*. Let me know if you have any upcoming events or dates — happy to reserve a priority slot for you!

Warm regards,
*${artistName}*
*${studioName}*`;
}

/**
 * 5. General Task/Custom Reminder Template
 */
export function getGeneralReminderMessage(params: {
  clientName?: string;
  reminderText: string;
  artistName: string;
  studioName: string;
}): string {
  const { clientName, reminderText, artistName, studioName } = params;

  return `🔔 *REMINDER · ${studioName.toUpperCase()}*

Hi *${clientName ? first(clientName) : 'there'}*,

${reminderText}

Warm regards,
*${artistName}*
*${studioName}*`;
}
