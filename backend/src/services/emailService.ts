import nodemailer from 'nodemailer';
import { config } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (config.mail.mode === 'smtp') {
    transporter = nodemailer.createTransport({
      host: config.mail.smtp.host,
      port: config.mail.smtp.port,
      secure: config.mail.smtp.secure,
      auth: config.mail.smtp.user
        ? {
            user: config.mail.smtp.user,
            pass: config.mail.smtp.pass,
          }
        : undefined,
    });
  } else {
    // Console mode
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  return transporter;
}

export interface VerificationEmailData {
  to: string;
  name?: string;
  verificationUrl: string;
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<void> {
  const { to, name, verificationUrl } = data;

  const mailOptions = {
    from: config.mail.from,
    to,
    subject: 'Verify your BuildTrack account',
    text: `
Hello${name ? ` ${name}` : ''},

Thank you for signing up for BuildTrack!

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in ${config.verificationTokenExpiresMinutes} minutes.

If you did not create an account, please ignore this email.

---
BuildTrack - Clarity and accountability for construction workflows
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2563eb; margin-top: 0;">BuildTrack</h1>
    <h2 style="color: #1e293b;">Verify your email address</h2>
    <p>Hello${name ? ` ${name}` : ''},</p>
    <p>Thank you for signing up for BuildTrack!</p>
    <p>Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #64748b; font-size: 14px;">
      Or copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
    </p>
    <p style="color: #64748b; font-size: 14px;">
      This link will expire in ${config.verificationTokenExpiresMinutes} minutes.
    </p>
    <p style="color: #64748b; font-size: 14px;">
      If you did not create an account, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      BuildTrack - Clarity and accountability for construction workflows
    </p>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    const transport = getTransporter();
    await transport.sendMail(mailOptions);

    if (config.mail.mode === 'console') {
      console.log('\n' + '='.repeat(80));
      console.log('📧 VERIFICATION EMAIL (Console Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('-'.repeat(80));
      console.log(mailOptions.text);
      console.log('='.repeat(80));
      console.log(`🔗 Verification URL: ${verificationUrl}`);
      console.log('='.repeat(80) + '\n');
    } else {
      console.log(`Verification email sent to ${to}`);
    }
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export interface ContactEmailData {
  to: string;
  name: string;
  email: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const { to, name, email, message } = data;

  const mailOptions = {
    from: config.mail.from,
    to,
    subject: `New Contact Form Submission from ${name}`,
    text: `
You have received a new contact form submission.

Name: ${name}
Email: ${email}

Message:
${message}
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2563eb; margin-top: 0;">New Contact Submission</h1>
    <p>You have received a new message from the contact form on your website.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p><strong>Message:</strong></p>
    <p style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 1px solid #e2e8f0;">${message.replace(/\n/g, '<br>')}</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      This email was sent from the contact form on BuildTrack.
    </p>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    const transport = getTransporter();
    await transport.sendMail(mailOptions);

    if (config.mail.mode === 'console') {
      console.log('\n' + '='.repeat(80));
      console.log('📧 CONTACT FORM (Console Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${to}`);
      console.log(`From: "${name}" <${email}>`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('-'.repeat(80));
      console.log(mailOptions.text);
      console.log('='.repeat(80) + '\n');
    } else {
      console.log(`Contact form submission sent from ${email} to ${to}`);
    }
  } catch (error) {
    console.error('Failed to send contact email:', error);
    throw new Error('Failed to send contact email');
  }
}
