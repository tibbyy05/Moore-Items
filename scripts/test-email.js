// ============================================================
// Test SendGrid V5 - Full-bleed backgrounds (edge-to-edge)
// Usage: node scripts/test-email.js [all|confirmation|shipping]
// ============================================================

require('dotenv').config({ path: '.env.local' });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'mooreitemsshop@gmail.com';
const TEST_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'mooreitemsshop@gmail.com';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in .env.local');
  process.exit(1);
}

async function sendTestEmail(subject, html) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: TEST_EMAIL }] }],
      from: { email: FROM_EMAIL, name: 'MooreItems' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  return response;
}

// ---- Order Confirmation (Full-bleed layout) ----
function sampleOrderConfirmation() {
  const items = [
    { name: 'Wireless Bluetooth Earbuds Pro', quantity: 1, price: 29.99, variant: 'Color: Black' },
    { name: 'Silicone Kitchen Utensil Set', quantity: 2, price: 19.99, variant: 'Color: Gray' },
    { name: 'Stainless Steel Water Bottle', quantity: 1, price: 24.99, variant: 'Size: 32oz' },
  ];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = 7.50;
  const total = subtotal - discount;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    @media only screen and (max-width: 640px) {
      .inner-table { width: 100% !important; }
      .body-cell { padding: 32px 20px !important; }
      .header-cell { padding: 32px 20px !important; }
      .footer-cell { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:Arial,Helvetica,sans-serif;width:100%;-webkit-text-size-adjust:100%;">

<!-- Preheader -->
<div style="display:none;font-size:1px;color:#f7f6f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Your order has been confirmed! Here are your order details and estimated delivery.
</div>

<!-- ============================================ -->
<!-- HEADER - Full width navy background          -->
<!-- ============================================ -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding:44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:38px;color:#c8a45e;letter-spacing:2px;">MooreItems</h1>
            <p style="margin:12px 0 0;font-size:16px;color:#8890a4;letter-spacing:.5px;">More Items, Moore Value</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ============================================ -->
<!-- BODY - Full width white background           -->
<!-- ============================================ -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;">
  <tr>
    <td align="center" class="body-cell" style="padding:48px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td>

            <!-- Confirmation Badge -->
            <div style="text-align:center;padding-bottom:40px;">
              <div style="width:80px;height:80px;background:#f0fdf4;border-radius:50%;line-height:80px;text-align:center;font-size:40px;margin:0 auto;">✓</div>
              <h2 style="margin:24px 0 12px;font-family:Georgia,serif;font-size:32px;color:#0a0e1a;">Order Confirmed!</h2>
              <p style="margin:0;font-size:18px;color:#666;">Hey Danny, thanks for your order! We're getting it ready.</p>
            </div>

            <!-- Order Info Box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td bgcolor="#f7f6f3" style="background:#f7f6f3;border-radius:12px;padding:24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td><p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Order Number</p><p style="margin:8px 0 0;font-size:26px;color:#0a0e1a;font-weight:bold;">#MI-TEST-001</p></td>
                  <td align="right"><p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Estimated Delivery</p><p style="margin:8px 0 0;font-size:19px;color:#0a0e1a;">3-7 business days</p></td>
                </tr></table>
              </td></tr>
            </table>

            <div style="height:24px;"></div>

            <!-- Items -->
            <h3 style="margin:0 0 20px;font-size:20px;color:#0a0e1a;font-weight:bold;">Items Ordered</h3>
            ${items.map(i => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:24px 0;border-bottom:1px solid #efede8;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:18px;color:#0a0e1a;font-weight:500;">${i.name}</p>
                    <p style="margin:0 0 4px;font-size:15px;color:#888;">${i.variant}</p>
                    <p style="margin:0;font-size:15px;color:#888;">Qty: ${i.quantity}</p>
                  </td>
                  <td width="140" align="right" valign="top" style="font-size:18px;color:#0a0e1a;font-weight:500;">$${(i.price * i.quantity).toFixed(2)}</td>
                </tr></table>
              </td></tr>
            </table>`).join('')}

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:28px 0;border-top:2px solid #efede8;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="padding:8px 0;font-size:17px;color:#666;">Subtotal</td><td align="right" style="padding:8px 0;font-size:17px;color:#0a0e1a;">$${subtotal.toFixed(2)}</td></tr>
                  <tr><td style="padding:8px 0;font-size:17px;color:#666;">Shipping</td><td align="right" style="padding:8px 0;font-size:17px;color:#16a34a;font-weight:500;">FREE</td></tr>
                  <tr><td style="padding:8px 0;font-size:17px;color:#16a34a;">Discount (WELCOME15)</td><td align="right" style="padding:8px 0;font-size:17px;color:#16a34a;">-$${discount.toFixed(2)}</td></tr>
                  <tr><td style="padding:20px 0 0;border-top:1px solid #efede8;font-size:26px;font-weight:bold;color:#0a0e1a;">Total</td><td align="right" style="padding:20px 0 0;border-top:1px solid #efede8;font-size:26px;font-weight:bold;color:#0a0e1a;">$${total.toFixed(2)}</td></tr>
                </table>
              </td></tr>
            </table>

            <!-- Shipping Address -->
            <h3 style="margin:32px 0 12px;font-size:20px;color:#0a0e1a;font-weight:bold;">Shipping To</h3>
            <p style="margin:0;font-size:17px;color:#666;line-height:1.8;">Danny Moore<br/>123 Main Street<br/>Fort Lauderdale, FL 33301<br/>US</p>

            <!-- CTA -->
            <div style="text-align:center;padding:48px 0 8px;">
              <p style="margin:0 0 24px;font-size:17px;color:#888;">We'll send you another email when your order ships with tracking info.</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background:#c8a45e;border-radius:8px;">
                  <a href="https://mooreitems.com" style="display:inline-block;color:#ffffff;font-size:18px;font-weight:bold;text-decoration:none;padding:18px 48px;">Continue Shopping</a>
                </td></tr>
              </table>
            </div>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ============================================ -->
<!-- FOOTER - Full width navy background          -->
<!-- ============================================ -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="footer-cell" style="padding:36px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <p style="margin:0 0 12px;font-size:16px;color:#8890a4;">Questions? Reply to this email or visit our <a href="https://mooreitems.com/contact" style="color:#c8a45e;text-decoration:none;">Help Center</a></p>
            <p style="margin:0 0 12px;font-size:14px;color:#5a6178;"><a href="https://mooreitems.com/shipping-policy" style="color:#5a6178;text-decoration:none;">Shipping</a> &nbsp;·&nbsp; <a href="https://mooreitems.com/returns" style="color:#5a6178;text-decoration:none;">Returns</a> &nbsp;·&nbsp; <a href="https://mooreitems.com/privacy-policy" style="color:#5a6178;text-decoration:none;">Privacy</a></p>
            <p style="margin:0;font-size:13px;color:#3d4459;">© 2026 MooreItems.com · Powered by <a href="https://ai-genda.com" style="color:#c8a45e;text-decoration:none;">Ai-genda.com</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Bottom background -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f6f3" style="background:#f7f6f3;">
  <tr><td style="height:40px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
</table>

</body>
</html>`;
}

// ---- Shipping Update (Full-bleed layout) ----
function sampleShippingUpdate() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    @media only screen and (max-width: 640px) {
      .inner-table { width: 100% !important; }
      .body-cell { padding: 32px 20px !important; }
      .header-cell { padding: 32px 20px !important; }
      .footer-cell { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:Arial,Helvetica,sans-serif;width:100%;-webkit-text-size-adjust:100%;">

<div style="display:none;font-size:1px;color:#f7f6f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Your order has shipped! Track your package with the link below.
</div>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding:44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:38px;color:#c8a45e;letter-spacing:2px;">MooreItems</h1>
            <p style="margin:12px 0 0;font-size:16px;color:#8890a4;letter-spacing:.5px;">More Items, Moore Value</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- BODY -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;">
  <tr>
    <td align="center" class="body-cell" style="padding:48px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td>

            <div style="text-align:center;padding-bottom:36px;">
              <div style="width:80px;height:80px;background:#eff6ff;border-radius:50%;line-height:80px;text-align:center;font-size:40px;margin:0 auto;">📦</div>
              <h2 style="margin:24px 0 12px;font-family:Georgia,serif;font-size:32px;color:#0a0e1a;">Your Order Has Shipped!</h2>
              <p style="margin:0;font-size:18px;color:#666;">Great news, Danny! Your order is on its way.</p>
            </div>

            <!-- Tracking Box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td bgcolor="#f7f6f3" style="background:#f7f6f3;border-radius:12px;padding:28px 32px;">
                <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Order</p>
                <p style="margin:0 0 24px;font-size:24px;color:#0a0e1a;font-weight:bold;">#MI-TEST-001</p>
                <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Carrier</p>
                <p style="margin:0 0 24px;font-size:20px;color:#0a0e1a;font-weight:500;">USPS</p>
                <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Tracking Number</p>
                <p style="margin:0;font-size:20px;color:#0a0e1a;font-weight:500;">9400111899223100012345</p>
              </td></tr>
            </table>

            <!-- Track Button -->
            <div style="text-align:center;padding:32px 0;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background:#c8a45e;border-radius:8px;">
                  <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223100012345" style="display:inline-block;color:#ffffff;font-size:19px;font-weight:bold;text-decoration:none;padding:20px 56px;">Track Your Package</a>
                </td></tr>
              </table>
            </div>

            <!-- Items -->
            <h3 style="margin:0 0 16px;font-size:20px;color:#0a0e1a;font-weight:bold;">Items in This Shipment</h3>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:20px 0;border-bottom:1px solid #efede8;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td><p style="margin:0;font-size:17px;color:#0a0e1a;font-weight:500;">Wireless Bluetooth Earbuds Pro</p><p style="margin:6px 0 0;font-size:15px;color:#888;">Color: Black</p></td>
                  <td width="60" align="right" style="font-size:16px;color:#888;">×1</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:20px 0;border-bottom:1px solid #efede8;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td><p style="margin:0;font-size:17px;color:#0a0e1a;font-weight:500;">Silicone Kitchen Utensil Set</p><p style="margin:6px 0 0;font-size:15px;color:#888;">Color: Gray</p></td>
                  <td width="60" align="right" style="font-size:16px;color:#888;">×2</td>
                </tr></table>
              </td></tr>
            </table>

            <!-- Address -->
            <h3 style="margin:32px 0 12px;font-size:20px;color:#0a0e1a;font-weight:bold;">Delivering To</h3>
            <p style="margin:0;font-size:17px;color:#666;line-height:1.8;">Danny Moore<br/>123 Main Street<br/>Fort Lauderdale, FL 33301</p>

            <!-- Tip -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;">
              <tr><td bgcolor="#fffbeb" style="background:#fffbeb;border-radius:12px;padding:24px 28px;">
                <p style="margin:0;font-size:16px;color:#92400e;line-height:1.6;"><strong>💡 Tracking tip:</strong> It may take 24-48 hours for tracking information to update after your package ships. If tracking isn't showing yet, check back tomorrow!</p>
              </td></tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- FOOTER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="footer-cell" style="padding:36px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <p style="margin:0 0 12px;font-size:16px;color:#8890a4;">Questions about your delivery? <a href="https://mooreitems.com/contact" style="color:#c8a45e;text-decoration:none;">Contact us</a></p>
            <p style="margin:0 0 12px;font-size:14px;color:#5a6178;"><a href="https://mooreitems.com/shipping-policy" style="color:#5a6178;text-decoration:none;">Shipping</a> &nbsp;·&nbsp; <a href="https://mooreitems.com/returns" style="color:#5a6178;text-decoration:none;">Returns</a> &nbsp;·&nbsp; <a href="https://mooreitems.com/privacy-policy" style="color:#5a6178;text-decoration:none;">Privacy</a></p>
            <p style="margin:0;font-size:13px;color:#3d4459;">© 2026 MooreItems.com · Powered by <a href="https://ai-genda.com" style="color:#c8a45e;text-decoration:none;">Ai-genda.com</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f6f3" style="background:#f7f6f3;">
  <tr><td style="height:40px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
</table>

</body>
</html>`;
}

// ============================================================
async function main() {
  const testType = process.argv[2] || 'all';
  console.log('🔧 MooreItems SendGrid V5 (full-bleed layout)\n');
  console.log(`   From: ${FROM_EMAIL} → To: ${TEST_EMAIL}\n`);

  if (testType === 'confirmation' || testType === 'all') {
    console.log('📧 Order confirmation...');
    const r = await sendTestEmail('Order Confirmed! 🎉 #MI-TEST-001', sampleOrderConfirmation());
    console.log(`   ${r.status === 202 ? '✅' : '❌'} (${r.status})`);
    if (r.status !== 202) console.log('   Error:', await r.text());
  }
  if (testType === 'shipping' || testType === 'all') {
    console.log('📧 Shipping update...');
    const r = await sendTestEmail('Your Order #MI-TEST-001 Has Shipped! 📦', sampleShippingUpdate());
    console.log(`   ${r.status === 202 ? '✅' : '❌'} (${r.status})`);
    if (r.status !== 202) console.log('   Error:', await r.text());
  }
  console.log('\n✅ Check inbox at', TEST_EMAIL);
}
main().catch(console.error);