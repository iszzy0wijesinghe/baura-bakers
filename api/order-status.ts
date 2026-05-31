import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({ message: "Missing Supabase server env" });
  }

  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const orderNo = url.searchParams.get("orderNo");

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
    .select("order_no, payment_status, order_status, subtotal_lkr")
    .eq("order_no", orderNo)
    .single();

  if (error || !order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.status(200).json(order);
}