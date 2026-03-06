import type { AutoImportDigestData } from '../sendgrid';

function scoreBadge(score: number): string {
  let bg: string, text: string;
  if (score >= 70) {
    bg = '#f0fdf4'; text = '#16a34a';
  } else if (score >= 50) {
    bg = '#fffbeb'; text = '#d97706';
  } else {
    bg = '#fef2f2'; text = '#dc2626';
  }
  return `<span style="display:inline-block;padding:4px 12px;border-radius:12px;background:${bg};color:${text};font-family:'DM Sans',Arial,sans-serif;font-size:14px;font-weight:700;">${score}</span>`;
}

export function autoImportDigestTemplate(data: AutoImportDigestData): string {
  const { batchDate, suggestionCount, suggestions } = data;

  const productRows = suggestions
    .map(
      (s) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #efede8;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="80" valign="top" style="padding-right:16px;">
                ${s.productImage
                  ? `<img src="${s.productImage}" alt="" width="80" height="80" style="border-radius:8px;object-fit:cover;display:block;" />`
                  : `<div style="width:80px;height:80px;border-radius:8px;background:#f0ede8;"></div>`
                }
              </td>
              <td valign="top">
                <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#0a0e1a;">${s.productName}</p>
                <p style="margin:0 0 8px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#888;">
                  CJ $${s.cjPrice.toFixed(2)} → Retail $${s.retailPrice.toFixed(2)} &middot; ${s.marginPercent.toFixed(1)}% margin
                </p>
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="padding-right:12px;">${scoreBadge(s.aiScore)}</td>
                  <td style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#555;max-width:360px;">${s.aiReasoning.slice(0, 120)}${s.aiReasoning.length > 120 ? '...' : ''}</td>
                </tr></table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Auto-Import Suggestions - MooreItems</title>
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
  ${suggestionCount} new product suggestions ready for review.
</div>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background:#0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding:44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width:640px;">
        <tr>
          <td align="center">
            <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:38px;color:#c8a45e;letter-spacing:2px;">MooreItems</h1>
            <p style="margin:12px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:16px;color:#8890a4;letter-spacing:0.5px;">Auto-Import Suggestions</p>
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

            <!-- Summary -->
            <div style="text-align:center;padding-bottom:32px;">
              <p style="margin:0 0 8px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;">New Suggestions</p>
              <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:64px;font-weight:800;color:#c8a45e;">${suggestionCount}</p>
              <p style="margin:8px 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#888;">${batchDate}</p>
            </div>

            <!-- Product List -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${productRows}
            </table>

            <!-- CTA -->
            <div style="text-align:center;padding:36px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background:#c8a45e;border-radius:8px;">
                  <a href="https://mooreitems.com/admin/auto-import" style="display:inline-block;color:#ffffff;font-family:'DM Sans',Arial,sans-serif;font-size:19px;font-weight:bold;text-decoration:none;padding:20px 56px;">Review in Admin Panel</a>
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
              This is an automated product discovery report from MooreItems.
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
