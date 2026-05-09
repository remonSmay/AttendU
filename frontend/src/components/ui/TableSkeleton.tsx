import './TableSkeleton.css'

interface TableSkeletonProps {
  columns: number
  rows?: number
  hasActions?: boolean
}

export default function TableSkeleton({
  columns,
  rows = 6,
  hasActions = false,
}: TableSkeletonProps) {
  const totalCols = hasActions ? columns + 1 : columns

  return (
    <div className="tsk" aria-busy="true" aria-label="Loading table data">
      <table className="tsk__table" aria-hidden="true">
        <thead>
          <tr className="tsk__head-row">
            {Array.from({ length: totalCols }).map((_, col) => (
              <th key={col} className="tsk__th">
                <span
                  className="tsk__shimmer"
                  style={{ width: col === 0 ? '70%' : col === totalCols - 1 && hasActions ? '4rem' : '55%' }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row} className="tsk__row" style={{ animationDelay: `${row * 40}ms` }}>
              {Array.from({ length: totalCols }).map((_, col) => (
                <td key={col} className="tsk__td">
                  {col === 0 ? (
                    <div className="tsk__cell-compound">
                      <span className="tsk__avatar tsk__shimmer" />
                      <div className="tsk__cell-lines">
                        <span className="tsk__shimmer" style={{ width: '70%' }} />
                        <span className="tsk__shimmer" style={{ width: '50%', height: '0.65rem' }} />
                      </div>
                    </div>
                  ) : col === totalCols - 1 && hasActions ? (
                    <div className="tsk__actions">
                      <span className="tsk__shimmer tsk__btn-placeholder" />
                      <span className="tsk__shimmer tsk__btn-placeholder" />
                    </div>
                  ) : (
                    <span
                      className="tsk__shimmer"
                      style={{
                        width: col % 3 === 0 ? '75%' : col % 3 === 1 ? '55%' : '40%',
                      }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
