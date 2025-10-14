// Web-only file - mock Stripe for web platform
import React from 'react';

// Mock StripeProvider for web
export const StripeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Mock useStripe hook for web
export const useStripe = () => {
  return {
    initPaymentSheet: async () => ({ error: { message: 'Stripe não disponível na web' } }),
    presentPaymentSheet: async () => ({ error: { message: 'Stripe não disponível na web' } }),
  };
};

export const CardField = () => null;
export const useConfirmPayment = () => null;

