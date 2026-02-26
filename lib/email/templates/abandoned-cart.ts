export interface AbandonedCartItem {
  name: string;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
}

export interface AbandonedCartData {
  customerName: string;
  email: string;
  orderItems: AbandonedCartItem[];
  cartUrl: string;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function renderItem(item: AbandonedCartItem): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding: 18px 0; border-bottom: 1px solid #efede8;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          ${item.image_url ? `
            <td width="88" valign="top" style="padding-right: 20px;">
              <img src="${item.image_url}" alt="${item.name}" width="88" height="88" style="border-radius: 8px; object-fit: cover; display: block;" />
            </td>
          ` : ''}
          <td valign="top">
            <p style="margin: 0 0 6px; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #0a0e1a; font-weight: 500;">${item.name}</p>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #666;">Qty: ${item.quantity}</p>
          </td>
          <td width="120" valign="top" align="right">
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #0a0e1a; font-weight: 600;">${formatCurrency(item.unit_price * item.quantity)}</p>
          </td>
        </tr></table>
      </td></tr>
    </table>`;
}

export function abandonedCartTemplate(data: AbandonedCartData): string {
  const firstName = data.customerName.split(' ')[0] || 'there';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Abandoned Cart - MooreItems</title>
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
  Your cart is waiting for you — plus 10% off with code SAVE10.
</div>

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

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background: #ffffff;">
  <tr>
    <td align="center" class="body-cell" style="padding: 48px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td>
            <div style="text-align: center; padding-bottom: 32px;">
              <h2 style="margin: 0 0 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #0a0e1a;">Your cart is waiting for you</h2>
              <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #666;">
                Hey ${firstName}, you left a few great picks behind.
              </p>
            </div>

            <div style="background: #f7f6f3; border-radius: 14px; padding: 18px 24px; margin-bottom: 24px;">
              <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #0a0e1a;">
                Use code <strong style="color: #c8a45e;">SAVE10</strong> for 10% off — your cart is only a click away.
              </p>
            </div>

            <h3 style="margin: 0 0 16px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: bold;">Items in your cart</h3>
            ${data.orderItems.map(renderItem).join('')}

            <div style="text-align: center; padding: 36px 0 8px;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background: #c8a45e; border-radius: 8px;">
                  <a href="${data.cartUrl}" style="display: inline-block; color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; font-weight: bold; text-decoration: none; padding: 18px 48px;">Complete Your Order</a>
                </td></tr>
              </table>
              <p style="margin: 16px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888;">
                Offer valid for a limited time. Don’t miss out!
              </p>
            </div>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="footer-cell" style="padding: 32px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #8890a4;">
              Questions? Reply to this email or visit our <a href="https://mooreitems.com/contact" style="color: #c8a45e; text-decoration: none;">Help Center</a>
            </p>
            <p style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #5a6178;">
              If you’d like to unsubscribe from these emails, click here.
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

</body>
</html>`;
}
