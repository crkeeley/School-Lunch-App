import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

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
    from: process.env.FROM_EMAIL ?? "noreply@schoollunch.com",
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

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "noreply@schoollunch.com",
    to,
    subject: "Welcome to School Lunch Ordering!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Welcome, ${name}!</h1>
        <p>Your account has been created. You can now start ordering school lunches for your child.</p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">Go to Dashboard</a>
      </div>
    `,
  });
}
