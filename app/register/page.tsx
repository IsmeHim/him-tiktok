'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Mail, User as UserIcon, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'การสมัครสมาชิกไม่สำเร็จ');
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('tiktok_draft_token', data.token);
        document.cookie = `tiktok_draft_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      toast.success('สมัครสมาชิกสำเร็จแล้ว! ยินดีต้อนรับเข้าสู่ระบบ 🚀');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2fe]/30 to-[#fe2c55]/30 rounded-3xl blur-xl opacity-70 pointer-events-none"></div>

        <div className="relative glass-panel p-8 sm:p-10 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00f2fe] to-[#fe2c55] p-[1.5px] shadow-lg mb-4">
              <div className="w-full h-full bg-[#09090b] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[#fe2c55]" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              สร้างบัญชีใหม่
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              เริ่มต้นส่งวิดีโอเข้า TikTok Draft แบบอัตโนมัติ
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Neon Creator"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:border-[#00f2fe] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:border-[#fe2c55] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 focus:border-[#fe2c55] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide text-white bg-gradient-to-r from-[#00f2fe] via-[#7928ca] to-[#fe2c55] hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-[#00f2fe]/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            มีบัญชีอยู่แล้วใช่หรือไม่?{' '}
            <Link
              href="/login"
              className="text-[#fe2c55] hover:underline font-semibold"
            >
              เข้าสู่ระบบทันที
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#fe2c55]" />
            <span>Mongoose DB Encryption with Bcrypt Hashing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
