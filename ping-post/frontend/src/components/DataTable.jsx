import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import { ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw, Download } from 'lucide-react'

/**
 * One dense, sortable grid for every page.
 *
 * Density is the point: ~26px rows, 12px text, a border on every cell.
 * These screens are read for hours, and a row that fits is a row nobody
 * has to scroll to. The cell grid is what keeps that scannable -- without
 * it, dense rows blur together.
 *
 * Columns: { key, header, align, width, render, sortValue, sortable, className }
 */
export function DataTable({
  columns,
  rows,
  getRowId = (_, i) => i,
  onRowClick,
  initialSort,
  footer,
  maxHeight,
  groups,
  fill = false,
  emptyMessage = 'No records match the current filters.',
}) {
  const [sort, setSort] = useState(initialSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows

    const value = col.sortValue ?? ((r) => r[col.key])
    return [...rows].sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])

  const toggle = (key) =>
    setSort((s) =>
      s?.key !== key
        ? { key, dir: 'desc' }
        : s.dir === 'desc'
          ? { key, dir: 'asc' }
          : null,
    )

  return (
    // `fill` lets the table take the panel's remaining height and scroll
    // inside it -- the page itself then never scrolls.
    <div className={clsx('overflow-auto', fill && 'min-h-0 flex-1')} style={maxHeight ? { maxHeight } : undefined}>
      <table className="grid-table w-full text-[13px]">
        <thead className="sticky top-0 z-10">
          {/* Optional band row: groups related columns under one label,
              as in the Leads / Calls / Conversions bands of the source
              screens. Ungrouped spans render as empty cells so the two
              header rows stay aligned to the same column edges. */}
          {groups && (
            <tr className="bg-chrome">
              {groups.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.span}
                  className={clsx(
                    'h-[22px] whitespace-nowrap border-t border-grid px-2 text-[11px] font-semibold',
                    g.label
                      ? 'border-b border-grid text-center text-text-secondary'
                      : 'border-b-0',
                  )}
                >
                  {g.label ?? ''}
                </th>
              ))}
            </tr>
          )}
          <tr className="bg-chrome">
            {columns.map((c) => {
              const active = sort?.key === c.key
              return (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  onClick={() => c.sortable !== false && toggle(c.key)}
                  className={clsx(
                    'h-[30px] whitespace-nowrap px-3 font-normal',
                    !groups && 'border-t border-grid',
                    c.align === 'right' ? 'text-right' : 'text-left',
                    c.sortable !== false && 'cursor-pointer select-none hover:bg-chrome-hover',
                    active ? 'text-primary' : 'text-text-primary',
                  )}
                >
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1',
                      c.align === 'right' && 'flex-row-reverse',
                    )}
                  >
                    {c.header}
                    {c.sortable !== false && c.header &&
                      (active ? (
                        sort.dir === 'desc'
                          ? <ChevronDown size={11} />
                          : <ChevronUp size={11} />
                      ) : (
                        <ChevronsUpDown size={11} className="opacity-20" />
                      ))}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={getRowId(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  'bg-white hover:bg-row-hover',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx(
                      'h-[32px] whitespace-nowrap px-3',
                      c.align === 'right' ? 'text-right' : 'text-left',
                      c.className,
                    )}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {footer && sorted.length > 0 && (
          <tfoot className="sticky bottom-0">
            <tr className="bg-white font-bold text-text-primary">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={clsx(
                    'h-[32px] whitespace-nowrap border-t border-t-grid px-3',
                    c.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {footer[c.key] ?? null}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

/**
 * Bottom pagination strip. Mirrors the source screens' footer: page
 * controls on the left, record count on the right.
 */
export function Pager({ page, totalPages, total, pageSize, onPage, onRefresh, onExport }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const btn =
    'flex h-[22px] w-[22px] items-center justify-center border border-grid ' +
    'bg-white text-text-secondary hover:bg-chrome-hover disabled:opacity-35 ' +
    'disabled:hover:bg-white text-[13px]'

  return (
    <div className="flex h-[34px] shrink-0 items-center justify-between border-t border-grid bg-chrome px-2">
      <div className="flex items-center gap-1">
        <button className={btn} disabled={page === 1} onClick={() => onPage(1)}>«</button>
        <button className={btn} disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
        <span className="mx-1.5 flex items-center gap-1.5 text-[12.5px] text-text-primary">
          Page
          <input
            value={page}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isInteger(n) && n >= 1 && n <= totalPages) onPage(n)
            }}
            className="tnum h-[22px] w-[42px] border border-grid bg-white px-1 text-center outline-none focus:border-primary"
          />
          of {totalPages}
        </span>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>›</button>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPage(totalPages)}>»</button>

        {(onRefresh || onExport) && <span className="mx-1 h-[16px] w-px bg-grid" />}
        {onRefresh && (
          <button className={clsx(btn, 'border-0 bg-transparent text-primary hover:bg-chrome-hover')} onClick={onRefresh} title="Refresh">
            <RefreshCw size={13} />
          </button>
        )}
        {onExport && (
          <button className={clsx(btn, 'border-0 bg-transparent text-primary hover:bg-chrome-hover')} onClick={onExport} title="Export CSV">
            <Download size={13} />
          </button>
        )}
      </div>

      <span className="tnum text-[12.5px] text-text-primary">
        Displaying {from.toLocaleString()} – {to.toLocaleString()} of {total.toLocaleString()}
      </span>
    </div>
  )
}
