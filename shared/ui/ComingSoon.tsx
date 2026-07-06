'use client';
import React from 'react';
import Footer from '../layout/footer';

interface ComingSoonProps {
    featureTitle: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ 
    featureTitle, 
}) => {
    return (
        <div className="flex flex-col w-full h-[calc(100vh-120px)]">
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter animate-in fade-in slide-in-from-bottom-3 duration-500">
                    Stay Tuned!
                </h1>
                
                <p className="text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
                    We&apos;re working hard to bring you the <span className="text-[#1E4637] font-bold">{featureTitle}</span> features. 
                    This page is currently under construction.
                </p>

                {/* Animated Loading Dots */}
                <div className="mt-10 flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E4637] animate-bounce" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E4637] animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E4637] animate-bounce [animation-delay:-0.3s]" />
                </div>

                {/* Footer nested inside the centered stack */}
                <div className="mt-12 opacity-50">
                    <Footer isExpanded={true} />
                </div>
            </div>
        </div>
    );
};