const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async send({ to, subject, html }) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'DigiVault <noreply@digivault.com>',
      to,
      subject,
      html
    });
  }

  async sendWelcomeEmail(user) {
    await this.send({
      to: user.email,
      subject: 'Welcome to DigiVault! 🎮',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#6366f1;font-size:28px;margin:0;">⚡ DigiVault</h1>
          </div>
          <h2 style="color:#fff;">Welcome, ${user.name}! 🎉</h2>
          <p style="color:#a0a0b8;line-height:1.6;">
            Your account has been created successfully. You now have access to thousands of digital products including game codes, gift cards, and e-books.
          </p>
          <div style="background:#1a1a2e;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #6366f1;">
            <p style="margin:0;color:#a0a0b8;">Account Email: <strong style="color:#fff;">${user.email}</strong></p>
          </div>
          <a href="${process.env.FRONTEND_URL}/products" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Start Shopping →
          </a>
          <p style="color:#666;font-size:12px;margin-top:30px;">© 2024 DigiVault. All rights reserved.</p>
        </div>
      `
    });
  }

  async sendOrderConfirmation(user, order) {
    const codesHtml = order.items.map(item => {
      const codes = item.codes.map(c => `
        <div style="background:#0f0f1a;border:1px solid #333;border-radius:6px;padding:12px;margin:8px 0;font-family:monospace;font-size:16px;color:#6366f1;letter-spacing:2px;text-align:center;">
          ${c.code}
        </div>
      `).join('');

      return `
        <div style="margin-bottom:20px;">
          <h3 style="color:#fff;margin-bottom:8px;">${item.name} × ${item.quantity}</h3>
          <p style="color:#a0a0b8;margin:0 0 8px;">Your activation code(s):</p>
          ${codes}
        </div>
      `;
    }).join('');

    await this.send({
      to: user.email,
      subject: `✅ Order Confirmed - ${order.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;padding:40px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#6366f1;font-size:28px;margin:0;">⚡ DigiVault</h1>
          </div>
          <div style="background:#1a2a1a;border:1px solid #22c55e;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
            <p style="color:#22c55e;font-size:18px;margin:0;">✅ Payment Successful!</p>
          </div>
          <h2 style="color:#fff;">Hi ${user.name}, here are your codes!</h2>
          <p style="color:#a0a0b8;">Order #: <strong style="color:#6366f1;">${order.orderNumber}</strong></p>
          <p style="color:#a0a0b8;">Total: <strong style="color:#fff;">$${order.totalAmount.toFixed(2)}</strong></p>
          <div style="border-top:1px solid #333;margin:20px 0;padding-top:20px;">
            ${codesHtml}
          </div>
          <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="color:#a0a0b8;margin:0;font-size:14px;">⚠️ Keep these codes safe. Each code can only be used once. DigiVault is not responsible for codes that have been shared or compromised.</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            View Order Details →
          </a>
          <p style="color:#666;font-size:12px;margin-top:30px;">© 2024 DigiVault. All rights reserved.</p>
        </div>
      `
    });
  }
}

module.exports = new EmailService();
