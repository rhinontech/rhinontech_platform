const otpGeneration = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <img src="https://cloudfilesdm.com/postcards/image-1736835666846.png" alt="RhinonTech Logo" style="max-width: 200px; height: auto;">
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <h1 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 28px; font-weight: bold; text-align: center;">Email Verification</h1>
                            <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 24px; text-align: center;">
                                Thank you for signing up! Please use the verification code below to complete your registration.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Verification Code Box -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px;">Your verification code is:</p>
                                        <div style="background-color: #f0f4ff; border: 2px solid #1e3a8a; border-radius: 8px; padding: 20px; display: inline-block; margin: 0 auto;">
                                            <span style="color: #1e3a8a; font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">6HS7SHD</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Expiry Notice -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="background-color: #fff8e6; border-left: 4px solid #ffa500; padding: 15px; border-radius: 4px;">
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 20px;">
                                            ⏰ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px; line-height: 20px; text-align: center;">
                                If you didn't request this verification code, please ignore this email.
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                                © 2025 RhinonTech. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

module.exports = otpGeneration;
