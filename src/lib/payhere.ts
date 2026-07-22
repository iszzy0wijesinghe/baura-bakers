/** @format */

import { getBauraDeviceId } from "./device";
import { laravelGet, laravelPost } from "./laravelApi";

type CreatePaymentResponse = {
  data: {
    action_url: string;
    fields: Record<string, string>;
    payment: {
      attempt_no: number;
      merchant_order_id: string;
    };
  };
};

export type PayHerePaymentStatus = {
  order_no: string;
  payment_method: string;
  payment_status:
    | "PENDING_PAYMENT"
    | "PAYMENT_STARTED"
    | "PAID"
    | "FAILED"
    | "CANCELLED"
    | "CHARGEDBACK"
    | "UNKNOWN";
  order_status: string;
  order_total_lkr: number;
  latest_attempt: {
    attempt_no: number;
    status: string;
    provider_status_code: string | null;
    status_message: string | null;
    completed_at: string | null;
  } | null;
  updated_at: string | null;
};

function submitPostForm(
  actionUrl: string,
  fields: Record<string, string>,
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export async function startPayHerePayment(
  orderNo: string,
  trackingToken?: string | null,
) {
  const response = await laravelPost<CreatePaymentResponse>(
    "/api/v1/payments/payhere/initiate",
    {
      order_no: orderNo,
      device_id: getBauraDeviceId(),
      token: trackingToken || null,
    },
  );

  if (!response.data.action_url || !response.data.fields) {
    throw new Error(
      "Laravel returned an incomplete PayHere payment request.",
    );
  }

  submitPostForm(
    response.data.action_url,
    response.data.fields,
  );
}

export async function getPayHerePaymentStatus(
  orderNo: string,
  trackingToken?: string | null,
) {
  const params = new URLSearchParams();
  const deviceId = getBauraDeviceId();

  if (deviceId) params.set("device_id", deviceId);
  if (trackingToken) params.set("token", trackingToken);

  const response = await laravelGet<{
    data: {
      payment: PayHerePaymentStatus;
    };
  }>(
    `/api/v1/payments/orders/${encodeURIComponent(orderNo)}/status?${params.toString()}`,
  );

  return response.data.payment;
}
