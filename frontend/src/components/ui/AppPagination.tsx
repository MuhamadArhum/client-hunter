import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AppPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (p: number) => void;
  onLimitChange?: (l: number) => void;
  limitOptions?: number[];
  className?: string;
}

function pageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function AppPagination({
  pagination, onPageChange, onLimitChange,
  limitOptions = [10, 20, 50, 100],
  className,
}: AppPaginationProps) {
  const { page, pages, total, limit } = pagination;
  if (!total) return null;

  const from  = Math.min((page - 1) * limit + 1, total);
  const to    = Math.min(page * limit, total);
  const range = pageRange(page, pages);

  const btn = (active: boolean, disabled: boolean) => cn(
    'inline-flex items-center justify-center h-[30px] min-w-[30px] px-1.5 rounded-[4px] text-[12px] font-medium transition-colors select-none border',
    disabled  && 'opacity-30 cursor-not-allowed pointer-events-none border-border text-muted-foreground',
    !disabled && !active && 'border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-background',
    !disabled && active  && 'text-white border-transparent',
  );

  return (
    <div className={cn('flex items-center justify-between gap-4 flex-wrap py-3 px-1', className)}>

      {/* Info + per-page selector */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground">{from.toLocaleString()}–{to.toLocaleString()}</span>
          {' '}of{' '}
          <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
        </span>

        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => { onLimitChange(Number(e.target.value)); onPageChange(1); }}
            className="h-[30px] rounded-[4px] border border-border bg-background px-2 text-[12px] text-foreground cursor-pointer outline-none focus:ring-1 focus:ring-primary"
          >
            {limitOptions.map((l) => (
              <option key={l} value={l}>{l} / page</option>
            ))}
          </select>
        )}
      </div>

      {/* Page controls */}
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button className={btn(false, page === 1)} onClick={() => onPageChange(1)} title="First">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button className={btn(false, page === 1)} onClick={() => onPageChange(page - 1)} title="Prev">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {range.map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="px-1 text-[12px] text-muted-foreground">…</span>
            ) : (
              <button
                key={p}
                className={btn(p === page, false)}
                style={p === page ? { background: '#1FB2A6' } : {}}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </button>
            )
          )}

          <button className={btn(false, page === pages)} onClick={() => onPageChange(page + 1)} title="Next">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button className={btn(false, page === pages)} onClick={() => onPageChange(pages)} title="Last">
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
