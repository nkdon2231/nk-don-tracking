export type RoutePoint = {
  role: "origin" | "recorded" | "current" | "destination";
  label: string;
  latitude: number;
  longitude: number;
  eventTime: string | null;
  statusLabel: string | null;
  source: "event" | "facility";
};

export type RecordedRoute = {
  liveGps: false;
  points: RoutePoint[];
};
