import React from 'react';

interface FabProps {
    onClick: () => void;
    icon: string;
    ariaLabel: string;
}

export const Fab: React.FC<FabProps> = ({ onClick, icon, ariaLabel }) => {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 z-40"
        >
            <i className={`fas ${icon} text-xl`}></i>
        </button>
    );
};
