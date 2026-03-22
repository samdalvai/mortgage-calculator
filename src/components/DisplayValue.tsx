export function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-950/60 p-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-100">{value}</dd>
    </div>
  )
}

export function ChartLegendValue({
  label,
  value,
  colorClassName,
}: {
  label: string
  value: string
  colorClassName: string
}) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-950/60 p-3">
      <dt className="flex items-center gap-2 text-slate-300">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${colorClassName}`} aria-hidden />
        <span>{label}</span>
      </dt>
      <dd className="mt-1 font-semibold text-slate-100">{value}</dd>
    </div>
  )
}

export function PlanValue({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-slate-400">{label}: </span>
      <span className="font-medium text-slate-100">{value}</span>
    </p>
  )
}
