import { useEffect, useState } from "react";
import { getCheckoutBootstrap } from "../lib/checkoutApi";

export function useDeliveryPaused() {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAvailability() {
      try {
        const checkout = await getCheckoutBootstrap();

        if (active) {
          setIsPaused(checkout.delivery_enabled === false);
        }
      } catch (error) {
        console.error("Unable to load delivery availability:", error);
      }
    }

    void checkAvailability();

    return () => {
      active = false;
    };
  }, []);

  return isPaused;
}