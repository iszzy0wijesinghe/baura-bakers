import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function md5Upper(value: string) {
  return crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

async function getFormBody(req: any) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return Object.fromEntries(new URLSearchParams(req.body));
  }

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return Object.fromEntries(new URLSearchParams(raw));
}

function mapPaymentStatus(statusCode: string) {
  switch (statusCode) {
    case "2":
      return "PAID";
    case "0":
      return "PENDING_PAYMENT";
    case "-1":
      return "CANCELLED";
    case "-2":
      return "FAILED";
    case "-3":
      return "CHARGEDBACK";
    default:
      return "UNKNOWN";
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!supabaseUrl || !supabaseSecretKey || !merchantSecret) {
    return res.status(500).send("Missing server env");
  }

  const body = await getFormBody(req);

  const merchantId = String(body.merchant_id || "");
  const orderNo = String(body.order_id || "");
  const paymentId = String(body.payment_id || "");
  const payhereAmount = String(body.payhere_amount || "");
  const payhereCurrency = String(body.payhere_currency || "");
  const statusCode = String(body.status_code || "");
  const md5sig = String(body.md5sig || "").toUpperCase();
  const statusMessage = String(body.status_message || "");

  const localMd5sig = md5Upper(
    `${merchantId}${orderNo}${payhereAmount}${payhereCurrency}${statusCode}${md5Upper(
      merchantSecret,
    )}`,
  );

  if (localMd5sig !== md5sig) {
    console.error("Invalid PayHere signature", {
      orderNo,
      statusCode,
      payhereAmount,
      payhereCurrency,
    });

    return res.status(400).send("Invalid signature");
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, subtotal_lkr")
    .eq("order_no", orderNo)
    .single();

  if (orderError || !order) {
    return res.status(404).send("Order not found");
  }

  const expectedAmount = Number(order.subtotal_lkr).toFixed(2);

  if (expectedAmount !== Number(payhereAmount).toFixed(2)) {
    console.error("PayHere amount mismatch", {
      orderNo,
      expectedAmount,
      payhereAmount,
    });

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "PAYHERE",
      payment_id: paymentId,
      amount_lkr: Number(payhereAmount || 0),
      status_code: statusCode,
      status_message: "AMOUNT_MISMATCH",
      raw_response: body,
    });

    return res.status(400).send("Amount mismatch");
  }

  const paymentStatus = mapPaymentStatus(statusCode);

  await supabase.from("payments").insert({
    order_id: order.id,
    provider: "PAYHERE",
    payment_id: paymentId,
    amount_lkr: Number(payhereAmount || 0),
    status_code: statusCode,
    status_message: statusMessage,
    raw_response: body,
  });

  await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      order_status: paymentStatus === "PAID" ? "CONFIRMED" : "NEW",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return res.status(200).send("OK");
}