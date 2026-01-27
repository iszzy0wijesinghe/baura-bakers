
export const CART_KEY = "baura_cart";

export function clearCartStorage() {
  localStorage.removeItem(CART_KEY);
  sessionStorage.removeItem(CART_KEY);
}
