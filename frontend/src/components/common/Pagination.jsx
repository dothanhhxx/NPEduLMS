import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', gap: '8px', borderTop: '1px solid var(--border)' }}>
            <button 
                className="btn icon-btn" 
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                style={{ padding: '6px', background: 'var(--background)', borderRadius: '6px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
                <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, padding: '0 8px' }}>
                Trang {currentPage} / {totalPages}
            </span>
            <button 
                className="btn icon-btn" 
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                style={{ padding: '6px', background: 'var(--background)', borderRadius: '6px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default Pagination;
