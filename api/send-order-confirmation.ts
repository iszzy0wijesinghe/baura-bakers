import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

type OrderItem = {
  product_name: string;
  size_label: string;
  sugar_level: string;
  quantity: number;
  unit_price_lkr: number;
  line_total_lkr: number;
};

type OrderRow = {
  id: string;
  order_no: string;
  customer_name: string;
  customer_email: string | null;
  contact_number: string;
  customer_address: string;
  delivery_address: string;
  delivery_location_url: string | null;
  subtotal_lkr: number;
  payment_status: string;
  order_status: string;
  payment_method: string | null;
  confirmation_email_sent_at: string | null;
  created_at: string;
  order_items: OrderItem[];
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing.`);
  }

  return value;
}

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildInvoiceHtml(order: OrderRow) {
  const siteUrl = requireEnv("SITE_URL");
  const logoUrl = process.env.BAURA_LOGO_URL || "";

  const trackUrl = `${siteUrl}/orders`;
  const receiptUrl = `${siteUrl}/receipt/${encodeURIComponent(order.order_no)}`;

  const rows = (order.order_items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            <strong>${escapeHtml(item.product_name)}</strong>
            <div style="font-size:12px;color:#7a6a5a;margin-top:4px;">
              ${escapeHtml(item.size_label)} • Sugar: ${escapeHtml(
                item.sugar_level,
              )}
            </div>
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">
            ${formatLkr(item.unit_price_lkr)}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;">
            <strong>${formatLkr(item.line_total_lkr)}</strong>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>

  <body style="margin:0;background:#f6efe2;font-family:Arial,Helvetica,sans-serif;color:#372619;">
    <div style="padding:20px;">
      <div style="max-width:680px;margin:0 auto;background:#fffaf1;border-radius:24px;overflow:hidden;border:1px solid #eadfce;">
        <div style="background:#372619;padding:28px;text-align:center;color:#fffaf1;">
          ${
            logoUrl
              ? `<img src="${escapeHtml(
                  logoUrl,
                )}" alt="Baura Bakers" style="height:64px;width:auto;margin-bottom:14px;" />`
              : ""
          }

          <h1 style="margin:0;font-size:26px;letter-spacing:-0.5px;">
            Payment Received
          </h1>

          <p style="margin:8px 0 0;color:#fff0d5;font-size:15px;">
            Your order has been confirmed.
          </p>
        </div>

        <div style="padding:26px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
            Hi <strong>${escapeHtml(order.customer_name)}</strong>,<br/>
            We received your payment and confirmed your Baura Bakers order.
          </p>

          <div style="background:#f8eddc;border:1px solid #eadfce;border-radius:18px;padding:18px;margin-bottom:22px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.4px;color:#7a6a5a;font-weight:bold;">
              Order Number
            </div>

            <div style="font-size:24px;font-weight:bold;margin-top:4px;">
              ${escapeHtml(order.order_no)}
            </div>
          </div>

          <div style="margin-bottom:22px;">
            <a href="${escapeHtml(trackUrl)}"
              style="display:inline-block;background:#372619;color:#fffaf1;text-decoration:none;padding:13px 18px;border-radius:14px;font-weight:bold;font-size:14px;margin-right:8px;margin-bottom:8px;">
              Track Order
            </a>

            <a href="${escapeHtml(receiptUrl)}"
              style="display:inline-block;background:#fff;border:1px solid #d8c8b5;color:#372619;text-decoration:none;padding:13px 18px;border-radius:14px;font-weight:bold;font-size:14px;margin-bottom:8px;">
              View Invoice
            </a>
          </div>

          <h2 style="font-size:18px;margin:0 0 12px;">
            Invoice Summary
          </h2>

          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:16px;overflow:hidden;">
            <thead>
              <tr style="background:#f8eddc;color:#372619;">
                <th style="padding:12px;text-align:left;font-size:12px;">Item</th>
                <th style="padding:12px;text-align:center;font-size:12px;">Qty</th>
                <th style="padding:12px;text-align:right;font-size:12px;">Price</th>
                <th style="padding:12px;text-align:right;font-size:12px;">Total</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <div style="margin-top:18px;text-align:right;font-size:18px;font-weight:bold;">
            Total: ${formatLkr(order.subtotal_lkr)}
          </div>

          <div style="margin-top:24px;background:#fff;border:1px solid #eee;border-radius:18px;padding:18px;">
            <h3 style="margin:0 0 10px;font-size:15px;">
              Delivery Details
            </h3>

            <p style="margin:0;font-size:14px;line-height:1.7;color:#5f5043;">
              ${escapeHtml(order.delivery_address)}

              ${
                order.delivery_location_url
                  ? `<br/><a href="${escapeHtml(
                      order.delivery_location_url,
                    )}" style="color:#372619;font-weight:bold;">Open delivery location</a>`
                  : ""
              }
            </p>
          </div>

          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#7a6a5a;">
            Thank you for ordering from Baura Bakers. You can track your order status anytime from your account.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
