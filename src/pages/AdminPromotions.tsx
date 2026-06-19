import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import {
  getAdminCategories,
  getAdminProducts,
  getAdminSubcategories,
  type AdminCategory,
  type AdminProduct,
  type AdminSubcategory,
} from "../lib/adminCatalog";
import {
  generateCouponCode,
  getAdminPromotions,
  savePromotion,
  type DiscountType,
  type Promotion,
  type PromotionPayload,
  type PromotionTargetType,
  type PromotionType,
} from "../lib/promotions";
import { supabase } from "../lib/supabase";

const promotionTypes: PromotionType[] = [
  "COUPON",
  "QR",
  "HAPPY_HOUR",
  "DAY_OFFER",
  "MONTH_OFFER",
  "YEAR_OFFER",
  "AUTO_OFFER",
];

const discountTypes: DiscountType[] = ["PERCENT", "FIXED_LKR", "FREE_ITEM"];

const targetTypes: PromotionTargetType[] = [
  "ALL",
  "CATEGORY",
  "SUBCATEGORY",
  "PRODUCT",
];

const emptyForm: PromotionPayload = {
  title: "",
  description: "",
  promotionType: "COUPON",
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscountLkr: null,
  minOrderLkr: 0,
  couponCode: "",
  qrCode: "",
  startsAt: "",
  endsAt: "",
  happyHourStart: "",
  happyHourEnd: "",
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  usageLimit: null,
  stackable: false,
  isActive: true,
  targets: [{ targetType: "ALL", targetId: null }],
};

function localDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );

  return offsetDate.toISOString().slice(0, 16);
}

