const BAURA_LAT = 6.832636909688839;
const BAURA_LNG = 79.99981842449598;

type VercelRequest = {
  method?: string;
  body?: {
    lat?: number;
    lng?: number;
  };
};

type VercelResponse = {
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Google Routes API key missing." });
  }

  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "Invalid delivery location." });
  }

  try {
    const googleRes = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: BAURA_LAT,
                longitude: BAURA_LNG,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: lat,
                longitude: lng,
              },
            },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          computeAlternativeRoutes: false,
          units: "METRIC",
        }),
      },
    );

    const data = await googleRes.json();

    if (!googleRes.ok) {
      return res.status(googleRes.status).json({
        error: "Could not calculate delivery distance.",
        details: data,
      });
    }

    const route = data?.routes?.[0];
    const distanceMeters = Number(route?.distanceMeters || 0);
    const duration = String(route?.duration || "");

    if (!distanceMeters) {
      return res.status(400).json({
        error: "No route distance found.",
      });
    }

    const distanceKm = Number((distanceMeters / 1000).toFixed(2));

    return res.status(200).json({
      distanceMeters,
      distanceKm,
      duration,
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not calculate delivery distance.",
    });
  }
}