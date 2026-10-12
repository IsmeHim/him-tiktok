import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TikTok Video Draft Publisher | Cyberpunk Enterprise',
  description: 'Futuristic Dark-Minimal TikTok Video Draft Publisher with OAuth 2.0 and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <body className="bg-[#09090b] text-slate-100 min-h-screen selection:bg-[#fe2c55]/30 selection:text-white">
        <div className="fixed inset-0 pointer-events-none cyber-grid z-0 opacity-40" />
        <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#00f2fe]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed top-1/2 -right-40 w-96 h-96 bg-[#fe2c55]/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>

        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
            },
          }}
        />
      </body>
    </html>
  );
}
