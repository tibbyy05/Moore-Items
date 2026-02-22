import type { ShippingUpdateData, OrderItem } from '../sendgrid';

function renderShippedItem(item: OrderItem): string {
  return `
    <tr><td style="padding: 20px 0; border-bottom: 1px solid #efede8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${item.image_url ? `
          <td width="80" valign="top" style="padding-right: 20px;">
            <img src="${item.image_url}" alt="${item.name}" width="80" height="80" style="border-radius: 6px; object-fit: cover; display: block;" />
          </td>
        ` : ''}
        <td valign="top">
          <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #0a0e1a; font-weight: 500;">${item.name}</p>
          ${item.variant_info ? `<p style="margin: 6px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 15px; color: #888;">${item.variant_info}</p>` : ''}
        </td>
        <td width="60" valign="top" align="right">
          <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #888;">×${item.quantity}</p>
        </td>
      </tr></table>
    </td></tr>`;
}

export function shippingUpdateTemplate(data: ShippingUpdateData): string {
  const {
    customerName,
    orderNumber,
    trackingNumber,
    trackingUrl,
    carrier,
    items,
    shippingAddress,
  } = data;

  const firstName = customerName.split(' ')[0] || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Order Has Shipped - MooreItems</title>
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
  Your order has shipped! Track your package with the link below.
</div>

<!-- HEADER -->
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

<!-- BODY -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background: #ffffff;">
  <tr>
    <td align="center" class="body-cell" style="padding: 48px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td>

            <div style="text-align: center; padding-bottom: 36px;">
              <div style="width: 80px; height: 80px; background: #eff6ff; border-radius: 50%; line-height: 80px; text-align: center; font-size: 40px; margin: 0 auto;">📦</div>
              <h2 style="margin: 24px 0 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #0a0e1a;">Your Order Has Shipped!</h2>
              <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #666;">
                Great news, ${firstName}! Your order is on its way.
              </p>
            </div>

            <!-- Tracking Box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td bgcolor="#f7f6f3" style="background: #f7f6f3; border-radius: 12px; padding: 28px 32px;">
                <p style="margin: 0 0 4px; font-family: 'DM Sans', Arial, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Order</p>
                <p style="margin: 0 0 24px; font-family: 'DM Sans', Arial, sans-serif; font-size: 24px; color: #0a0e1a; font-weight: bold;">#${orderNumber}</p>
                <p style="margin: 0 0 4px; font-family: 'DM Sans', Arial, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Carrier</p>
                <p style="margin: 0 0 24px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: 500;">${carrier}</p>
                <p style="margin: 0 0 4px; font-family: 'DM Sans', Arial, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</p>
                <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: 500;">${trackingNumber}</p>
              </td></tr>
            </table>

            <!-- Track Button -->
            <div style="text-align: center; padding: 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background: #c8a45e; border-radius: 8px;">
                  <a href="${trackingUrl}" style="display: inline-block; color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; font-size: 19px; font-weight: bold; text-decoration: none; padding: 20px 56px;">Track Your Package</a>
                </td></tr>
              </table>
            </div>

            <!-- Items -->
            <h3 style="margin: 0 0 16px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: bold;">Items in This Shipment</h3>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${items.map(renderShippedItem).join('')}
            </table>

            <!-- Address -->
            <h3 style="margin: 32px 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: bold;">Delivering To</h3>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #666; line-height: 1.8;">
              ${customerName}<br />
              ${shippingAddress.line1}<br />
              ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}
            </p>

            <!-- Tip -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 36px;">
              <tr><td bgcolor="#fffbeb" style="background: #fffbeb; border-radius: 12px; padding: 24px 28px;">
                <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #92400e; line-height: 1.6;">
                  <strong>💡 Tracking tip:</strong> It may take 24-48 hours for tracking information to update after your package ships. If tracking isn't showing yet, check back tomorrow!
                </p>
              </td></tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- FOOTER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="footer-cell" style="padding: 36px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #8890a4;">
              Questions about your delivery? <a href="https://mooreitems.com/contact" style="color: #c8a45e; text-decoration: none;">Contact us</a>
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