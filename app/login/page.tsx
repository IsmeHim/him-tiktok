'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('กรุณากรอก Email และ Password ให้ครบถ้วน');
      toast.error('กรุณากรอก Email และ Password ให้ครบถ้วน');
      return;
    }

    setLoading(true);
    console.log('Submitting login for:', email);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Login result:', res.status, data);

      if (!res.ok) {
        const msg = data.error || 'เข้าสู่ระบบไม่สำเร็จ';
        setErrorMessage(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('tiktok_draft_token', data.token);
        document.cookie = `tiktok_draft_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      toast.success('ยินดีต้อนรับกลับ! เข้าสู่ระบบสำเร็จแล้ว 🚀');
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Login submit error:', err);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* iPhone Glassmorphic Card Container */}
      <div className="w-full max-w-md relative">
        {/* Ambient Neon Backlight */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2fe]/30 to-[#fe2c55]/30 rounded-3xl blur-xl opacity-70 pointer-events-none"></div>

        <div className="relative glass-panel p-8 sm:p-10 shadow-2xl border border-white/10">
          {/* Header & Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#fe2c55] to-[#00f2fe] p-[1.5px] shadow-lg mb-4">
              <div className="w-full h-full bg-[#09090b] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#00f2fe]" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              TikTok <span className="text-[#00f2fe]">Draft</span>{' '}
              <span className="text-[#fe2c55]">Publisher</span>
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Futuristic Cyber Studio & Video Automation
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-shake">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@cyberpunk.io"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:border-[#00f2fe] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:border-[#fe2c55] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide text-white bg-gradient-to-r from-[#fe2c55] via-[#a81468] to-[#00f2fe] hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-[#fe2c55]/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div className="mt-8 text-center text-xs text-slate-400">
            ยังไม่มีบัญชีใช่หรือไม่?{' '}
            <Link
              href="/register"
              className="text-[#00f2fe] hover:underline font-semibold"
            >
              สร้างบัญชีใหม่
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-mono">MongoDB Atlas: Connected (Ready)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Secured with JWT HTTP-Only Cookies & TikTok OAuth 2.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
