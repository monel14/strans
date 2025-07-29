import React from 'react';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'wave';
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
    size = 'md',
    variant = 'spinner',
    color = 'primary',
    text,
    fullScreen = false,
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const colorClasses = {
        primary: 'text-blue-500',
        secondary: 'text-gray-500',
        success: 'text-green-500',
        warning: 'text-yellow-500',
        danger: 'text-red-500',
        info: 'text-cyan-500'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    const renderSpinner = () => (
        <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-current ${sizeClasses[size]} ${colorClasses[color]}`}></div>
    );

    const renderDots = () => (
        <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className={`rounded-full bg-current ${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : size === 'xl' ? 'w-5 h-5' : 'w-3 h-3'} ${colorClasses[color]} animate-bounce`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                ></div>
            ))}
        </div>
    );

    const renderPulse = () => (
        <div className={`rounded-full bg-current animate-pulse ${sizeClasses[size]} ${colorClasses[color]} opacity-75`}></div>
    );

    const renderBars = () => (
        <div className="flex items-end space-x-1">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className={`bg-current ${colorClasses[color]} ${size === 'sm' ? 'w-1' : size === 'lg' ? 'w-2' : size === 'xl' ? 'w-3' : 'w-1.5'} animate-pulse`}
                    style={{
                        height: size === 'sm' ? '12px' : size === 'lg' ? '24px' : size === 'xl' ? '32px' : '16px',
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '1s'
                    }}
                ></div>
            ))}
        </div>
    );

    const renderWave = () => (
        <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className={`bg-current rounded-full ${colorClasses[color]} ${size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-2 h-2' : size === 'xl' ? 'w-3 h-3' : 'w-1.5 h-1.5'}`}
                    style={{
                        animation: 'wave 1.4s ease-in-out infinite',
                        animationDelay: `${i * 0.1}s`
                    }}
                ></div>
            ))}
        </div>
    );

    const renderLoader = () => {
        switch (variant) {
            case 'dots':
                return renderDots();
            case 'pulse':
                return renderPulse();
            case 'bars':
                return renderBars();
            case 'wave':
                return renderWave();
            default:
                return renderSpinner();
        }
    };

    const content = (
        <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
            {renderLoader()}
            {text && (
                <p className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium animate-pulse`}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    return content;
};

// Composant de loader pour les pages
export const PageLoader: React.FC<{ text?: string }> = ({ text = "Chargement..." }) => (
    <div className="flex items-center justify-center py-12">
        <Loader variant="spinner" size="lg" color="primary" text={text} />
    </div>
);

// Composant de loader pour les cartes/sections
export const SectionLoader: React.FC<{ text?: string }> = ({ text = "Chargement..." }) => (
    <div className="flex items-center justify-center py-8">
        <Loader variant="dots" size="md" color="primary" text={text} />
    </div>
);

// Composant de loader inline
export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => (
    <div className="flex items-center space-x-2">
        <Loader variant="spinner" size="sm" color="primary" />
        {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
);

// Composant de loader pour les boutons
export const ButtonLoader: React.FC = () => (
    <Loader variant="spinner" size="sm" color="secondary" className="mr-2" />
);