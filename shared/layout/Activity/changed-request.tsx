"use client";

import React from "react";

interface StayTunedProps {
    featureTitle?: string;
}

export const StayTuned: React.FC<StayTunedProps> = ({
    featureTitle = "New Ticket",
}) => {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter animate-in fade-in slide-in-from-bottom-3 duration-500">
                    Stay Tuned!
                </h1>

                <p className="text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
                    We&apos;re working hard to bring you the{" "}
                    <span className="text-[#1E4637] font-bold">
                        {featureTitle}
                    </span>{" "}
                    features.
                    <br />
                    This page is currently under construction.
                </p>

                {/* Animated Loading Dots */}
                <div className="mt-10 flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E4637] animate-bounce" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E4637] animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E4637] animate-bounce [animation-delay:-0.3s]" />
                </div>

                <div className="mt-8 text-sm text-gray-400">
                    Please check back soon.
                </div>
            </div>
        </div>
    );
};