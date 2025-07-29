
import React, { useEffect, Fragment } from 'react';

interface ModalProps {
    id: string;
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'md:max-w-lg' | 'md:max-w-xl' | 'md:max-w-2xl' | 'md:max-w-3xl' | 'md:max-w-4xl' | 'md:max-w-5xl' | 'md:max-w-6xl';
    isOpen: boolean;
    onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ id, title, icon, children, footer, size = 'md:max-w-lg', isOpen, onClose }) => {
    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [isOpen]);

    // Handle Esc key to close
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const modalPanelClasses = `
        relative flex flex-col w-full max-h-[95vh]
        md:w-full md:max-h-[90vh]
        bg-white dark:bg-gray-800 
        rounded-t-2xl md:rounded-xl shadow-2xl 
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-y-0 opacity-100 md:scale-100' : 'translate-y-full opacity-0 md:scale-95 md:translate-y-0'}
        ${size}
    `;

    if (!isOpen) return null;

    return (
        <div
            id={id}
            aria-labelledby="modal-title"
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
        >
            {/* Overlay */}
            <div className={`fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
            
            {/* Modal Panel */}
            <div className={modalPanelClasses}>
                {/* Modal Header */}
                <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center">
                        {icon && (
                            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 mr-4">
                                {icon}
                            </div>
                        )}
                        <h3 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -mr-2 -mt-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        aria-label="Fermer"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
                    {children}
                </div>
                
                {/* Modal Footer */}
                {footer && (
                    <div className="flex items-center p-4 border-t border-gray-200 rounded-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
