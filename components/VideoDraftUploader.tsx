'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  UploadCloud,
  Film,
  X,
  Send,
  MessageSquare,
  Users,
  Bot,
  AlertCircle,
  FileVideo,
  Sparkles,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface VideoDraftUploaderProps {
  isTikTokConnected: boolean;
  onUploadSuccess: () => void;
}

export default function VideoDraftUploader({
  isTikTokConnected,
  onUploadSuccess,
}: VideoDraftUploaderProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [allowComment, setAllowComment] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [isAigc, setIsAigc] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_CAPTION_CHARS = 2200;

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp4')) {
      toast.error('กรุณาเลือกไฟล์วิดีโอนามสกุล .mp4 เท่านั้น');
      return;
    }

    // Limit to 50MB for sandbox preview and fast processing
    if (file.size > 50 * 1024 * 1024) {
      toast.warning('ไฟล์มีขนาดใหญ่กว่า 50MB การอัปโหลดอาจใช้เวลาสักครู่');
    }

    setVideoFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setVideoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTikTokConnected) {
      toast.error('กรุณาเชื่อมต่อบัญชี TikTok ก่อนส่งวิดีโอเข้า Draft');
      return;
    }

    if (!videoFile) {
      toast.error('กรุณาเลือกไฟล์วิดีโอ .mp4 ก่อน');
      return;
    }

    if (!caption.trim()) {
      toast.error('กรุณาระบุ Caption หรือ Hashtags');
      return;
    }

    setUploading(true);
    setProgress(15);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('caption', caption);
      formData.append('allowComment', String(allowComment));
      formData.append('allowDuet', String(allowDuet));
      formData.append('isAigc', String(isAigc));

      // Simulate step progress for user feedback
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 85) return prev + 15;
          return prev;
        });
      }, 400);

      const res = await fetch('/api/tiktok/upload-draft', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      const data = await res.json();

      if (!res.ok) {
        setProgress(0);
        toast.error(data.error || 'การส่งวิดีโอเข้า Draft ล้มเหลว');
        setUploading(false);
        return;
      }

      setProgress(100);
      toast.success('🎉 ส่งวิดีโอเข้า TikTok Draft เรียบร้อยแล้ว!');

      // Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#fe2c55', '#ffffff'],
        });
      } catch (e) {
        // Safe fallback
      }

      // Reset form
      removeSelectedFile();
      setCaption('');
      onUploadSuccess();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 relative">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00f2fe] to-[#fe2c55] p-[1.5px] flex items-center justify-center">
          <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
            <Film className="w-4 h-4 text-[#00f2fe]" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            TikTok Video Draft Studio
          </h2>
          <p className="text-xs text-slate-400">
            อัปโหลดไฟล์วิดีโอ MP4 และส่งเข้า Inbox Draft ของ TikTok
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Drag & Drop Zone + Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            วิดีโอต้นฉบับ (.MP4)
          </label>

          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[360px] ${
                isDragging
                  ? 'border-[#00f2fe] bg-[#00f2fe]/10 scale-[1.01]'
                  : 'border-white/15 bg-slate-900/40 hover:border-white/30 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                <UploadCloud className="w-8 h-8 text-[#00f2fe] animate-pulse" />
              </div>

              <h3 className="text-sm font-semibold text-white mb-1">
                ลากและวางไฟล์วิดีโอที่นี่
              </h3>
              <p className="text-xs text-slate-400 max-w-[220px]">
                หรือกดเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ (รองรับเฉพาะไฟล์ .mp4)
              </p>

              <div className="mt-4 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
                Full HD 1080p / 9:16 Vertical Recommended
              </div>
            </div>
          ) : (
            /* Video Preview with iOS Player Framing */
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black aspect-[9/16] max-h-[480px] mx-auto w-full max-w-[280px] shadow-2xl flex flex-col justify-between">
              {/* Dynamic Island / Top Notch style */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-24 h-4 bg-black/90 rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
                <span className="text-[9px] text-slate-400 font-mono">PREVIEW</span>
              </div>

              <video
                src={previewUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Close / Remove button */}
              <button
                type="button"
                onClick={removeSelectedFile}
                className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white border border-white/20 transition cursor-pointer"
                title="Remove video"
              >
                <X className="w-4 h-4" />
              </button>

              {/* File Info Overlay */}
              {videoFile && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                  <div className="text-xs font-semibold text-white truncate">
                    {videoFile.name}
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono">
                    {formatBytes(videoFile.size)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Caption, Hashtags & Post Settings (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Caption & Hashtag Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Caption & Hashtags
                </label>
                <span
                  className={`text-xs font-mono ${
                    caption.length > MAX_CAPTION_CHARS ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {caption.length}/{MAX_CAPTION_CHARS}
                </span>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={MAX_CAPTION_CHARS}
                rows={5}
                placeholder="เขียนคำบรรยายวิดีโอของคุณ พร้อมแท็ก #fyp #cyberpunk #nextjs ..."
                className="w-full p-4 rounded-2xl glass-input text-sm text-white placeholder-slate-500 resize-none"
              />

              {/* Quick Hashtag Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  '#เสื้อกีฬาแฟชั่น',
                  '#เผื่อใครถามว่าซื้อไหน',
                  '#รีวิวเสื้อผ้าแฟชั่น',
                  '#เสื้อแขนยาว',
                  '#เสื้อใส่สบาย',
                  '#foryou',
                  '#fyp',
                  '#TikTokแฟชั่น',
                  '#แต่งตัว',
                  '#พิกัดเสื้อผ้า',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:border-[#00f2fe]/40 border border-white/10 text-[11px] text-cyan-300 font-mono transition cursor-pointer active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                การตั้งค่าการโต้ตอบ (Interactions)
              </label>

              {/* Allow Comments */}
              <div className="flex items-center justify-between p-3.5 rounded-xl glass-panel-subtle">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-4 h-4 text-[#00f2fe]" />
                  <div>
                    <div className="text-xs font-semibold text-white">อนุญาตให้แสดงความคิดเห็น (Allow Comments)</div>
                    <div className="text-[11px] text-slate-400">ผู้ใช้งานสามารถคอมเมนต์วิดีโอนี้ได้</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowComment}
                  onChange={(e) => setAllowComment(e.target.checked)}
                  className="w-5 h-5 accent-[#00f2fe] cursor-pointer rounded"
                />
              </div>

              {/* Allow Duet */}
              <div className="flex items-center justify-between p-3.5 rounded-xl glass-panel-subtle">
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-[#fe2c55]" />
                  <div>
                    <div className="text-xs font-semibold text-white">อนุญาตให้ทำ Duet & Stitch</div>
                    <div className="text-[11px] text-slate-400">ผู้ใช้อื่นสามารถนำวิดีโอไปทำ Duet ร่วมได้</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowDuet}
                  onChange={(e) => setAllowDuet(e.target.checked)}
                  className="w-5 h-5 accent-[#fe2c55] cursor-pointer rounded"
                />
              </div>

              {/* AI Generated Content */}
              <div className="flex items-center justify-between p-3.5 rounded-xl glass-panel-subtle">
                <div className="flex items-center space-x-3">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">วิดีโอนี้สร้างด้วย AI (AI-Generated Content)</div>
                    <div className="text-[11px] text-slate-400">ติดป้ายกำกับ AI Content ตามกฎระเบียบ TikTok</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAigc}
                  onChange={(e) => setIsAigc(e.target.checked)}
                  className="w-5 h-5 accent-purple-400 cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          {/* Progress Bar (when uploading) */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono text-cyan-300">
                <span>กำลังส่งวิดีโอไปยัง TikTok Inbox...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#fe2c55] via-[#00f2fe] to-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            {!isTikTokConnected ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>กรุณาเชื่อมต่อบัญชี TikTok ด้านบนก่อน จึงจะสามารถส่งวิดีโอเข้า Draft ได้</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={uploading || !videoFile}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#00f2fe] via-[#5c24d6] to-[#fe2c55] hover:opacity-95 active:scale-[0.99] transition duration-200 flex items-center justify-center space-x-2.5 shadow-xl shadow-[#fe2c55]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเชื่อมต่อ TikTok Content Posting API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-cyan-300" />
                    <span>ส่งวิดีโอเข้าสู่ TikTok Draft (Inbox)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
