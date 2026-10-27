import { useNavigation } from "react-router";

/** True while the form whose hidden `intent` field holds `intent` is submitting. */
export function useSubmitting(intent: string): boolean {
  const navigation = useNavigation();
  return navigation.state !== "idle" && navigation.formData?.get("intent") === intent;
}
