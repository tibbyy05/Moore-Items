import type { HealthCheckAlertData } from '../sendgrid';

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: '#fef2f2', text: '#dc2626' },
  MEDIUM: { bg: '#fffbeb', text: '#d97706' },
  LOW: { bg: '#f0fdf4', text: '#16a34a' },
};

function severityBadge(severity: string): string {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.LOW;
  return `<span style="display:inline-block;padding:2px 10px;border-radius:4px;background:${c.bg};color:${c.text};font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;">${severity}</span>`;
}

function scoreColor(score: number): string {
  if (score >= 90) return '#16a34a';
  if (score >= 70) return '#d97706';
  return '#dc2626';
}

export function healthCheckTemplate(data: HealthCheckAlertData): string {
  const { healthScore, totalIssues, totalAutoFixed, needsAttention, checks, timestamp } = data;
  const date = new Date(timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const autoFixedChecks = checks.filter((c) => c.autoFixed > 0);
  const flaggedChecks = checks.filter((c) => c.found - c.autoFixed > 0);

  let autoFixedHtml = '';
  if (autoFixedChecks.length > 0) {
    const rows = autoFixedChecks
      .map(
        (c) => `
      <tr>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#0a0e1a;border-bottom:1px solid #efede8;">${c.name}</td>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#16a34a;border-bottom:1px solid #efede8;text-align:right;font-weight:600;">${c.autoFixed} fixed</td>
      </tr>`
      )
      .join('');

    autoFixedHtml = `
      <h3 style="margin:32px 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:18px;color:#0a0e1a;font-weight:700;">Auto-Fixed</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;border:1px solid #efede8;">
        ${rows}
      </table>`;
  }

  let flaggedHtml = '';
  if (flaggedChecks.length > 0) {
    const sections = flaggedChecks
      .map((c) => {
        const remaining = c.found - c.autoFixed;
        const productLines = c.items
          .slice(0, 10)
          .map(
            (item) =>
              `<li style="padding:4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#555;">${item.name}</li>`
          )
          .join('');
        const moreText = c.items.length > 10 ? `<p style="margin:4px 0 0 18px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">...and ${c.items.length - 10} more</p>` : '';

        return `
        <tr><td style="padding:16px 0;border-bottom:1px solid #efede8;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-family:'DM Sans',Arial,sans-serif;font-size:16px;color:#0a0e1a;font-weight:600;">${c.name}</td>
            <td width="120" align="right">${severityBadge(c.severity)}</td>
          </tr></table>
          <p style="margin:8px 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#888;">${remaining} product${remaining !== 1 ? 's' : ''} affected</p>
          <ul style="margin:4px 0 0;padding-left:18px;list-style:disc;">${productLines}</ul>
          ${moreText}
        </td></tr>`;
      })
      .join('');

    flaggedHtml = `
      <h3 style="margin:32px 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:18px;color:#0a0e1a;font-weight:700;">Needs Attention</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${sections}
      </table>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Catalog Health Check - MooreItems</title>
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
  Health score: ${healthScore}% — ${needsAttention} issue${needsAttention !== 1 ? 's' : ''} need attention.
</div>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding:44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:38px;color:#c8a45e;letter-spacing:2px;">MooreItems</h1>
            <p style="margin:12px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:16px;color:#8890a4;letter-spacing:0.5px;">Catalog Health Report</p>
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

            <!-- Score -->
            <div style="text-align:center;padding-bottom:32px;">
              <p style="margin:0 0 8px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;">Health Score</p>
              <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:64px;font-weight:800;color:${scoreColor(healthScore)};">${healthScore}%</p>
              <p style="margin:8px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#888;">${date}</p>
            </div>

            <!-- Summary stats -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="33%" align="center" bgcolor="#f7f6f3" style="background:#f7f6f3;border-radius:8px;padding:20px 8px;">
                  <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#0a0e1a;">${totalIssues}</p>
                  <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">Total Issues</p>
                </td>
                <td width="4%"></td>
                <td width="29%" align="center" bgcolor="#f0fdf4" style="background:#f0fdf4;border-radius:8px;padding:20px 8px;">
                  <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#16a34a;">${totalAutoFixed}</p>
                  <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">Auto-Fixed</p>
                </td>
                <td width="4%"></td>
                <td width="30%" align="center" bgcolor="#fef2f2" style="background:#fef2f2;border-radius:8px;padding:20px 8px;">
                  <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#dc2626;">${needsAttention}</p>
                  <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">Needs Attention</p>
                </td>
              </tr>
            </table>

            ${autoFixedHtml}
            ${flaggedHtml}

            <!-- CTA -->
            <div style="text-align:center;padding:36px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background:#c8a45e;border-radius:8px;">
                  <a href="https://mooreitems.com/admin/catalog-health" style="display:inline-block;color:#ffffff;font-family:'DM Sans',Arial,sans-serif;font-size:19px;font-weight:bold;text-decoration:none;padding:20px 56px;">View Full Report</a>
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
              This is an automated catalog health report from MooreItems.
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
