export interface DailyBriefingData {
  briefingText: string;
  date: string;
  orderCount: number;
  activeProducts: number;
  marginAlerts: number;
  stuckOrders: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatBriefingHtml(text: string): string {
  const lines = text.split('\n');
  let html = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      html += '<br/>';
      continue;
    }

    // Section headers (ACTION REQUIRED, WATCHING, ALL CLEAR)
    if (/^(ACTION REQUIRED|WATCHING|ALL CLEAR)/i.test(trimmed)) {
      const isAction = /^ACTION REQUIRED/i.test(trimmed);
      const isWatching = /^WATCHING/i.test(trimmed);
      const color = isAction ? '#dc2626' : isWatching ? '#d97706' : '#16a34a';
      html += `<h3 style="margin:24px 0 8px;font-family:'DM Sans',Arial,sans-serif;font-size:16px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(trimmed)}</h3>`;
      continue;
    }

    // Bullet points
    if (/^[-•]/.test(trimmed)) {
      html += `<p style="margin:4px 0 4px 16px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#0a0e1a;line-height:1.6;">${escapeHtml(trimmed)}</p>`;
      continue;
    }

    // Regular text
    html += `<p style="margin:4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#0a0e1a;line-height:1.6;">${escapeHtml(trimmed)}</p>`;
  }

  return html;
}

export function dailyBriefingTemplate(data: DailyBriefingData): string {
  const { briefingText, date, orderCount, activeProducts, marginAlerts, stuckOrders } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily Briefing - MooreItems</title>
  <style>
    @media only screen and (max-width: 640px) {
      .inner-table { width: 100% !important; }
      .body-cell { padding: 32px 20px !important; }
      .header-cell { padding: 32px 20px !important; }
      .footer-cell { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'DM Sans',Arial,Helvetica,sans-serif;width:100%;-webkit-text-size-adjust:100%;">

<div style="display:none;font-size:1px;color:#f7f6f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Daily briefing: ${orderCount} orders, ${activeProducts} active products, ${marginAlerts} margin alerts.
</div>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding:44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:38px;color:#c8a45e;letter-spacing:2px;">MooreItems</h1>
            <p style="margin:12px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:16px;color:#8890a4;letter-spacing:0.5px;">Daily Briefing &mdash; ${date}</p>
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

            <!-- Briefing Content -->
            ${formatBriefingHtml(briefingText)}

            <!-- Raw Data Footer -->
            <div style="margin:36px 0 0;padding:20px;background:#f7f6f3;border-radius:8px;">
              <p style="margin:0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Raw Data Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="25%" align="center" style="padding:8px 4px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:24px;font-weight:700;color:#0a0e1a;">${orderCount}</p>
                    <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Orders (24h)</p>
                  </td>
                  <td width="25%" align="center" style="padding:8px 4px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:24px;font-weight:700;color:#16a34a;">${activeProducts}</p>
                    <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Active Products</p>
                  </td>
                  <td width="25%" align="center" style="padding:8px 4px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:24px;font-weight:700;color:${marginAlerts > 0 ? '#d97706' : '#0a0e1a'};">${marginAlerts}</p>
                    <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Margin Alerts</p>
                  </td>
                  <td width="25%" align="center" style="padding:8px 4px;">
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:24px;font-weight:700;color:${stuckOrders > 0 ? '#dc2626' : '#0a0e1a'};">${stuckOrders}</p>
                    <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Stuck Orders</p>
                  </td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;padding:36px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background:#c8a45e;border-radius:8px;">
                  <a href="https://mooreitems.com/admin" style="display:inline-block;color:#ffffff;font-family:'DM Sans',Arial,sans-serif;font-size:19px;font-weight:bold;text-decoration:none;padding:20px 56px;">Open Dashboard</a>
                </td></tr>
              </table>
            </div>

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
            <p style="margin:0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#5a6178;">
              This is an automated daily briefing from MooreItems.
            </p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#3d4459;">
              &copy; ${new Date().getFullYear()} MooreItems.com &middot; Powered by <a href="https://ai-genda.com" style="color:#c8a45e;text-decoration:none;">Ai-genda.com</a>
            </p>
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
