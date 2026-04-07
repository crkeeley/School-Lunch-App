import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

function requireFromEmail() {
  const fromEmail = process.env.FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("FROM_EMAIL environment variable is required");
  }

  return fromEmail;
}

export async function sendOrderConfirmation({
  to,
  parentName,
  childName,
  teacherName,
  deliveryDate,
  items,
  total,
  orderId,
}: {
  to: string;
  parentName: string;
  childName: string;
  teacherName: string;
  deliveryDate: string;
  items: { name: string; quantity: number; price: string }[];
  total: string;
  orderId: string;
}) {
  const itemList = items
    .map((i) => `<tr><td>${i.name}</td><td>x${i.quantity}</td><td>${i.price}</td></tr>`)
    .join("");

  await resend.emails.send({
    from: requireFromEmail(),
    to,
    subject: `Order Confirmed - ${deliveryDate}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Order Confirmed!</h1>
        <p>Hi ${parentName},</p>
        <p>Your lunch order for <strong>${childName}</strong> (${teacherName}'s class) on <strong>${deliveryDate}</strong> has been confirmed.</p>
        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;">Item</th>
              <th style="padding:8px;text-align:left;">Qty</th>
              <th style="padding:8px;text-align:left;">Price</th>
            </tr>
          </thead>
          <tbody>${itemList}</tbody>
          <tfoot>
            <tr style="font-weight:bold;">
              <td colspan="2" style="padding:8px;">Total</td>
              <td style="padding:8px;">${total}</td>
            </tr>
          </tfoot>
        </table>
        <p>Order ID: <code>${orderId}</code></p>
        <p style="color:#6b7280;font-size:12px;">Thank you for using School Lunch Ordering!</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  await resend.emails.send({
    from: requireFromEmail(),
    to,
    subject: "Verify your email – School Lunch Ordering",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Almost there, ${name}!</h1>
        <p>Thanks for creating an account. Please verify your email address to activate your account and start ordering lunches for your child.</p>
        <a href="${verifyUrl}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">Verify Email Address</a>
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
        <p style="color:#9ca3af;font-size:11px;">If the button above does not work, copy and paste this URL into your browser:<br/>${verifyUrl}</p>
      </div>
    `,
  });
}
