export interface AdminOrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number; variant_info?: string }[];
  total: number;
  timestamp: string; // ISO string or formatted date
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function renderItemRow(item: { name: string; quantity: number; price: number; variant_info?: string }): string {
  return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #efede8; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #0a0e1a;">
        ${item.name}${item.variant_info ? `<br /><span style="font-size: 13px; color: #888;">${item.variant_info}</span>` : ''}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #efede8; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #666; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #efede8; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #0a0e1a; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>`;
}

export function newOrderAdminTemplate(data: AdminOrderNotificationData): string {
  const { orderNumber, customerName, customerEmail, items, total, timestamp } = data;

  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Order - MooreItems Admin</title>
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
  New order #${orderNumber} from ${customerName} — ${formatCurrency(total)}
</div>

<!-- HEADER - Full width navy -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding: 44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 38px; color: #c8a45e; letter-spacing: 2px;">MooreItems</h1>
            <p style="margin: 12px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #8890a4; letter-spacing: 0.5px;">Admin Notification</p>
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

            <!-- New Order Badge -->
            <div style="text-align: center; padding-bottom: 40px;">
              <div style="width: 80px; height: 80px; background: #fffbeb; border-radius: 50%; line-height: 80px; text-align: center; font-size: 40px; margin: 0 auto;">&#128176;</div>
              <h2 style="margin: 24px 0 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #0a0e1a;">New Order Received!</h2>
              <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #666;">
                ${formattedTime}
              </p>
            </div>

            <!-- Order + Customer Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td bgcolor="#f7f6f3" style="background: #f7f6f3; border-radius: 12px; padding: 24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</p>
                      <p style="margin: 8px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 26px; color: #0a0e1a; font-weight: bold;">#${orderNumber}</p>
                    </td>
                    <td align="right">
                      <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Total</p>
                      <p style="margin: 8px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 26px; color: #16a34a; font-weight: bold;">${formatCurrency(total)}</p>
                    </td>
                  </tr>
                </table>
                <div style="height: 20px;"></div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Customer</p>
                      <p style="margin: 8px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #0a0e1a; font-weight: 500;">${customerName}</p>
                    </td>
                    <td align="right">
                      <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                      <p style="margin: 8px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #0a0e1a;">
                        <a href="mailto:${customerEmail}" style="color: #c8a45e; text-decoration: none;">${customerEmail}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <div style="height: 32px;"></div>

            <!-- Items Table -->
            <h3 style="margin: 0 0 16px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: bold;">Items Ordered</h3>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 8px 0; border-bottom: 2px solid #0f1629; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Item</td>
                <td style="padding: 8px 0; border-bottom: 2px solid #0f1629; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Qty</td>
                <td style="padding: 8px 0; border-bottom: 2px solid #0f1629; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Price</td>
              </tr>
              ${items.map(renderItemRow).join('')}
            </table>

            <!-- Total Row -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 20px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 22px; color: #0a0e1a; font-weight: bold;">Order Total</td>
                <td align="right" style="padding: 20px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 22px; color: #0a0e1a; font-weight: bold;">${formatCurrency(total)}</td>
              </tr>
            </table>

            <div style="height: 40px;"></div>

            <!-- CTA Buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0" align="center">
                    <tr><td bgcolor="#c8a45e" style="background: #c8a45e; border-radius: 8px;">
                      <a href="https://cjdropshipping.com/my.html#/order" style="display: inline-block; color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; font-weight: bold; text-decoration: none; padding: 18px 48px;">Fund This Order in CJ</a>
                    </td></tr>
                  </table>
                  <div style="height: 16px;"></div>
                  <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 15px;">
                    <a href="https://www.mooreitems.com/admin/orders" style="color: #c8a45e; text-decoration: none; font-weight: 500;">View All Orders in Admin &rarr;</a>
                  </p>
                </td>
              </tr>
            </table>

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
            <p style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #5a6178;">
              This is an automated admin notification from MooreItems.com
            </p>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #3d4459;">
              &copy; ${new Date().getFullYear()} MooreItems.com &middot; Powered by <a href="https://ai-genda.com" style="color: #c8a45e; text-decoration: none;">Ai-genda.com</a>
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
