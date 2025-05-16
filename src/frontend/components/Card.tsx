import React from "react";

interface CardProps {
    children: React.ReactNode;
    title?: string;
}

export default function Card({ children, title }: CardProps) {
    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                {title && (
                                    <h1 className="text-3xl font-bold text-center mb-8">
                                        {title}
                                    </h1>
                                )}
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
