'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { App } from 'antd';

function AuthErrorHandlerInner() {
  const { notification } = App.useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const authErr = searchParams.get('auth_err');
    
    if (authErr === 'forbidden') {
      notification.error({
        message: 'Access Denied',
        description: 'You do not have the required permissions to access this area.',
        placement: 'topRight',
        duration: 5,
      });

      // Clear the param from URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, notification]);

  return null;
}

export function AuthErrorHandler() {
  return (
    <Suspense fallback={null}>
      <AuthErrorHandlerInner />
    </Suspense>
  );
}
