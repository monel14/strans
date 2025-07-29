
import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    icon: string;
    gradient: string; // e.g., 'from-blue-600 to-purple-600'
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, gradient }) => (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white relative overflow-hidden mb-6 shadow-lg`}>
        <div className="relative z-10">
            <div className="flex items-center mb-1">
                <i className={`fas ${icon} text-2xl mr-4`}></i>
                <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <p className="text-sm opacity-90 ml-10">{subtitle}</p>
        </div>
        {/* Decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-8 -translate-x-8"></div>
    </div>
);