`;
}

async function readRequestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const anonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const gmailUser = requireEnv("GMAIL_USER");
    const gmailAppPassword = requireEnv("GMAIL_APP_PASSWORD");

    const body = await readRequestJson(request);
    const orderId = body.orderId as string | undefined;

    if (!orderId) {
      return Response.json({ error: "orderId is required." }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });


    const { data: profile, error: profileError } = await admin
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle();

const role = String(profile?.role || "").trim().toLowerCase();

const adminEmails = String(process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const userEmail = String(user.email || "").trim().toLowerCase();

const isAdminByRole = role === "admin";
const isAdminByEmail = adminEmails.includes(userEmail);

if (!isAdminByRole && !isAdminByEmail) {
  return Response.json(
    {
      error: "Admin access required.",
      debug: {
        userId: user.id,
        email: user.email,
        profileRole: profile?.role || null,
        profileError: profileError?.message || null,
        isAdminByRole,
        isAdminByEmail,
        adminEmailsConfigured: adminEmails.length,
      },
    },
    { status: 403 },
  );
}

    // const { data: profile, error: profileError } = await admin
    //   .from("profiles")
    //   .select("role")
    //   .eq("id", user.id)
    //   .single();

    // if (profileError || profile?.role !== "admin") {
    //   return Response.json({ error: "Admin access required." }, { status: 403 });
    // }

 

    // if (profileError || role !== "admin") {
    //   return Response.json(
    //     {
    //       error: "Admin access required.",
    //       debug: {
    //         userId: user.id,
    //         email: user.email,
    //         role: profile?.role || null,
    //         profileError: profileError?.message || null,
    //       },
    //     },
    //     { status: 403 },
    //   );
    // }

    

    const { data, error } = await admin
      .from("orders")
      .select(
        `
        id,
        order_no,
        customer_name,
        customer_email,
        contact_number,
        customer_address,
        delivery_address,
        delivery_location_url,
        subtotal_lkr,
        payment_status,
        order_status,
        payment_method,
        confirmation_email_sent_at,
        created_at,
        order_items (
          product_name,
          size_label,
          sugar_level,
          quantity,
          unit_price_lkr,
          line_total_lkr
        )
      `,
      )
      .eq("id", orderId)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const order = data as OrderRow;

    if (!order.customer_email) {
      return Response.json({
        skipped: true,
        reason: "Order has no customer email.",
      });
    }

    if (order.confirmation_email_sent_at) {
      return Response.json({
        skipped: true,
        reason: "Confirmation email already sent.",
      });
    }

    if (order.payment_status !== "PAID" || order.order_status !== "CONFIRMED") {
      return Response.json({
        skipped: true,
        reason: "Order is not PAID and CONFIRMED yet.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `Baura Bakers <${gmailUser}>`,
      to: order.customer_email,
      replyTo: gmailUser,
      subject: `Payment received — Order ${order.order_no} confirmed`,
      html: buildInvoiceHtml(order),
    });

    await admin
      .from("orders")
      .update({
        confirmation_email_sent_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return Response.json({
      success: true,
      message: "Confirmation email sent.",
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    route: "send-order-confirmation",
  });
}
