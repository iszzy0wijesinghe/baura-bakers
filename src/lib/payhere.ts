type CreatePaymentResponse = {
  actionUrl: string;
  fields: Record<string, string>;
};

function submitPostForm(actionUrl: string, fields: Record<string, string>) {
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

export async function startPayHerePayment(orderNo: string) {
  const response = await fetch("/api/create-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderNo }),
  });

  const rawText = await response.text();

  let result: any = null;

  try {
    result = rawText ? JSON.parse(rawText) : null;
  } catch {
    console.error("Non-JSON API response:", rawText);
    throw new Error("Payment API returned an invalid response.");
  }

  if (!response.ok) {
    console.error("Payment API error:", result);
    throw new Error(result?.message || "Could not start PayHere payment.");
  }

  const paymentResult = result as CreatePaymentResponse;

  if (!paymentResult.actionUrl || !paymentResult.fields) {
    console.error("Invalid payment payload:", paymentResult);
    throw new Error("Payment API response is missing PayHere fields.");
  }

  submitPostForm(paymentResult.actionUrl, paymentResult.fields);
}