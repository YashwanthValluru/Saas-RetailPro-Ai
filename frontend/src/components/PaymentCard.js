import React from 'react';
import { useUISettings } from '@/contexts/UISettingsContext';
import { Card } from '@/components/ui/card';

/**
 * PaymentCard - A styled Card component that applies user's border preferences
 * Use this in POS, Invoices/Reports, and Purchases pages
 */
export default function PaymentCard({ children, className = '', ...props }) {
  const { getBorderStyles } = useUISettings();
  const borderStyles = getBorderStyles();

  return (
    <Card
      className={`${borderStyles.colorClass} ${className}`}
      style={{
        borderRadius: borderStyles.borderRadius,
        borderWidth: borderStyles.borderWidth,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
