'use client';

// IMPORTANT: This import must be first - patches React 19 compatibility for antd
import '@ant-design/v5-patch-for-react-19';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfigProvider, App } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import theme from '@/theme/themeConfig';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AntdRegistry>
        {/* Removed layer prop to prevent Tailwind Preflight from overriding Antd styles */}
        <StyleProvider>
          <ConfigProvider theme={theme}>
            <App>
              {children}
            </App>
          </ConfigProvider>
        </StyleProvider>
      </AntdRegistry>
    </QueryClientProvider>
  );
}
