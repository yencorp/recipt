import { cn } from '@/utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return pages;
    }

    if (currentPage <= 4) {
      return [...pages.slice(0, 5), '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', ...pages.slice(totalPages - 5)];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className={cn('flex items-center justify-center space-x-2', className)}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'px-3 py-2 rounded-md text-sm font-medium',
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        이전
      </button>

      {/* Page Numbers */}
      {visiblePages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={cn(
              'px-3 py-2 rounded-md text-sm font-medium',
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'px-3 py-2 rounded-md text-sm font-medium',
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        다음
      </button>
    </nav>
  );
};
