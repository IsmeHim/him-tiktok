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
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fe2c55] to-[#00f2fe] p-[1.5px] shadow-lg shadow-[#00f2fe]/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#00f2fe] group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center space-x-1">
              <span className="text-white">TikTok</span>
              <span className="text-[#00f2fe]">Draft</span>
              <span className="text-[#fe2c55]">Pulse</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Phase 1 Enterprise Studio
            </div>
          </div>
        </Link>

        {/* Right side: Database & TikTok Status pill & User Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* MongoDB Database Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs shadow-inner">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="hidden sm:inline text-slate-300 font-medium text-[11px]">
              DB:
            </span>
            <span className="font-semibold text-[11px] text-emerald-400">
              Atlas Connected
            </span>
          </div>

          {/* TikTok Connection Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs shadow-inner">
            <div className="relative flex h-2 w-2">
              {tiktokConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  tiktokConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </div>
            <span className="hidden sm:inline text-slate-300 font-medium text-[11px]">
              TikTok:
            </span>
            <span
              className={`font-semibold text-[11px] ${
                tiktokConnected ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {tiktokConnected ? tiktokDisplayName || 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* User Profile Info & Logout */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">
                  {user.name || 'Creator'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
