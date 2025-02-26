import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  maxResults: number;
  highlightColor: string;
}

export const preferences = getPreferenceValues<Preferences>(); 