export function useSitGuruPaymentSheet() {
  return {
    ready: false,
    initPaymentSheet: async () => ({
      error: { code: 'Canceled', message: 'Payment Sheet is native only.' },
    }),
    presentPaymentSheet: async () => ({
      error: { code: 'Canceled', message: 'Payment Sheet is native only.' },
    }),
  };
}
