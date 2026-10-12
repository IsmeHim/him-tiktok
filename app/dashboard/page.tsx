'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import TikTokConnectCard from '@/components/TikTokConnectCard';
import VideoDraftUploader from '@/components/VideoDraftUploader';
import PostHistoryTable, { PostItem } from '@/components/PostHistoryTable';
import { Sparkles, Layers, ShieldCheck, Zap } from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [tiktokAccount, setTiktokAccount] = useState<any | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check query params for TikTok OAuth feedback
  useEffect(() => {
    const errorParam = searchParams.get('tiktok_error');
    const successParam = searchParams.get('tiktok_success');

    if (errorParam) {
      toast.error(`การเชื่อมต่อ TikTok ผิดพลาด: ${errorParam}`);
      router.replace('/dashboard');
    } else if (successParam === 'connected') {
      toast.success('🎉 เชื่อมต่อบัญชี TikTok สำเร็จแล้ว!');
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  // Load User profile & TikTok account status
  const fetchUserData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tiktok_draft_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth/me', { headers });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
        }
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setTiktokAccount(data.tiktokAccount);
    } catch (err) {
      console.error('Failed to load user session', err);
    } finally {
      setInitialLoading(false);
    }
  }, [router]);

  // Load Uploaded Posts History
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/tiktok/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchPosts();
  }, [fetchUserData, fetchPosts]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#00f2fe]/20 animate-ping" />
          <div className="w-16 h-16 rounded-full border-4 border-t-[#fe2c55] border-r-[#00f2fe] border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
          Initializing Cyber Studio Terminal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <Navbar
        user={user}
        tiktokConnected={!!tiktokAccount}
        tiktokDisplayName={tiktokAccount?.displayName}
      />

      {/* Main Studio Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#00f2fe] tracking-wider uppercase mb-1">
              <Zap className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>Phase 1 — Video Draft Publisher Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Creator Studio & Automation
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              อัปโหลดวิดีโอและกระจายเข้ากล่องข้อความร่าง TikTok ของคุณอย่างรวดเร็ว ปลอดภัยด้วย OAuth 2.0
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-2xl glass-panel-subtle flex items-center space-x-2.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Total Uploads</div>
                <div className="text-sm font-bold text-white font-mono">{posts.length} คลิป</div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. TikTok Account Integration Card */}
        <section>
          <TikTokConnectCard
            tiktokAccount={tiktokAccount}
            onRefresh={() => {
              fetchUserData();
              fetchPosts();
            }}
          />
        </section>

        {/* 2. Video Draft Studio Uploader Form */}
        <section>
          <VideoDraftUploader
            isTikTokConnected={!!tiktokAccount}
            onUploadSuccess={() => {
              fetchPosts();
            }}
          />
        </section>

        {/* 3. Post Draft History Table */}
        <section>
          <PostHistoryTable
            posts={posts}
            loading={loadingPosts}
            onRefresh={fetchPosts}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        TikTok Video Draft Publisher © 2026 • Built with Next.js 16 (App Router), TypeScript, Tailwind CSS & MongoDB Atlas
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-t-[#fe2c55] border-r-[#00f2fe] border-b-transparent border-l-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
            Loading Dashboard...
          </p>
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
