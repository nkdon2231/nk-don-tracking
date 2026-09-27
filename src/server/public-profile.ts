import { ensureReady } from "@/lib/db";
import { getSettings } from "@/server/operations";

export async function publicCompany() {
  try {
    await ensureReady();
    const settings = await getSettings();
    return {
      companyName: settings.companyName,
      tagline: settings.tagline,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      website: settings.website,
      operatingHours: settings.operatingHours,
    };
  } catch {
    return null;
  }
}
