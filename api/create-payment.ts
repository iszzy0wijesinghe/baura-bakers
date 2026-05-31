import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function md5Upper(value: string) {
  return crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

function formatAmount(value: number | string) {
  return Number(value).toFixed(2);
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "Customer",
    lastName: parts.slice(1).join(" ") || "Baura",
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const payhereMode = process.env.PAYHERE_MODE || "sandbox";
  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");

  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({ message: "Missing Supabase server env" });
  }

  if (!merchantId || !merchantSecret || !siteUrl) {
    return res.status(500).json({ message: "Missing PayHere server env" });
  }

  const orderNo = req.body?.orderNo;

  if (!orderNo) {
    return res.status(400).json({ message: "orderNo is required" });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_no, customer_name, contact_number, customer_address, delivery_address, delivery_app, subtotal_lkr, payment_status",
    )
    .eq("order_no", orderNo)
    .single();

  if (error || !order) {
    return res.status(404).json({
      message: "Order not found",
      details: error?.message,
    });
  }

  const amount = formatAmount(order.subtotal_lkr);
  const currency = "LKR";
  const hashedSecret = md5Upper(merchantSecret);
  const hash = md5Upper(
    `${merchantId}${order.order_no}${amount}${currency}${hashedSecret}`,
  );

  const { firstName, lastName } = splitName(order.customer_name);

  await supabase
    .from("orders")
    .update({
      payment_status: "PAYMENT_STARTED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const actionUrl =
    payhereMode === "live"
      ? "https://www.payhere.lk/pay/checkout"
      : "https://sandbox.payhere.lk/pay/checkout";

  return res.status(200).json({
    actionUrl,
    fields: {
      merchant_id: merchantId,
      return_url: `${siteUrl}/payment-success?orderNo=${encodeURIComponent(
        order.order_no,
      )}`,
      cancel_url: `${siteUrl}/payment-cancelled?orderNo=${encodeURIComponent(
        order.order_no,
      )}`,
      notify_url: `${siteUrl}/api/payhere-notify`,

      order_id: order.order_no,
      items: `Baura Bakers Order ${order.order_no}`,
      currency,
      amount,
      hash,

      first_name: firstName,
      last_name: lastName,
      email: "customer@example.com",
      phone: order.contact_number,
      address: order.customer_address,
      city: "Colombo",
      country: "Sri Lanka",

      delivery_address: order.delivery_address,
      delivery_city: "Colombo",
      delivery_country: "Sri Lanka",

      custom_1: order.id,
      custom_2: "baura-bakers",
    },
  });
}