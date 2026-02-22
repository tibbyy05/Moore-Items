import type { OrderConfirmationData, OrderItem } from '../sendgrid';

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function renderOrderItem(item: OrderItem): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding: 24px 0; border-bottom: 1px solid #efede8;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          ${item.image_url ? `
            <td width="100" valign="top" style="padding-right: 24px;">
              <img src="${item.image_url}" alt="${item.name}" width="100" height="100" style="border-radius: 8px; object-fit: cover; display: block;" />
            </td>
          ` : ''}
          <td valign="top">
            <p style="margin: 0 0 6px; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #0a0e1a; font-weight: 500;">${item.name}</p>
            ${item.variant_info ? `<p style="margin: 0 0 4px; font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; color: #666;">${item.variant_info}</p>` : ''}
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; color: #888;">Qty: ${item.quantity}</p>
          </td>
          <td width="140" valign="top" align="right">
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #0a0e1a; font-weight: 500;">${formatCurrency(item.price * item.quantity)}</p>
          </td>
        </tr></table>
      </td></tr>
    </table>`;
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const {
    customerName,
    orderNumber,
    items,
    subtotal,
    shippingCost,
    discount,
    discountCode,
    total,
    shippingAddress,
    estimatedDelivery,
  } = data;

  const firstName = customerName.split(' ')[0] || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation - MooreItems</title>
  <style>
    @media only screen and (max-width: 640px) {
      .inner-table { width: 100% !important; }
      .body-cell { padding: 32px 20px !important; }
      .header-cell { padding: 32px 20px !important; }
      .footer-cell { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background: #f7f6f3; font-family: 'DM Sans', Arial, Helvetica, sans-serif; width: 100%; -webkit-text-size-adjust: 100%;">

<div style="display: none; font-size: 1px; color: #f7f6f3; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
  Your order has been confirmed! Here are your order details and estimated delivery.
</div>

<!-- HEADER - Full width navy -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding: 44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 38px; color: #c8a45e; letter-spacing: 2px;">MooreItems</h1>
            <p style="margin: 12px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #8890a4; letter-spacing: 0.5px;">More Items, Moore Value</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- BODY - Full width white -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background: #ffffff;">
  <tr>
    <td align="center" class="body-cell" style="padding: 48px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td>

            <!-- Confirmation Badge -->
            <div style="text-align: center; padding-bottom: 40px;">
              <div style="width: 80px; height: 80px; background: #f0fdf4; border-radius: 50%; line-height: 80px; text-align: center; font-size: 40px; margin: 0 auto;">✓</div>
              <h2 style="margin: 24px 0 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #0a0e1a;">Order Confirmed!</h2>
              <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #666;">
                Hey ${firstName}, thanks for your order! We're getting it ready.
              </p>
            </div>

            <!-- Order Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td bgcolor="#f7f6f3" style="background: #f7f6f3; border-radius: 12px; padding: 24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td>
                    <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</p>
                    <p style="margin: 8px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 26px; color: #0a0e1a; font-weight: bold;">#${orderNumber}</p>
                  </td>
                  ${estimatedDelivery ? `
                  <td align="right">
                    <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Delivery</p>
                    <p style="margin: 8px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 19px; color: #0a0e1a;">${estimatedDelivery}</p>
                  </td>
                  ` : ''}
                </tr></table>
              </td></tr>
            </table>

            <div style="height: 24px;"></div>

            <!-- Items -->
            <h3 style="margin: 0 0 20px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: bold;">Items Ordered</h3>
            ${items.map(renderOrderItem).join('')}

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding: 28px 0; border-top: 2px solid #efede8;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #666;">Subtotal</td>
                    <td align="right" style="padding: 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #0a0e1a;">${formatCurrency(subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #666;">Shipping</td>
                    <td align="right" style="padding: 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #0a0e1a;">${shippingCost === 0 ? '<span style="color: #16a34a; font-weight: 500;">FREE</span>' : formatCurrency(shippingCost)}</td>
                  </tr>
                  ${discount && discount > 0 ? `
                  <tr>
                    <td style="padding: 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #16a34a;">Discount${discountCode ? ` (${discountCode})` : ''}</td>
                    <td align="right" style="padding: 8px 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #16a34a;">-${formatCurrency(discount)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 20px 0 0; border-top: 1px solid #efede8; font-family: 'DM Sans', Arial, sans-serif; font-size: 26px; color: #0a0e1a; font-weight: bold;">Total</td>
                    <td align="right" style="padding: 20px 0 0; border-top: 1px solid #efede8; font-family: 'DM Sans', Arial, sans-serif; font-size: 26px; color: #0a0e1a; font-weight: bold;">${formatCurrency(total)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Shipping Address -->
            <h3 style="margin: 32px 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: bold;">Shipping To</h3>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #666; line-height: 1.8;">
              ${customerName}<br />
              ${shippingAddress.line1}<br />
              ${shippingAddress.line2 ? `${shippingAddress.line2}<br />` : ''}
              ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}<br />
              ${shippingAddress.country}
            </p>

            <!-- CTA -->
            <div style="text-align: center; padding: 48px 0 8px;">
              <p style="margin: 0 0 24px; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #888;">
                We'll send you another email when your order ships with tracking info.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background: #c8a45e; border-radius: 8px;">
                  <a href="https://mooreitems.com" style="display: inline-block; color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; font-weight: bold; text-decoration: none; padding: 18px 48px;">Continue Shopping</a>
                </td></tr>
              </table>
            </div>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- FOOTER - Full width navy -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="footer-cell" style="padding: 36px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #8890a4;">
              Questions? Reply to this email or visit our <a href="https://mooreitems.com/contact" style="color: #c8a45e; text-decoration: none;">Help Center</a>
            </p>
            <p style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #5a6178;">
              <a href="https://mooreitems.com/shipping-policy" style="color: #5a6178; text-decoration: none;">Shipping</a> &nbsp;·&nbsp;
              <a href="https://mooreitems.com/returns" style="color: #5a6178; text-decoration: none;">Returns</a> &nbsp;·&nbsp;
              <a href="https://mooreitems.com/privacy-policy" style="color: #5a6178; text-decoration: none;">Privacy</a> &nbsp;·&nbsp;
              <a href="https://mooreitems.com/terms" style="color: #5a6178; text-decoration: none;">Terms</a>
            </p>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #3d4459;">
              © ${new Date().getFullYear()} MooreItems.com · Powered by <a href="https://ai-genda.com" style="color: #c8a45e; text-decoration: none;">Ai-genda.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f6f3" style="background: #f7f6f3;">
  <tr><td style="height: 40px; font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
</table>

</body>
</html>`;
}