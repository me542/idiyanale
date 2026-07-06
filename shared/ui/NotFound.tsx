'use client';

// import React from 'react';
import Footer from '@/shared/layout/footer';

interface NotFoundProps {
    message?: string;
}

export default function NotFound({ 
    message = "The page you're looking for doesn't exist or has been moved.",
}: NotFoundProps) {
    return (
        <div className="flex flex-col w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                
                {/* Animated Background Circles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
                </div>

                {/* 404 Number with Glow Effect */}
                <div className="relative mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 blur-2xl">
                            <div className="text-8xl md:text-9xl font-black text-teal-400 opacity-30">
                                404
                            </div>
                        </div>
                        
                        {/* Main 404 text */}
                        <div className="relative text-8xl md:text-9xl font-black bg-linear-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
                            404
                        </div>
                        
                        {/* Decorative line */}
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-linear-to-r from-teal-400 to-teal-600 rounded-full" />
                    </div>
                </div>
                
                {/* Error Icon with Animation */}
                <div className="mb-6 animate-bounce-slow">
                    <div className="w-20 h-20 mx-auto bg-linear-to-br from-teal-50 to-teal-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                
                {/* Main Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-500">
                    Page Not Found
                </h1>
                
                {/* Description Message */}
                <p className="text-base md:text-lg text-gray-500 max-w-md leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {message}
                </p>

                {/* Helpful Hint */}
                <div className="mt-6 text-sm text-gray-400 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <p>Check the URL or navigate using the sidebar menu</p>
                </div>

                {/* Animated Loading Dots */}
                <div className="mt-10 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
                </div>

                {/* Decorative Bottom Border */}
                <div className="mt-12 w-24 h-0.5 bg-linear-to-r from-transparent via-teal-300 to-transparent" />

                {/* Footer */}
                <div className="mt-12 opacity-40 w-full">
                    <Footer isExpanded={false} />
                </div>
            </div>
        </div>
    );
}