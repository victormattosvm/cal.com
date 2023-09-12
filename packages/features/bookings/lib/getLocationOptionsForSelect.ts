import type { LocationObject } from "@calcom/app-store/locations";
import { locationKeyToString } from "@calcom/app-store/locations";
import type { useLocale } from "@calcom/lib/hooks/useLocale";
import notEmpty from "@calcom/lib/notEmpty";

import { getLocationsWithId } from "./getLocationsWithId";

export default function getLocationsOptionsForSelect(
  locations: LocationObject[],
  t: ReturnType<typeof useLocale>["t"]
) {
  return getLocationsWithId(locations)
    .map((location) => {
      if (!location) {
        return null;
      }
      const locationString = locationKeyToString(location);

      if (typeof locationString !== "string") {
        // It's possible that location app got uninstalled
        return null;
      }

      return {
        // XYZ: is considered a namespace in i18next https://www.i18next.com/principles/namespaces and thus it get's cleaned up.
        // Beacause there can be a URL in here, simply don't translate it if it starts with http: or https:. This would allow us to keep supporting namespaces if we plan to use them
        label: locationString.search(/^https?:/) !== -1 ? locationString : t(locationString),
        value: location.id,
        inputPlaceholder: t(location.eventLocation?.attendeeInputPlaceholder || ""),
      };
    })
    .filter(notEmpty);
}
