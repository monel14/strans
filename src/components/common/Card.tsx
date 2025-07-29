
import React from 'react';

interface CardProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, children, className = 'mb-6' }) => (
    <div className={`card ${className}`}>
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <i className={`fas ${icon} mr-3 text-blue-500`}></i>{title}
        </h3>
        {children}
    </div>
);
