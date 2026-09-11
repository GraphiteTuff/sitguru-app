import { useStripe } from '@stripe/stripe-react-native';

export function useSitGuruPaymentSheet() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  return {
    ready: Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()),
    initPaymentSheet,
    presentPaymentSheet,
  };
}
