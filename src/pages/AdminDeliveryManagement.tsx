import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { supabase } from "../lib/supabase";

type DeliverySlot = {
  id: string;
  slot_date: string;
  slot_label: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_available: boolean;
};

export default function AdminDeliveryManagement() {
  const navigate = useNavigate();

  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [errorText, setErrorText] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slot_date: "",
    slot_label: "Morning Delivery",
    start_time: "09:00",
    end_time: "12:00",
    max_orders: 5,
  });

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

  async function loadSlots() {
    setErrorText("");

    const isAdmin = await verifyAdmin();
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("delivery_slots")
      .select("*")
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      setErrorText(error.message);
      return;
    }

    setSlots((data || []) as DeliverySlot[]);
  }

  useEffect(() => {
    loadSlots();
  }, []);

  async function createSlot() {
    if (!form.slot_date) {
      setErrorText("Please select a delivery date.");
      return;
    }

    setSaving(true);
    setErrorText("");

    const { error } = await supabase.from("delivery_slots").insert({
      slot_date: form.slot_date,
      slot_label: form.slot_label,
      start_time: form.start_time,
      end_time: form.end_time,
      max_orders: Number(form.max_orders || 0),
      is_available: true,
    });

    setSaving(false);

    if (error) {
      setErrorText(error.message);
      return;
    }

    loadSlots();
  }

  async function toggleSlot(slot: DeliverySlot) {
    const { error } = await supabase
      .from("delivery_slots")
      .update({ is_available: !slot.is_available })
      .eq("id", slot.id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    loadSlots();
  }

  return (
    <Page>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-black/10 bg-white/55 p-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-brand-ink/55">
              DELIVERY MANAGEMENT
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-brand-ink">
              Delivery schedule
            </h1>
            <p className="mt-2 text-sm text-brand-ink/65">
              Create available delivery dates and time sessions for customers.
            </p>
          </div>

          <Link
            to="/admin/dashboard"
            className="rounded-2xl border border-brand-ink/20 bg-white/60 px-5 py-3 text-sm font-semibold text-brand-ink"
          >
            Dashboard
          </Link>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        <section className="rounded-3xl border border-black/10 bg-white/55 p-5">
          <h2 className="text-lg font-semibold text-brand-ink">
            Add delivery slot
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <input
              type="date"
              value={form.slot_date}
              onChange={(e) =>
                setForm((p) => ({ ...p, slot_date: e.target.value }))
              }
              className="input-order"
            />

            <select
              value={form.slot_label}
              onChange={(e) =>
                setForm((p) => ({ ...p, slot_label: e.target.value }))
              }
              className="input-order"
            >
              <option>Morning Delivery</option>
              <option>Afternoon Delivery</option>
              <option>Evening Delivery</option>
            </select>

            <input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm((p) => ({ ...p, start_time: e.target.value }))
              }
              className="input-order"
            />

            <input
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm((p) => ({ ...p, end_time: e.target.value }))
              }
              className="input-order"
            />

            <input
              type="number"
              min={1}
              value={form.max_orders}
              onChange={(e) =>
                setForm((p) => ({ ...p, max_orders: Number(e.target.value) }))
              }
              className="input-order"
              placeholder="Max orders"
            />
          </div>

          <button
            type="button"
            onClick={createSlot}
            disabled={saving}
            className="mt-4 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
          >
            {saving ? "Saving..." : "Add slot"}
          </button>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white/55 p-5">
          <h2 className="text-lg font-semibold text-brand-ink">
            Available slots
          </h2>

          <div className="mt-4 grid gap-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/65 p-4"
              >
                <div>
                  <p className="font-semibold text-brand-ink">
                    {slot.slot_date} — {slot.slot_label}
                  </p>
                  <p className="text-sm text-brand-ink/60">
                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)} ·
                    Max {slot.max_orders} orders
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  className={[
                    "rounded-xl px-4 py-2 text-xs font-semibold",
                    slot.is_available
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  {slot.is_available ? "Available" : "Closed"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}