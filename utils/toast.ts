import { ToastRef } from '@/components/Toast';
import React from 'react';

// Create a global ref to access the Toast component
export const toastRef = React.createRef<ToastRef>();

// Helper function to show a toast message
export const showToast = (message: string, duration?: number) => {
    if (toastRef.current) {
        toastRef.current.show(message, duration);
    } else {
        console.warn('Toast ref is not set. Message:', message);
    }
};
