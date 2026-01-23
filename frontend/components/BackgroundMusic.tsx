'use client';

import { useEffect, useRef } from 'react';

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. ตั้งค่าพื้นฐาน
    audio.volume = 0.4; // ปรับความดังตรงนี้ (0.0 - 1.0)
    audio.loop = true;  // เล่นวนซ้ำ

    // 2. เช็คสถานะ Mute จากที่เคยบันทึกไว้
    const savedMute = localStorage.getItem('isMuted');
    if (savedMute) {
      audio.muted = JSON.parse(savedMute);
    }

    // 3. ฟังก์ชันพยายามเล่นเสียง (พร้อมตัวกัน Error)
    const tryPlay = () => {
      // ตรวจสอบว่ามีไฟล์พร้อมเล่นหรือไม่
      if (audio.readyState >= 2 || audio.readyState === 0) {
        audio.play().catch((err) => {
          console.log("🔊 Autoplay waiting for user interaction...");
        });
      }
    };

    // 4. ตัวดักจับการคลิก (เพื่อให้ Browser ยอมให้เสียงดัง)
    const handleUserInteraction = () => {
      tryPlay();
      // เมื่อคลิกแล้ว ให้เอาตัวดักจับออก (จะได้ไม่ทำงานซ้ำ)
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };

    // --- เริ่มทำงาน ---
    
    // ลองเล่นเลย 1 รอบ (เผื่อ Browser อนุญาต)
    tryPlay();

    // เพิ่มตัวดักจับการคลิก
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    // Cleanup function (เมื่อปิดเว็บ)
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  return (
    // ซ่อน Audio Element ไว้ แต่ตั้ง ID ให้หน้าอื่นสั่งงานได้
    <audio 
      ref={audioRef} 
      id="global-bgm" 
      src="/sounds/main_bgm.wav" 
      preload="auto"
      className="hidden" 
    />
  );
}