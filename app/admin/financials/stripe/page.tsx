import { permanentRedirect } from "next/navigation";

export default function AdminStripeFinancialsRedirectPage() {
  permanentRedirect("/admin/financials/payment-gateway?provider=stripe");
}
