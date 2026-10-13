'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sparkles, LogOut, Radio, User } from 'lucide-react';

interface NavbarProps {
  user: {
    email: string;
    name?: string;
  } | null;
  tiktokConnected: boolean;
  tiktokDisplayName?: string;
}

export default function Navbar({ user, tiktokConnected, tiktokDisplayName }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('ออกจากระบบเรียบร้อย');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#09090b]/75 border-b border-white/10 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#fe2c55] to-[#00f2fe] p-[1.5px] shadow-lg shadow-[#00f2fe]/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#00f2fe] group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-lg tracking-tight flex items-center space-x-1">
              <span className="text-white">TikTok</span>
              <span className="text-[#00f2fe]">Draft</span>
              <span className="text-[#fe2c55] hidden xs:inline">Pulse</span>
            </div>
            <div className="hidden sm:block text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Phase 1 Enterprise Studio
            </div>
          </div>
        </Link>

        {/* Right side: Database & TikTok Status pill & User Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* MongoDB Database Badge (Dot only on mobile, full text on desktop) */}
          <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs shadow-inner" title="MongoDB Atlas Connected">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="hidden md:inline text-slate-400 text-[11px]">DB:</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400">
              <span className="md:hidden">DB</span>
              <span className="hidden md:inline">Atlas Connected</span>
            </span>
          </div>

          {/* TikTok Connection Badge (Truncated text with ellipsis to prevent vertical wrap) */}
          <div
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs shadow-inner max-w-[130px] sm:max-w-[200px]"
            title={tiktokConnected ? tiktokDisplayName || 'Connected' : 'Disconnected'}
          >
            <div className="relative flex h-2 w-2 shrink-0">
              {tiktokConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 shrink-0 ${
                  tiktokConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </div>
            <span
              className={`font-semibold text-[10px] sm:text-[11px] truncate ${
                tiktokConnected ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {tiktokConnected ? tiktokDisplayName || 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              title="ออกจากระบบ"
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center space-x-1.5 cursor-pointer text-xs shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
