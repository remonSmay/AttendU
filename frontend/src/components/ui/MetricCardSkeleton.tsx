import './MetricCardSkeleton.css'

interface MetricCardSkeletonProps {
  count?: number
}

export default function MetricCardSkeleton({ count = 2 }: MetricCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <section
          key={index}
          className="ui-surface ui-stat-card mcs"
          aria-hidden="true"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="mcs__icon mcs__shimmer" />
          <div className="mcs__copy">
            <span className="mcs__shimmer mcs__label" />
            <span className="mcs__shimmer mcs__value" />
          </div>
        </section>
      ))}
    </>
  )
}
