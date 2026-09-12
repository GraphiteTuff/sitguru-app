export function useSitGuruPaymentSheet() {
  return {
    ready: false,
    initPaymentSheet: async (params?: Record<string, unknown>) => {
      void params;
      return {
        error: { code: 'Canceled', message: 'Payment Sheet is native only.' },
      };
    },
    presentPaymentSheet: async () => ({
      error: { code: 'Canceled', message: 'Payment Sheet is native only.' },
    }),
  };
}
