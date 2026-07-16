import { StripeProvider } from '@stripe/stripe-react-native';
import type { ReactElement } from 'react';

const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';

const STRIPE_MERCHANT_IDENTIFIER =
  process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER?.trim() ||
  'merchant.com.sitguru';

const STRIPE_URL_SCHEME =
  process.env.EXPO_PUBLIC_STRIPE_URL_SCHEME?.trim() ||
  'sitgurumobile';

type SitGuruPaymentsProviderProps = {
  children: ReactElement | ReactElement[];
};

export default function SitGuruPaymentsProvider({
  children,
}: SitGuruPaymentsProviderProps) {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={STRIPE_MERCHANT_IDENTIFIER}
      urlScheme={STRIPE_URL_SCHEME}>
      {children}
    </StripeProvider>
  );
}