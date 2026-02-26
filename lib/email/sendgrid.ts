import { orderConfirmationTemplate } from './templates/order-confirmation';
import { abandonedCartTemplate, type AbandonedCartData } from './templates/abandoned-cart';
import { shippingUpdateTemplate } from './templates/shipping-update';

// ============================================================
// SendGrid Email Client for MooreItems.com
// ============================================================
// Add to .env.local:
//   SENDGRID_API_KEY=SG.xxxxx
//   SENDGRID_FROM_EMAIL=orders@mooreitems.com  (or mooreitemsshop@gmail.com until domain verified)
//   SENDGRID_FROM_NAME=MooreItems
// ============================================================

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('[SendGrid] Missing SENDGRID_API_KEY');
    return { success: false, error: 'SendGrid API key not configured' };
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'mooreitemsshop@gmail.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'MooreItems';

  try {
    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    // SendGrid returns 202 on success (accepted for delivery)
    if (response.status === 202) {
      console.log(`[SendGrid] Email sent to ${to}: ${subject}`);
      return { success: true };
    }

    const errorBody = await response.text();
    console.error(`[SendGrid] Failed (${response.status}):`, errorBody);
    return { success: false, error: `SendGrid error ${response.status}: ${errorBody}` };
  } catch (error) {
    console.error('[SendGrid] Network error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// Order Confirmation Email
// ============================================================

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;         // unit price in dollars
  image_url?: string;
  variant_info?: string; // e.g. "Size: L / Color: Blue"
  is_digital?: boolean;
}

export interface OrderConfirmationData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  discountCode?: string;
  total: number;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  estimatedDelivery?: string; // e.g. "2-5 business days"
  downloadLinks?: Array<{ itemName: string; downloadUrl: string }>;
  isAllDigital?: boolean;
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const html = orderConfirmationTemplate(data);
  return sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmed! 🎉 #${data.orderNumber}`,
    html,
  });
}

// ============================================================
// Abandoned Cart Email
// ============================================================

export async function sendAbandonedCartEmail(to: string, subject: string, html: string) {
  return sendEmail({ to, subject, html });
}

export async function sendAbandonedCart(data: AbandonedCartData) {
  const html = abandonedCartTemplate(data);
  return sendAbandonedCartEmail(data.email, 'You left something behind! 🛒', html);
}

// ============================================================
// Shipping Update Email
// ============================================================

export interface ShippingUpdateData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;           // e.g. "USPS"
  items: OrderItem[];
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

export async function sendShippingUpdate(data: ShippingUpdateData) {
  const html = shippingUpdateTemplate(data);
  return sendEmail({
    to: data.customerEmail,
    subject: `Your Order #${data.orderNumber} Has Shipped! 📦`,
    html,
  });
}