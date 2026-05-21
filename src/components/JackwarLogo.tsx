import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function JackwarLogo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-28 h-28",
    xl: "w-44 h-44"
  };

  const scale = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Golden Jaguar circular shield container */}
      <svg 
        id="jackwar-mascot-logo"
        viewBox="0 0 512 512" 
        className={`${scale} drop-shadow-[0_0_15px_rgba(234,179,8,0.25)] transition-transform duration-300 hover:scale-105`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Shield and Rays */}
        <circle cx="256" cy="256" r="230" stroke="#EAB308" strokeWidth="4" strokeDasharray="16 12 animate-spin" />
        <circle cx="256" cy="256" r="216" stroke="#CA8A04" strokeWidth="2" />
        <circle cx="256" cy="256" r="204" stroke="#854D0E" strokeWidth="1" strokeDasharray="4 8" />
        
        {/* Sharp Shield Rays surrounding the circle (Golden points) */}
        <path d="M256 16 L272 40 L240 40 Z" fill="#EAB308" />
        <path d="M256 496 L272 472 L240 472 Z" fill="#EAB308" />
        <path d="M16 256 L40 272 L40 240 Z" fill="#EAB308" />
        <path d="M496 256 L472 272 L472 240 Z" fill="#EAB308" />
        
        {/* Diagonal Rays */}
        <path d="M86 86 L110 102 L98 114 Z" fill="#CA8A04" />
        <path d="M426 86 L402 102 M414 114" fill="#CA8A04" />
        <path d="M86 426 L110 410 L98 398 Z" fill="#CA8A04" />
        <path d="M426 426 L402 410 L414 398 Z" fill="#CA8A04" />

        {/* Inner Shield Backdrop */}
        <path 
          d="M130 160 C130 160 256 100 256 100 C256 100 382 160 382 160 C382 280 256 412 256 412 C256 412 130 280 130 160 Z" 
          fill="#171717" 
          stroke="#EAB308" 
          strokeWidth="6" 
          strokeLinejoin="round"
        />

        {/* Shield inner highlight overlay */}
        <path 
          d="M148 174 C148 174 256 122 256 122 C256 122 364 174 364 174 C364 266 256 380 256 380 C256 380 148 266 148 174 Z" 
          fill="#1E1B4B" 
          opacity="0.3" 
        />

        {/* Golden Cheetah / Leopard Head roaring */}
        {/* Main head silhouette */}
        <path 
          d="M190 280 C180 240 210 180 260 170 C310 160 350 190 356 220 C362 250 340 280 340 280 C340 280 355 295 350 310 C340 330 310 335 300 315 L285 305 C285 305 275 325 256 325 C235 325 230 310 230 310" 
          fill="#EAB308" 
          stroke="#78350F" 
          strokeWidth="4"
        />

        {/* Leopard Spots (Jaguar pattern in dark copper brown) */}
        <circle cx="215" cy="225" r="8" fill="#451A03" />
        <circle cx="230" cy="210" r="10" fill="#451A03" />
        <circle cx="255" cy="195" r="9" fill="#451A03" />
        <circle cx="280" cy="195" r="9" fill="#451A51" />
        <circle cx="310" cy="215" r="10" fill="#451A03" />
        <circle cx="325" cy="235" r="8" fill="#451A03" />
        
        <path d="M 230,230 A 10,10 0 1,1 245,245" stroke="#451A03" strokeWidth="4" fill="none" />
        <path d="M 270,220 A 12,12 0 1,1 285,238" stroke="#451A03" strokeWidth="4" fill="none" />
        <path d="M 295,240 A 10,10 0 1,1 310,255" stroke="#451A03" strokeWidth="4" fill="none" />

        {/* Angry glowing white/gold eyes */}
        <path d="M260 210 C270 210 278 206 280 204 C272 202 264 206 260 210 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1" />
        <circle cx="274" cy="206" r="2.5" fill="#FACC15" />
        
        {/* Snout and Roaring Mouth */}
        <path d="M290 260 C310 260 330 255 335 250 C325 245 310 245 290 250 Z" fill="#5F1616" stroke="#451A03" strokeWidth="2" />
        {/* Sharp white fangs */}
        <path d="M298 250 L303 260 L308 250 Z" fill="#FFFFFF" />
        <path d="M312 249 L317 261 L322 249 Z" fill="#FFFFFF" />
        <path d="M326 248 L330 258 L334 248 Z" fill="#FFFFFF" />
        
        {/* Open Bottom Jaw */}
        <path d="M285 285 C310 295 330 286 335 277 L310 270 Z" fill="#EAB308" stroke="#78350F" strokeWidth="3" />
        <path d="M305 282 L310 272 L315 282 Z" fill="#FFFFFF" />

        {/* Cheek and Fur highlights */}
        <path d="M190 280 L210 260 L205 285 L225 270" stroke="#FEF08A" strokeWidth="4" strokeLinecap="round" />
        <path d="M340 280 L355 264 L348 290 L362 276" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
      </svg>
      
      {showText && (
        <div className="mt-2 text-center">
          <span className="block font-black tracking-wider text-xl bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent uppercase font-sans">
            JACKWARCLUB
          </span>
          <span className="block text-[9px] text-zinc-400 uppercase tracking-widest font-mono font-bold">
            PREMIUM REAL-TIME PLATFORM
          </span>
        </div>
      )}
    </div>
  );
}
