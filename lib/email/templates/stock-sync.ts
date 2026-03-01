import type { StockSyncAlertData } from '../sendgrid';

function scoreColor(hidden: number, reactivated: number): string {
  if (hidden > 0 && reactivated === 0) return '#dc2626';
  if (hidden > 0) return '#d97706';
  return '#16a34a';
}

export function stockSyncTemplate(data: StockSyncAlertData): string {
  const { totalChecked, hidden, reactivated, stockUpdated, errors, duration, timestamp, changes } = data;
  const date = new Date(timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const totalChanges = hidden + reactivated + stockUpdated;
  const accentColor = scoreColor(hidden, reactivated);

  let changesHtml = '';

  // Hidden products section
  const hiddenItems = changes.filter((c) => c.action === 'hidden');
  if (hiddenItems.length > 0) {
    const rows = hiddenItems
      .slice(0, 20)
      .map(
        (c) => `
      <tr>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#0a0e1a;border-bottom:1px solid #efede8;">${c.name}</td>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#dc2626;border-bottom:1px solid #efede8;text-align:right;font-weight:600;">0 stock</td>
      </tr>`
      )
      .join('');
    const moreText = hiddenItems.length > 20 ? `<p style="margin:4px 0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">...and ${hiddenItems.length - 20} more</p>` : '';

    changesHtml += `
      <h3 style="margin:32px 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:18px;color:#dc2626;font-weight:700;">Hidden (Out of Stock)</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;border:1px solid #efede8;">
        ${rows}
      </table>
      ${moreText}`;
  }

  // Reactivated products section
  const reactivatedItems = changes.filter((c) => c.action === 'reactivated');
  if (reactivatedItems.length > 0) {
    const rows = reactivatedItems
      .slice(0, 20)
      .map(
        (c) => `
      <tr>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#0a0e1a;border-bottom:1px solid #efede8;">${c.name}</td>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#16a34a;border-bottom:1px solid #efede8;text-align:right;font-weight:600;">${c.newStock ?? ''} in stock</td>
      </tr>`
      )
      .join('');
    const moreText = reactivatedItems.length > 20 ? `<p style="margin:4px 0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">...and ${reactivatedItems.length - 20} more</p>` : '';

    changesHtml += `
      <h3 style="margin:32px 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:18px;color:#16a34a;font-weight:700;">Reactivated (Back in Stock)</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;border:1px solid #efede8;">
        ${rows}
      </table>
      ${moreText}`;
  }

  // Stock count updated section
  const updatedItems = changes.filter((c) => c.action === 'stock_updated');
  if (updatedItems.length > 0) {
    const rows = updatedItems
      .slice(0, 20)
      .map(
        (c) => `
      <tr>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#0a0e1a;border-bottom:1px solid #efede8;">${c.name}</td>
        <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#555;border-bottom:1px solid #efede8;text-align:right;">${c.oldStock} &rarr; ${c.newStock}</td>
      </tr>`
      )
      .join('');
    const moreText = updatedItems.length > 20 ? `<p style="margin:4px 0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">...and ${updatedItems.length - 20} more</p>` : '';

    changesHtml += `
      <h3 style="margin:32px 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:18px;color:#0a0e1a;font-weight:700;">Stock Count Updated</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;border:1px solid #efede8;">
        ${rows}
      </table>
      ${moreText}`;
  }

  // Errors section
  let errorsHtml = '';
  if (errors > 0) {
    const errorItems = changes.filter((c) => c.action === 'error');
    if (errorItems.length > 0) {
      const rows = errorItems
        .slice(0, 10)
        .map(
          (c) => `
        <tr>
          <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#0a0e1a;border-bottom:1px solid #efede8;">${c.name}</td>
          <td style="padding:8px 12px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#dc2626;border-bottom:1px solid #efede8;text-align:right;">${c.error || 'Unknown'}</td>
        </tr>`
        )
        .join('');

      errorsHtml = `
        <h3 style="margin:32px 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:18px;color:#dc2626;font-weight:700;">Errors (${errors})</h3>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;border:1px solid #fecaca;">
          ${rows}
        </table>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stock Sync Report - MooreItems</title>
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
  Stock sync: ${totalChanges} change${totalChanges !== 1 ? 's' : ''} across ${totalChecked} products.
</div>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding:44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:38px;color:#c8a45e;letter-spacing:2px;">MooreItems</h1>
            <p style="margin:12px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:16px;color:#8890a4;letter-spacing:0.5px;">CJ Stock Sync Report</p>
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

            <!-- Title -->
            <div style="text-align:center;padding-bottom:32px;">
              <p style="margin:0 0 8px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;">Total Changes</p>
              <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:64px;font-weight:800;color:${accentColor};">${totalChanges}</p>
              <p style="margin:8px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#888;">${date}</p>
            </div>

            <!-- Summary stats -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="24%" align="center" bgcolor="#f7f6f3" style="background:#f7f6f3;border-radius:8px;padding:20px 4px;">
                  <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#0a0e1a;">${totalChecked}</p>
                  <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Checked</p>
                </td>
                <td width="2%"></td>
                <td width="24%" align="center" bgcolor="#fef2f2" style="background:#fef2f2;border-radius:8px;padding:20px 4px;">
                  <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#dc2626;">${hidden}</p>
                  <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Hidden</p>
                </td>
                <td width="2%"></td>
                <td width="24%" align="center" bgcolor="#f0fdf4" style="background:#f0fdf4;border-radius:8px;padding:20px 4px;">
                  <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#16a34a;">${reactivated}</p>
                  <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Reactivated</p>
                </td>
                <td width="2%"></td>
                <td width="22%" align="center" bgcolor="#eff6ff" style="background:#eff6ff;border-radius:8px;padding:20px 4px;">
                  <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:28px;font-weight:700;color:#2563eb;">${stockUpdated}</p>
                  <p style="margin:4px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#888;">Updated</p>
                </td>
              </tr>
            </table>

            <p style="margin:16px 0 0;text-align:center;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">Completed in ${duration}s</p>

            ${changesHtml}
            ${errorsHtml}

            <!-- CTA -->
            <div style="text-align:center;padding:36px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background:#c8a45e;border-radius:8px;">
                  <a href="https://mooreitems.com/admin/catalog-health" style="display:inline-block;color:#ffffff;font-family:'DM Sans',Arial,sans-serif;font-size:19px;font-weight:bold;text-decoration:none;padding:20px 56px;">View Dashboard</a>
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
              This is an automated stock sync report from MooreItems.
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
