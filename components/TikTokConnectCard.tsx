'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Radio, RefreshCw, Unlink, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TikTokConnectCardProps {
  tiktokAccount: {
    id: string;
    openId: string;
    displayName: string;
    avatarUrl: string;
    isConnected: boolean;
    expiresAt: string;
    scope: string[];
  } | null;
  onRefresh: () => void;
}

export default function TikTokConnectCard({
  tiktokAccount,
  onRefresh,
}: TikTokConnectCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleConnect = () => {
    // Redirect to TikTok OAuth initiation route
    window.location.href = '/api/tiktok/auth';
  };

  const handleDisconnect = async () => {
    if (!confirm('คุณต้องการยกเลิกการเชื่อมต่อบัญชี TikTok นี้ใช่หรือไม่?')) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch('/api/tiktok/disconnect', { method: 'POST' });
      if (res.ok) {
        toast.success('ยกเลิกการเชื่อมต่อ TikTok สำเร็จ');
        onRefresh();
      } else {
        toast.error('ไม่สามารถยกเลิกการเชื่อมต่อได้');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-7 relative overflow-hidden group">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#00f2fe]/10 via-[#fe2c55]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-wide">
              TikTok Account Integration
            </h2>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                tiktokAccount
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {tiktokAccount ? 'Connected 🟢' : 'Disconnected 🔴'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            เชื่อมต่อบัญชี TikTok ผ่าน OAuth 2.0 (Developer Sandbox) เพื่ออนุญาตให้ระบบส่งคลิปวิดีโอเข้าสู่กล่องข้อความร่าง (Draft Inbox) ของคุณ
          </p>
        </div>

        {/* Action Button */}
        <div>
          {tiktokAccount ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>{disconnecting ? 'กำลังยกเลิก...' : 'Disconnect TikTok'}</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#fe2c55] to-[#00f2fe] hover:opacity-90 active:scale-[0.98] transition shadow-lg shadow-[#fe2c55]/20 flex items-center space-x-2 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Connect TikTok Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Details if connected */}
      {tiktokAccount && (
        <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {tiktokAccount.avatarUrl ? (
              <img
                src={tiktokAccount.avatarUrl}
                alt="Avatar"
                className="w-11 h-11 rounded-full border-2 border-[#00f2fe]/40 object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[#00f2fe]">
                TK
              </div>
            )}
            <div>
              <div className="font-semibold text-sm text-white flex items-center space-x-1.5">
                <span>{tiktokAccount.displayName || 'TikTok Creator'}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                OpenID: {tiktokAccount.openId.substring(0, 14)}...
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">Scopes Granted:</span>
            {tiktokAccount.scope?.map((sc) => (
              <span
                key={sc}
                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300"
              >
                {sc}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
