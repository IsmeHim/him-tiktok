'use client';

import React, { useState } from 'react';
import { History, CheckCircle2, AlertTriangle, Clock, RefreshCw, FileVideo, Trash2, Copy, Check } from 'lucide-react';
import { formatDate, formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

export interface PostItem {
  _id: string;
  title: string;
  videoFileName: string;
  videoFileSize?: number;
  publishId?: string;
  status: 'PENDING' | 'PROCESSING' | 'UPLOADED_TO_DRAFT' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
}

interface PostHistoryTableProps {
  posts: PostItem[];
  loading: boolean;
  onRefresh: () => void;
}

export default function PostHistoryTable({
  posts,
  loading,
  onRefresh,
}: PostHistoryTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const copyError = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('คัดลอกข้อความ Error แล้ว 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (postId?: string) => {
    const isAllFailed = !postId;
    if (!confirm(isAllFailed ? 'ต้องการลบประวัติที่ Failed ทั้งหมดใช่หรือไม่?' : 'ต้องการลบประวัติรายการนี้ใช่หรือไม่?')) {
      return;
    }

    setDeletingId(postId || 'all');
    try {
      const url = postId ? `/api/tiktok/posts?id=${postId}` : '/api/tiktok/posts';
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        toast.success(isAllFailed ? 'ลบรายการที่ Failed ทั้งหมดแล้ว' : 'ลบประวัติเรียบร้อยแล้ว');
        onRefresh();
      } else {
        toast.error('ไม่สามารถลบประวัติได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: PostItem['status']) => {
    switch (status) {
      case 'UPLOADED_TO_DRAFT':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Success / Ready</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Processing</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const hasFailedPosts = posts.some((p) => p.status === 'FAILED');

  return (
    <div className="glass-panel p-6 sm:p-7 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#fe2c55] to-[#00f2fe] p-[1.5px] flex items-center justify-center">
            <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
              <History className="w-4 h-4 text-[#fe2c55]" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              ประวัติการส่งคลิป
            </h2>
            <p className="text-xs text-slate-400">
              บันทึกรายการวิดีโอที่ถูกส่งเข้า TikTok ทั้งหมด
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasFailedPosts && (
            <button
              onClick={() => handleDelete()}
              disabled={deletingId === 'all'}
              className="px-3 py-2 rounded-xl text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างรายการที่ Failed ทั้งหมด</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="pb-3 px-3">ไฟล์วิดีโอ</th>
              <th className="pb-3 px-3">Caption & แท็ก</th>
              <th className="pb-3 px-3">Publish ID (TikTok)</th>
              <th className="pb-3 px-3">สถานะ & Error</th>
              <th className="pb-3 px-3">เวลาที่ส่ง</th>
              <th className="pb-3 px-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโหลดประวัติ...</span>
                    </div>
                  ) : (
                    'ยังไม่มีประวัติการส่งคลิป'
                  )}
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr
                  key={post._id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                        <FileVideo className="w-4 h-4" />
                      </div>
                      <div className="max-w-[150px] truncate">
                        <div className="font-semibold text-white truncate" title={post.videoFileName}>
                          {post.videoFileName}
                        </div>
                        {post.videoFileSize ? (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {formatBytes(post.videoFileSize)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3">
                    <div className="max-w-[240px] truncate text-slate-300" title={post.title}>
                      {post.title || <span className="text-slate-600 italic">ไม่มีแคปชั่น</span>}
                    </div>
                  </td>

                  <td className="py-4 px-3 font-mono text-[11px] text-slate-400">
                    {post.publishId ? (
                      <span className="text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 truncate max-w-[160px] inline-block" title={post.publishId}>
                        {post.publishId}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-4 px-3">
                    <div className="space-y-1">
                      <div>{getStatusBadge(post.status)}</div>
                      {post.status === 'FAILED' && post.errorMessage && (
                        <div className="flex items-center space-x-1.5 max-w-[220px]">
                          <span className="text-[10px] text-rose-400 truncate" title={post.errorMessage}>
                            {post.errorMessage}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyError(post._id, post.errorMessage!)}
                            className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
                            title="คัดลอก Error"
                          >
                            {copiedId === post._id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-3 font-mono text-slate-400 text-[11px]">
                    {formatDate(post.createdAt)}
                  </td>

                  <td className="py-4 px-3 text-right">
                    <button
                      type="button"
                      disabled={deletingId === post._id}
                      onClick={() => handleDelete(post._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="ลบประวัตินี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
