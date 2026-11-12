import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * Generates compact page numbers with ellipsis for large page counts.
 */
function getPaginationRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, '...', current - 1, current, current + 1, '...', total]
}

/**
 * Shared table pagination bar with summary range badge, mobile indicator, and first/prev/next/last controls.
 */
export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'សិស្ស'
}) {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const navBtnClass = (disabled) =>
    `w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
      disabled
        ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
        : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 bg-white shadow-2xs cursor-pointer'
    }`

  return (
    <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-2xl">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
          បង្ហាញ{' '}
          <strong className="text-slate-800">
            {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}
          </strong>{' '}
          នៃ <strong className="text-indigo-600">{totalItems}</strong> {itemLabel}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={navBtnClass(currentPage === 1)}
          title="ទំព័រដំបូង"
        >
          <ChevronsLeft size={16} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={navBtnClass(currentPage === 1)}
          title="ទំព័រមុន"
        >
          <ChevronLeft size={16} strokeWidth={2.2} />
        </button>

        <div className="flex sm:hidden items-center px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700">
          {currentPage} / {safeTotalPages}
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {getPaginationRange(currentPage, safeTotalPages).map((item, idx) => {
            if (item === '...') {
              return (
                <span
                  key={`dots-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold select-none text-[13px]"
                >
                  ...
                </span>
              )
            }
            const pageNum = Number(item)
            const isActive = currentPage === pageNum
            return (
              <button
                type="button"
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-8 h-8 px-2 rounded-lg font-bold text-[13px] flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 border border-indigo-600'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages}
          className={navBtnClass(currentPage === safeTotalPages)}
          title="ទំព័របន្ទាប់"
        >
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage === safeTotalPages}
          className={navBtnClass(currentPage === safeTotalPages)}
          title="ទំព័រចុងក្រោយ"
        >
          <ChevronsRight size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}
