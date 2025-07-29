import React from 'react';

interface ActionCardProps {
    title: string;
    description: string;
    icon: string;
    onClick: () => void;
    colorGradient: string; // e.g., 'from-blue-500 to-purple-500'
}

export const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, onClick, colorGradient }) => {
    return (
        <button
            onClick={onClick}
            className={`
                group p-5 w-full text-left rounded-xl shadow-lg 
                bg-gradient-to-br ${colorGradient} text-white 
                transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl
                relative overflow-hidden
            `}
        >
            <div className="relative z-10">
                <div className="mb-3">
                    <i className={`fas ${icon} text-2xl opacity-80 group-hover:opacity-100 transition-opacity`}></i>
                </div>
                <h4 className="font-bold text-lg mb-1">{title}</h4>
                <p className="text-sm opacity-90">{description}</p>
            </div>
            {/* Background decoration */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full opacity-50 group-hover:opacity-80 group-hover:scale-125 transition-all duration-500"></div>
        </button>
    );
};