function toIsoOrNull(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

function formatDiscount(promotion: Promotion) {
  if (promotion.discountType === "PERCENT") {
    return `${promotion.discountValue}%`;
  }

  if (promotion.discountType === "FIXED_LKR") {
    return `LKR ${promotion.discountValue.toLocaleString()}`;
  }

  return "Free item";
}

export default function AdminPromotions() {
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [form, setForm] = useState<PromotionPayload>(emptyForm);
  const [targetType, setTargetType] = useState<PromotionTargetType>("ALL");
  const [targetId, setTargetId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  async function verifyAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      navigate("/account");
      return false;
    }

    return true;
  }

  async function loadData() {
    try {
      setIsLoading(true);
      setErrorText("");

      if (!(await verifyAdmin())) return;

      const [promotionRows, categoryRows, subcategoryRows, productRows] =
        await Promise.all([
          getAdminPromotions(),
          getAdminCategories(),
          getAdminSubcategories(),
          getAdminProducts(),
        ]);

      setPromotions(promotionRows);
      setCategories(categoryRows);
      setSubcategories(subcategoryRows);
      setProducts(productRows);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Could not load promotions.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const targetOptions = useMemo(() => {
    if (targetType === "CATEGORY") {
      return categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      }));
    }

    if (targetType === "SUBCATEGORY") {
      return subcategories.map((subcategory) => ({
        value: String(subcategory.id),
        label: `${
          categories.find((category) => category.id === subcategory.categoryId)
            ?.name || "Category"
        } › ${subcategory.name}`,
      }));
    }

    if (targetType === "PRODUCT") {
      return products.map((product) => ({
        value: product.id,
        label: product.name,
      }));
    }

    return [];
  }, [targetType, categories, subcategories, products]);

  function resetForm() {
    setForm(emptyForm);
    setTargetType("ALL");
    setTargetId("");
  }

  function editPromotion(promotion: Promotion) {
    const firstTarget = promotion.targets[0] || {
      targetType: "ALL" as const,
      targetId: null,
    };

    setForm({
      id: promotion.id,
      title: promotion.title,
      description: promotion.description || "",
      promotionType: promotion.promotionType,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      maxDiscountLkr: promotion.maxDiscountLkr,
      minOrderLkr: promotion.minOrderLkr,
      couponCode: promotion.couponCode || "",
      qrCode: promotion.qrCode || "",
      startsAt: localDateTime(promotion.startsAt),
      endsAt: localDateTime(promotion.endsAt),
      happyHourStart: promotion.happyHourStart || "",
      happyHourEnd: promotion.happyHourEnd || "",
      activeDays: promotion.activeDays,
      usageLimit: promotion.usageLimit,
      stackable: promotion.stackable,
      isActive: promotion.isActive,
      targets: promotion.targets,
    });

    setTargetType(firstTarget.targetType);
    setTargetId(firstTarget.targetId || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorText("");
      setMessage("");

      await savePromotion({
        ...form,
        startsAt: toIsoOrNull(form.startsAt),
        endsAt: toIsoOrNull(form.endsAt),
        targets: [
          {
            targetType,
            targetId: targetType === "ALL" ? null : targetId,
          },
        ],
      });

      setMessage("Promotion saved successfully.");
      resetForm();
      await loadData();
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Promotion could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Page>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              PROMOTION MANAGEMENT
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Offers, coupons & QR campaigns
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              Create product-wise, category-wise, subcategory-wise, coupon, QR,
              happy-hour, day, month, and year offers.
            </p>
          </div>

          <Link
            to="/admin/dashboard"
            className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
          >
            Back to dashboard
          </Link>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
            Loading promotion management...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <form
              onSubmit={handleSave}
              className="space-y-5 rounded-3xl border border-black/10 bg-white/55 p-5 shadow-sm backdrop-blur sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-brand-ink">
                  {form.id ? "Edit promotion" : "Add promotion"}
                </h2>

                {form.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-brand-ink/15 bg-white/60 px-4 py-2 text-xs font-semibold text-brand-ink"
                  >
                    New promotion
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="input-admin"
                    placeholder="Weekend Jar Cake Offer"
                  />
                </Field>

                <Field label="Promotion type">
                  <select
                    value={form.promotionType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        promotionType: e.target.value as PromotionType,
                      }))
                    }
                    className="input-admin"
                  >
                    {promotionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="input-admin min-h-[90px]"
                  placeholder="Offer shown internally for admin reference."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Discount type">
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        discountType: e.target.value as DiscountType,
                      }))
                    }
                    className="input-admin"
                  >
                    {discountTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Value">
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        discountValue: Number(e.target.value || 0),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Max discount">
                  <input
                    type="number"
                    value={form.maxDiscountLkr || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maxDiscountLkr: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="input-admin"
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Min order">
                  <input
                    type="number"
                    value={form.minOrderLkr}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        minOrderLkr: Number(e.target.value || 0),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Coupon">
                  <div className="flex gap-2">
                    <input
                      value={form.couponCode || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          couponCode: e.target.value.toUpperCase(),
                        }))
                      }
                      className="input-admin uppercase"
                      placeholder="BAURA10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          couponCode: generateCouponCode("BAURA"),
                        }))
                      }
                      className="rounded-2xl bg-brand-ink px-3 py-2 text-xs font-semibold text-brand-bg"
                    >
                      Gen
                    </button>
                  </div>
                </Field>

                <Field label="QR code">
                  <input
                    value={form.qrCode || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        qrCode: e.target.value.toUpperCase(),
                      }))
                    }
                    className="input-admin uppercase"
                    placeholder="QRWEEKEND"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts">
                  <input
                    type="datetime-local"
                    value={form.startsAt || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startsAt: e.target.value,
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Ends">
                  <input
                    type="datetime-local"
                    value={form.endsAt || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        endsAt: e.target.value,
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Happy hour start">
                  <input
                    type="time"
                    value={form.happyHourStart || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        happyHourStart: e.target.value,
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Happy hour end">
                  <input
                    type="time"
                    value={form.happyHourEnd || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        happyHourEnd: e.target.value,
                      }))
                    }
                    className="input-admin"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Offer scope">
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as PromotionTargetType);
                      setTargetId("");
                    }}
                    className="input-admin"
                  >
                    {targetTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Scope item">
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    disabled={targetType === "ALL"}
                    className="input-admin disabled:cursor-not-allowed disabled:bg-black/5"
                  >
                    <option value="">
                      {targetType === "ALL" ? "All products" : "Select target"}
                    </option>

                    {targetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Usage limit">
                  <input
                    type="number"
                    value={form.usageLimit || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimit: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-ink">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Active
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-ink">
                  <input
                    type="checkbox"
                    checked={form.stackable}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        stackable: e.target.checked,
                      }))
                    }
                  />
                  Stackable
                </label>
              </div>

              <button
                type="submit"
                disabled={isSaving || (targetType !== "ALL" && !targetId)}
                className="w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/45"
              >
                {isSaving ? "Saving..." : "Save promotion"}
              </button>
            </form>

            <aside className="space-y-4 rounded-3xl border border-black/10 bg-white/55 p-5 shadow-sm backdrop-blur sm:p-6">
              <h2 className="text-xl font-semibold text-brand-ink">
                Promotions
              </h2>

              <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
                {promotions.map((promotion) => (
                  <article
                    key={promotion.id}
                    className="rounded-2xl border border-black/10 bg-white/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-brand-ink">
                          {promotion.title}
                        </h3>

                        <p className="mt-1 text-xs text-brand-ink/60">
                          {promotion.promotionType.replaceAll("_", " ")} •{" "}
                          {formatDiscount(promotion)}
                        </p>

                        {(promotion.couponCode || promotion.qrCode) && (
                          <p className="mt-2 text-xs font-semibold text-brand-ink/70">
                            {promotion.couponCode || promotion.qrCode}
                          </p>
                        )}
                      </div>

                      <span
                        className={[
                          "rounded-full border px-2 py-1 text-[11px] font-semibold",
                          promotion.isActive
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700",
                        ].join(" ")}
                      >
                        {promotion.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => editPromotion(promotion)}
                      className="mt-3 rounded-xl border border-brand-ink/20 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-white"
                    >
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </Page>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold tracking-widest text-brand-ink/60">
        {label.toUpperCase()}
      </span>

      {children}
    </label>
  );
}
