// Contact form email templates — navy/gold MooreItems styling

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Admin notification email (sent to mooreitemsshop@gmail.com) */
export function contactFormAdminTemplate(data: ContactFormData): string {
  const { name, email, subject, message } = data;
  const escapedMessage = message.replace(/\n/g, '<br />');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Form Submission</title>
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

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="header-cell" style="padding: 44px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 38px; color: #c8a45e; letter-spacing: 2px;">MooreItems</h1>
            <p style="margin: 12px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 16px; color: #8890a4; letter-spacing: 0.5px;">New Contact Form Message</p>
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
            <h2 style="margin: 0 0 24px; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #0a0e1a;">New Message from ${name}</h2>

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td bgcolor="#f7f6f3" style="background: #f7f6f3; border-radius: 12px; padding: 24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
                      <p style="margin: 4px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #0a0e1a;">${name}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                      <p style="margin: 4px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #0a0e1a;"><a href="mailto:${email}" style="color: #c8a45e; text-decoration: none;">${email}</a></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Subject</p>
                      <p style="margin: 4px 0 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #0a0e1a;">${subject}</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <div style="height: 24px;"></div>

            <h3 style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 20px; color: #0a0e1a; font-weight: bold;">Message</h3>
            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #444; line-height: 1.7;">${escapedMessage}</p>

            <div style="text-align: center; padding: 40px 0 8px;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background: #c8a45e; border-radius: 8px;">
                  <a href="mailto:${email}" style="display: inline-block; color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; font-weight: bold; text-decoration: none; padding: 18px 48px;">Reply to ${name}</a>
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
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="footer-cell" style="padding: 36px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
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

/** Auto-reply confirmation email (sent to the customer) */
export function contactFormAutoReplyTemplate(name: string): string {
  const firstName = name.split(' ')[0] || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We received your message — MooreItems</title>
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
            <div style="text-align: center; padding-bottom: 32px;">
              <div style="width: 80px; height: 80px; background: #f0fdf4; border-radius: 50%; line-height: 80px; text-align: center; font-size: 40px; margin: 0 auto;">&#10003;</div>
            </div>

            <h2 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #0a0e1a; text-align: center;">Message Received!</h2>

            <p style="margin: 0 0 24px; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; color: #444; line-height: 1.7; text-align: center;">
              Hi ${firstName}, thanks for reaching out! We've received your message and will get back to you within 24 hours.
            </p>

            <p style="margin: 0; font-family: 'DM Sans', Arial, sans-serif; font-size: 17px; color: #666; text-align: center;">
              — The MooreItems Team
            </p>

            <div style="text-align: center; padding: 40px 0 8px;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr><td bgcolor="#c8a45e" style="background: #c8a45e; border-radius: 8px;">
                  <a href="https://mooreitems.com" style="display: inline-block; color: #ffffff; font-family: 'DM Sans', Arial, sans-serif; font-size: 18px; font-weight: bold; text-decoration: none; padding: 18px 48px;">Visit MooreItems</a>
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
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1629" style="background: #0f1629;">
  <tr>
    <td align="center" class="footer-cell" style="padding: 36px 20px;">
      <table width="640" cellpadding="0" cellspacing="0" border="0" class="inner-table" style="max-width: 640px;">
        <tr>
          <td align="center">
            <p style="margin: 0 0 12px; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #5a6178;">
              <a href="https://mooreitems.com/shipping-policy" style="color: #5a6178; text-decoration: none;">Shipping</a> &nbsp;&middot;&nbsp;
              <a href="https://mooreitems.com/returns" style="color: #5a6178; text-decoration: none;">Returns</a> &nbsp;&middot;&nbsp;
              <a href="https://mooreitems.com/privacy-policy" style="color: #5a6178; text-decoration: none;">Privacy</a> &nbsp;&middot;&nbsp;
              <a href="https://mooreitems.com/terms" style="color: #5a6178; text-decoration: none;">Terms</a>
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
