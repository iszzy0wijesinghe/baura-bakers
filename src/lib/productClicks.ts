const KEY = "bb_product_clicks_v1";

type ClickMap = Record<string, number>;

function read(): ClickMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as ClickMap;
  } catch {
    return {};
  }
}

function write(map: ClickMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function trackProductClick(slug: string) {
  try {
    const map = read();
    map[slug] = (map[slug] ?? 0) + 1;
    write(map);
  } catch {
    // ignore if storage blocked
  }
}

export function getProductClicks(): ClickMap {
  try {
    return read();
  } catch {
    return {};
  }
}
