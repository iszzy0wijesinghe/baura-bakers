/** @format */

import { getStorefrontBootstrap } from "./storefrontApi";

export type {
  SiteModeKey,
  SiteModeRow,
} from "./storefrontApi";

export async function getActiveSiteMode() {
  const storefront = await getStorefrontBootstrap();

  return storefront.activeSiteMode;
}
