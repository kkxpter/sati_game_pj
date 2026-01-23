import { Chakra_Petch } from 'next/font/google';
import './globals.css';
import MatrixBg from '@/components/MatrixBg';
import BackgroundMusic from '@/components/BackgroundMusic'; // ✅ 1. เพิ่มบรรทัดนี้
import React from 'react'; 

const chakra = Chakra_Petch({ 
  subsets: ['latin', 'thai'], 
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-chakra'
});

export const metadata = {
  title: 'Cyber Stakes - Final Edition',
  description: 'Anti-Scam Simulation Game',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th">
      <body className={`${chakra.variable} font-sans bg-black h-screen w-screen overflow-hidden`}>
        
        {/* ✅ 2. วาง Component ไว้ตรงนี้ (ก่อน MatrixBg หรือ children ก็ได้) */}
        <BackgroundMusic />

        <MatrixBg />
        <main className="relative z-10 w-full h-full flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}