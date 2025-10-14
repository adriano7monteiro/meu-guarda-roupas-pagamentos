// Web-only file - mock implementations for web platform
import React from 'react';

export const StripeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useStripe = () => ({
  initPaymentSheet: null,
  presentPaymentSheet: null,
});
