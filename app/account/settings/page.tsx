import { redirect } from "next/navigation";

/** Settings is an account-level alias of Profile & Account. */
export default function AccountSettingsRedirectPage() {
  redirect("/account#login-security");
}
