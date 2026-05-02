// frontend/src/components/ChecklistItem.jsx
export function PassFailItem({ item, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-surface-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-ink-900">{item.name}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border-2 min-w-[72px] ${
            value === true
              ? 'bg-green-500 border-green-500 text-white shadow-sm'
              : 'bg-white border-surface-200 text-ink-500 hover:border-green-300 hover:text-green-600'
          }`}
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border-2 min-w-[72px] ${
            value === false
              ? 'bg-red-500 border-red-500 text-white shadow-sm'
              : 'bg-white border-surface-200 text-ink-500 hover:border-red-300 hover:text-red-600'
          }`}
        >
          Fail
        </button>
      </div>
    </div>
  )
}

export function OKNGItem({ item, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-surface-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-ink-900">{item.name}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border-2 min-w-[72px] ${
            value === true
              ? 'bg-green-500 border-green-500 text-white shadow-sm'
              : 'bg-white border-surface-200 text-ink-500 hover:border-green-300 hover:text-green-600'
          }`}
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border-2 min-w-[72px] ${
            value === false
              ? 'bg-red-500 border-red-500 text-white shadow-sm'
              : 'bg-white border-surface-200 text-ink-500 hover:border-red-300 hover:text-red-600'
          }`}
        >
          NG
        </button>
      </div>
    </div>
  )
}

export function NumericItem({ item, value, onChange }) {
  const hasMin = item.min_value !== null && item.min_value !== undefined
  const hasMax = item.max_value !== null && item.max_value !== undefined
  const numVal = parseFloat(value)
  const isOutOfRange = !isNaN(numVal) && (
    (hasMin && numVal < item.min_value) ||
    (hasMax && numVal > item.max_value)
  )

  return (
    <div className="py-4 border-b border-surface-100 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-900">{item.name}</p>
          {(hasMin || hasMax) && (
            <p className="text-xs text-ink-400 mt-0.5">
              Range: {hasMin ? item.min_value : '—'} – {hasMax ? item.max_value : '—'} {item.unit || ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            step="any"
            value={value ?? ''}
            onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
            placeholder="0.00"
            className={`input w-28 text-right font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isOutOfRange ? 'border-red-400 focus:ring-red-400' : ''
            }`}
          />
          {item.unit && (
            <span className="text-sm text-ink-400 w-8">{item.unit}</span>
          )}
        </div>
      </div>
      {isOutOfRange && (
        <p className="text-red-500 text-xs font-medium mt-1.5">
          ⚠ Value is out of acceptable range ({hasMin ? `min ${item.min_value}` : ''}{hasMin && hasMax ? ', ' : ''}{hasMax ? `max ${item.max_value}` : ''} {item.unit || ''})
        </p>
      )}
    </div>
  )
}