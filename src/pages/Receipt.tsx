import jsPDF from "jspdf";
import { Download, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logo from "../../images/logos/logo.webp";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";

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
  created_at: string;
};

type OrderItemRow = {
  id: string;
  product_name: string | null;
  size_label: string | null;
  sugar_level: string | null;
  quantity: number;
  unit_price_lkr: number;
  line_total_lkr: number;
};

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatStatus(value: string | null | undefined) {
  return (value || "-").replace(/_/g, " ");
}

function getItemName(item: OrderItemRow) {
  return item.product_name || "Baura Bakers item";
}

function loadImageAsDataUrl(src: string) {
  return new Promise<{ dataUrl: string; width: number; height: number }>(
    (resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not prepare receipt logo."));
          return;
        }

        ctx.drawImage(image, 0, 0);

        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: image.width,
          height: image.height,
        });
      };

      image.onerror = () => reject(new Error("Could not load receipt logo."));
      image.src = src;
    },
  );
}

async function createReceiptPdf(order: OrderRow, items: OrderItemRow[]) {
  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const brand = {
    ink: "#3A261B",
    soft: "#7B5A44",
    muted: "#9A7B66",
    line: "#E7DCCB",
    bg: "#F9F4E0",
    card: "#FFFFFF",
    chip: "#F6EEDC",
    pale: "#FFFCF6",
  };

  const logoImage = await loadImageAsDataUrl(logo);

  function hexToRgb(hex: string) {
    const clean = hex.replace("#", "");
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }

  function setFill(hex: string) {
    const c = hexToRgb(hex);
    doc.setFillColor(c.r, c.g, c.b);
  }

  function setDraw(hex: string) {
    const c = hexToRgb(hex);
    doc.setDrawColor(c.r, c.g, c.b);
  }

  function setText(hex: string) {
    const c = hexToRgb(hex);
    doc.setTextColor(c.r, c.g, c.b);
  }

  function drawPage() {
    setFill(brand.bg);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    setFill(brand.card);
    doc.roundedRect(margin, 12, contentWidth, pageHeight - 24, 7, 7, "F");

    setDraw(brand.line);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, 12, contentWidth, pageHeight - 24, 7, 7, "S");
  }

  function drawFooter() {
    setDraw(brand.line);
    doc.setLineWidth(0.2);
    doc.line(
      margin + 6,
      pageHeight - 24,
      pageWidth - margin - 6,
      pageHeight - 24,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(brand.muted);
    doc.text(
      "Thank you for ordering from Baura Bakers. This receipt was generated digitally.",
      pageWidth / 2,
      pageHeight - 17,
      { align: "center" },
    );
  }

  drawPage();

  const leftX = margin + 8;
  const rightX = pageWidth - margin - 8;

  // Header
  const logoPdfW = 14;
  const logoPdfH = logoPdfW * (logoImage.height / logoImage.width);

  doc.addImage(logoImage.dataUrl, "PNG", leftX, 22, logoPdfW, logoPdfH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setText(brand.ink);
  doc.text("Baura Bakers", leftX + 20, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(brand.soft);
  doc.text("Freshly baked orders, carefully packed.", leftX + 20, 34);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  setText(brand.ink);
  doc.text("Receipt", rightX, 28, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(brand.soft);
  doc.text(order.order_no, rightX, 34, { align: "right" });

  setDraw(brand.line);
  doc.setLineWidth(0.3);
  doc.line(leftX, 50, rightX, 50);

  let y = 62;

  // Details section - cleaner, no big ugly boxes
  const midX = pageWidth / 2 + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setText(brand.ink);
  doc.text("Customer Details", leftX, y);
  doc.text("Order Details", midX, y);

  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);
  setText(brand.soft);

 const lineGap = 4.8;

doc.text(`Name: ${order.customer_name || "-"}`, leftX, y);
doc.text(`Date: ${formatDate(order.created_at)}`, midX, y);

y += lineGap;
doc.text(`Phone: ${order.contact_number || "-"}`, leftX, y);
doc.text(`Payment: ${formatStatus(order.payment_status)}`, midX, y);

y += lineGap;
doc.text(`Email: ${order.customer_email || "-"}`, leftX, y);
doc.text(`Status: ${formatStatus(order.order_status)}`, midX, y);

y += 8; // keep delivery separate
  
  setDraw(brand.line);
  doc.line(leftX, y, rightX, y);
  y += 6;

  // Table columns
  const tableX = leftX;
  const tableW = rightX - leftX;
  const itemX = tableX + 5;
  const qtyX = rightX - 55;
  const priceX = rightX - 34;
  const totalX = rightX - 4;

  setFill(brand.chip);
  doc.roundedRect(tableX, y, tableW, 9, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  setText(brand.ink);
  doc.text("ITEM", itemX, y + 6);
  doc.text("QTY", qtyX, y + 6);
  doc.text("PRICE", priceX, y + 6);
  doc.text("TOTAL", totalX, y + 6, { align: "right" });

  y += 13;

  items.forEach((item) => {
    const itemTitle = getItemName(item);
    const meta = [
      item.size_label ? `Size: ${item.size_label}` : "",
      item.sugar_level ? `Sugar: ${item.sugar_level}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    if (y > 250) {
      drawFooter();
      doc.addPage();
      drawPage();
      y = 24;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.1);
    setText(brand.ink);
    doc.text(itemTitle, itemX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(brand.ink);
    doc.text(String(item.quantity || 0), qtyX, y);
    doc.text(formatLkr(item.unit_price_lkr || 0), priceX, y);
    doc.text(formatLkr(item.line_total_lkr || 0), totalX, y, {
      align: "right",
    });

    y += 4.6;

    if (meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setText(brand.soft);
      doc.text(meta, itemX, y);
      y += 4.8;
    }

    setDraw(brand.line);
    doc.setLineWidth(0.15);
    doc.line(itemX, y, rightX, y);

    y += 3.2;
  });

  y += 6;

  // Total section
  const totalBoxW = 72;
  const totalBoxH = 22;
  const totalBoxX = rightX - totalBoxW;

  setFill(brand.chip);
  doc.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 5, 5, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(brand.soft);
  doc.text("Grand Total", totalBoxX + 6, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  setText(brand.ink);
  doc.text(formatLkr(order.subtotal_lkr), totalBoxX + totalBoxW - 6, y + 16, {
    align: "right",
  });

  y += 34;

  if (y < 242) {
    setFill(brand.pale);
    setDraw(brand.line);
    doc.roundedRect(leftX, y, tableW, 16, 4, 4, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(brand.soft);
    doc.text(
      "Delivery is arranged carefully by Baura Bakers. Please keep this receipt for your order reference.",
      leftX + 5,
      y + 10,
    );
  }

  drawFooter();

  return doc;
}

export default function Receipt() {
  const navigate = useNavigate();
  const { orderNo } = useParams();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadReceipt() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      if (!orderNo) {
        setErrorText("Receipt order number is missing.");
        setIsLoading(false);
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, order_no, customer_name, customer_email, contact_number, customer_address, delivery_address, delivery_location_url, subtotal_lkr, payment_status, order_status, payment_method, created_at",
        )
        .eq("order_no", orderNo)
        .single();

      if (orderError || !orderData) {
        setErrorText(orderError?.message || "Receipt not found.");
        setIsLoading(false);
        return;
      }

      const { data: itemData, error: itemError } = await supabase
        .from("order_items")
        .select(
          "id, product_name, size_label, sugar_level, quantity, unit_price_lkr, line_total_lkr",
        )
        .eq("order_id", orderData.id)
        .order("id", { ascending: true });

      if (itemError) {
        setErrorText(itemError.message);
      } else {
        setOrder(orderData as OrderRow);
        setItems((itemData || []) as OrderItemRow[]);
      }

      setIsLoading(false);
    }

    loadReceipt();
  }, [navigate, orderNo]);

  const generatedFileName = useMemo(() => {
    return `Baura-Bakers-Receipt-${order?.order_no || orderNo || "order"}.pdf`;
  }, [order?.order_no, orderNo]);

  async function downloadPdf() {
    if (!order) return;

    try {
      setIsGenerating(true);
      const doc = await createReceiptPdf(order, items);
      doc.save(generatedFileName);
    } finally {
      setIsGenerating(false);
    }
  }

  async function openPdf() {
    if (!order) return;

    try {
      setIsGenerating(true);
      const doc = await createReceiptPdf(order, items);
      const url = doc.output("bloburl");
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <Page>
        <div className="rounded-2xl border border-black/10 bg-white/55 p-5 text-sm text-brand-ink/70">
          Preparing receipt...
        </div>
      </Page>
    );
  }

  if (errorText || !order) {
    return (
      <Page>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorText || "Receipt could not be opened."}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              RECEIPT
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
              {order.order_no}
            </h1>
            <p className="mt-1 text-sm text-brand-ink/65">
              Generate and open your receipt as a PDF.
            </p>
          </div>

          <Link
            to="/orders"
            className="rounded-xl border border-brand-ink/20 bg-white/55 px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-white/75"
          >
            Back to orders
          </Link>
        </header>

        <section className="rounded-3xl border border-black/10 bg-white/55 p-5 shadow-sm backdrop-blur sm:p-7">
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={logo}
              alt="Baura Bakers"
              className="h-auto max-h-10 max-w-24 object-contain"
            />

            <div>
              <h2 className="text-lg font-semibold text-brand-ink">
                Baura Bakers Receipt
              </h2>
              <p className="text-sm text-brand-ink/65">
                {formatDate(order.created_at)}
              </p>
              <p className="text-sm font-semibold text-brand-ink">
                {formatLkr(order.subtotal_lkr)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={openPdf}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95 disabled:cursor-not-allowed disabled:bg-brand-ink/50"
            >
              <Printer size={17} />
              {isGenerating ? "Generating..." : "Open receipt PDF"}
            </button>

            <button
              type="button"
              onClick={downloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-ink/20 bg-white/65 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/85 disabled:cursor-not-allowed disabled:text-brand-ink/40"
            >
              <Download size={17} />
              Download PDF
            </button>
          </div>
        </section>
      </div>
    </Page>
  );
}
