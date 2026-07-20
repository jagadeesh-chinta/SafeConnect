export function createWelcomeEmailTemplate(name, clientURL) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Chatify</title>
</head>

<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:20px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Segoe UI, Arial, sans-serif;color:#333;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(90deg,#3ccfdc,#5b86e5);padding:28px;">
              <div style="background:#ffffff;width:72px;height:72px;border-radius:50%;display:inline-block;line-height:72px;">
                <img src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png"
                     width="42" height="42"
                     style="vertical-align:middle;" alt="Messenger">
              </div>
              <h1 style="color:#ffffff;margin:18px 0 0 0;font-weight:600;font-size:26px;">
                Welcome to Messenger!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 12px 0;font-size:18px;color:#5b86e5;font-weight:600;">
                Hello ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#444;">
                We're excited to have you join our messaging platform (Chatify)! Messenger connects you
                with friends, family, and colleagues in real-time, no matter where they are.
              </p>

              <!-- Steps Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#f7f9fb;border-left:4px solid #3ccfdc;border-radius:8px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0 0 12px 0;font-weight:600;font-size:15px;">
                      Get started in just a few steps:
                    </p>

                    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;color:#444;">
                      <li>Set up your profile picture</li>
                      <li>Find and add your contacts</li>
                      <li>Start a conversation</li>
                      <li>Share photos, videos, and more</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:28px 0;">
                    <a href="${clientURL}"
                       style="background:linear-gradient(90deg,#3ccfdc,#5b86e5);
                              color:#ffffff;
                              text-decoration:none;
                              padding:12px 32px;
                              border-radius:40px;
                              font-size:15px;
                              font-weight:600;
                              display:inline-block;">
                      Open Messenger
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px 0;font-size:14px;color:#555;">
                If you need any help or have questions, we're always here to assist you.
              </p>
              <p style="margin:0 0 18px 0;font-size:14px;color:#555;">
                Happy messaging!
              </p>

              <p style="margin:0;font-size:14px;">
                Best regards,<br>
                <strong>The Messenger Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#fafafa;padding:20px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} Messenger. All rights reserved.<br><br>

              <a href="#" style="color:#5b86e5;text-decoration:none;margin:0 8px;">Privacy Policy</a>
              <a href="#" style="color:#5b86e5;text-decoration:none;margin:0 8px;">Terms of Service</a>
              <a href="#" style="color:#5b86e5;text-decoration:none;margin:0 8px;">Contact Us</a>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function createOTPEmailTemplate(otp) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chatify OTP Verification</title>
</head>

<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:20px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Segoe UI, Arial, sans-serif;color:#333;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(90deg,#3ccfdc,#5b86e5);padding:28px;">
              <h1 style="color:#ffffff;margin:0;font-weight:600;font-size:26px;">
                🔐 Chatify OTP
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 12px 0;font-size:16px;color:#444;font-weight:600;">
                Hi there,
              </p>

              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#555;">
                You requested to sign in to your Chatify account. Use the one-time password (OTP) below to complete your login. This code will expire in <strong>1 minute</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:28px 0;">
                    <div style="background:linear-gradient(90deg,#3ccfdc,#5b86e5);border-radius:8px;padding:20px;display:inline-block;">
                      <p style="margin:0;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:8px;font-family:monospace;">
                        ${otp}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#f7f9fb;border-left:4px solid #fbbf24;border-radius:8px;margin-top:24px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
                      <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Chatify staff will never ask for your OTP.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:13px;color:#888;line-height:1.6;">
                Didn't request this? You can safely ignore this email. Your account remains secure.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#fafafa;padding:20px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} Chatify. All rights reserved.<br><br>
              <a href="#" style="color:#5b86e5;text-decoration:none;margin:0 8px;">Privacy Policy</a>
              <a href="#" style="color:#5b86e5;text-decoration:none;margin:0 8px;">Terms of Service</a>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}
