function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-medium text-emerald-300">
          React + TypeScript + Tailwind Baseline
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Mortgage Calculator</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Your baseline app is ready. Start building your mortgage calculator features from this clean foundation.
        </p>
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/70 p-5 text-left text-sm text-slate-300 shadow-lg shadow-black/20">
          <p className="font-semibold text-slate-100">Next steps:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Add loan amount, term, and interest inputs.</li>
            <li>Calculate monthly payment and amortization schedule.</li>
            <li>Display charts and yearly breakdowns.</li>
          </ul>
        </div>
      </section>
    </main>
  )
}

export default App
