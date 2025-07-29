
import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pageNumbers: (number | string)[] = [];
        const pageRangeDisplayed = 2; // How many pages to show around the current page
        
        if (totalPages <= 5) { // Show all pages if 5 or less
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
            return pageNumbers;
        }

        // Always show the first page
        pageNumbers.push(1);

        // Ellipsis after first page
        if (currentPage > pageRangeDisplayed + 1) {
             pageNumbers.push('...');
        }

        // Pages around the current page
        const startPage = Math.max(2, currentPage - (pageRangeDisplayed - 1));
        const endPage = Math.min(totalPages - 1, currentPage + (pageRangeDisplayed - 1));

        for (let i = startPage; i <= endPage; i++) {
            if(!pageNumbers.includes(i)) {
               pageNumbers.push(i);
            }
        }
        
        // Ellipsis before last page
        if (currentPage < totalPages - pageRangeDisplayed) {
            pageNumbers.push('...');
        }

        // Always show the last page
        if (!pageNumbers.includes(totalPages)) {
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };


    return (
        <div className="flex items-center justify-between mt-4 py-3">
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="btn btn-sm btn-outline-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i className="fas fa-arrow-left mr-2"></i> Précédent
            </button>
            <div className="hidden sm:flex items-center space-x-1">
                {getPageNumbers().map((page, index) =>
                    typeof page === 'number' ? (
                        <button
                            key={index}
                            onClick={() => onPageChange(page)}
                            className={`flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={index} className="flex items-center justify-center h-9 w-9 text-gray-500">
                            {page}
                        </span>
                    )
                )}
            </div>
             <div className="sm:hidden text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
            </div>
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-outline-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Suivant <i className="fas fa-arrow-right ml-2"></i>
            </button>
        </div>
    );
};
