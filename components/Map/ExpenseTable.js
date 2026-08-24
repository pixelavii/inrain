import { useEffect, useState } from 'react'

function recomputeBalances (rows, openingBalance) {
  let balance = openingBalance
  return rows.map(row => {
    if (row.isBalanceRow) return { ...row, balance: openingBalance.toFixed(2) }
    const credit = Number(row.credit) || 0
    const debit = Number(row.debit) || 0
    balance = balance + credit - debit
    return { ...row, balance: balance.toFixed(2) }
  })
}

export default function ExpenseTable ({
  isOpen,
  onClose,
  userId,
  month,
  openingBalance,
  companyName,
  userName
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !userId || !month) return

    const fetchLedger = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          userId,
          month,
          format: 'ledger',
          openingBalance: String(openingBalance || 0)
        })
        const res = await fetch(`/api/map/expense?${params.toString()}`)
        const result = await res.json()

        if (!res.ok) {
          setError(result.message || 'Failed to load ledger')
          setRows([])
          return
        }
        setRows(result.rows)
      } catch (err) {
        console.error(err)
        setError('Failed to load ledger')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    fetchLedger()
  }, [isOpen, userId, month, openingBalance])

  const updateCell = (index, field, value) => {
    setRows(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return recomputeBalances(next, Number(openingBalance) || 0)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const editableRows = rows.filter(r => !r.isBalanceRow)
      const res = await fetch('/api/map/expense', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: editableRows })
      })
      const result = await res.json()

      if (!res.ok) {
        setError(result.message || 'Failed to save')
        return
      }
      onClose()
    } catch (err) {
      console.error(err)
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='flex max-h-[85vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-lg'>
        <div className='flex items-center justify-between border-b border-slate-200 px-5 py-4'>
          <div>
            <h2 className='text-sm font-semibold text-slate-900'>
              {companyName}
            </h2>
            <p className='text-xs text-slate-500'>
              {userName}'s Expense Detail — {month}
            </p>
          </div>
          <button
            onClick={onClose}
            className='rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100'
          >
            ✕
          </button>
        </div>

        <div className='flex-1 overflow-auto px-5 py-4'>
          {loading && <p className='text-sm text-slate-500'>Loading…</p>}
          {error && <p className='mb-3 text-sm text-red-600'>{error}</p>}

          {!loading && rows.length > 0 && (
            <table className='w-full border-collapse text-sm'>
              <thead>
                <tr className='border-b border-slate-300 bg-slate-100 text-left'>
                  <th className='px-2 py-2 font-semibold text-slate-700'>
                    Date
                  </th>
                  <th className='px-2 py-2 font-semibold text-slate-700'>
                    Particular
                  </th>
                  <th className='px-2 py-2 font-semibold text-slate-700'>
                    Location
                  </th>
                  <th className='px-2 py-2 text-right font-semibold text-slate-700'>
                    Credit
                  </th>
                  <th className='px-2 py-2 text-right font-semibold text-slate-700'>
                    Debit
                  </th>
                  <th className='px-2 py-2 text-right font-semibold text-slate-700'>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id ?? `balance-${index}`}
                    className={`border-b border-slate-100 ${
                      row.isBalanceRow ? 'bg-slate-50 font-semibold' : ''
                    }`}
                  >
                    <td className='px-2 py-1'>
                      {row.isBalanceRow ? (
                        row.date
                      ) : (
                        <input
                          type='date'
                          value={row.date}
                          onChange={e =>
                            updateCell(index, 'date', e.target.value)
                          }
                          className='w-full rounded border border-transparent px-1 py-0.5 hover:border-slate-300 focus:border-slate-400 focus:outline-none'
                        />
                      )}
                    </td>
                    <td className='px-2 py-1'>
                      {row.isBalanceRow ? (
                        row.particular
                      ) : (
                        <input
                          type='text'
                          value={row.particular}
                          onChange={e =>
                            updateCell(index, 'particular', e.target.value)
                          }
                          className='w-full rounded border border-transparent px-1 py-0.5 hover:border-slate-300 focus:border-slate-400 focus:outline-none'
                        />
                      )}
                    </td>
                    <td className='px-2 py-1'>
                      {row.isBalanceRow ? (
                        row.location
                      ) : (
                        <input
                          type='text'
                          value={row.location}
                          onChange={e =>
                            updateCell(index, 'location', e.target.value)
                          }
                          className='w-full rounded border border-transparent px-1 py-0.5 hover:border-slate-300 focus:border-slate-400 focus:outline-none'
                        />
                      )}
                    </td>
                    <td className='px-2 py-1 text-right'>
                      {row.isBalanceRow ? (
                        row.credit
                      ) : (
                        <input
                          type='number'
                          value={row.credit}
                          onChange={e =>
                            updateCell(index, 'credit', e.target.value)
                          }
                          className='w-full rounded border border-transparent px-1 py-0.5 text-right hover:border-slate-300 focus:border-slate-400 focus:outline-none'
                        />
                      )}
                    </td>
                    <td className='px-2 py-1 text-right'>
                      {row.isBalanceRow ? (
                        row.debit
                      ) : (
                        <input
                          type='number'
                          value={row.debit}
                          onChange={e =>
                            updateCell(index, 'debit', e.target.value)
                          }
                          className='w-full rounded border border-transparent px-1 py-0.5 text-right hover:border-slate-300 focus:border-slate-400 focus:outline-none'
                        />
                      )}
                    </td>
                    <td className='px-2 py-1 text-right font-medium'>
                      {row.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && rows.length === 0 && !error && (
            <p className='text-sm text-slate-500'>
              No expenses found for this month.
            </p>
          )}
        </div>

        <div className='flex justify-end gap-2 border-t border-slate-200 px-5 py-3'>
          <button
            onClick={onClose}
            className='rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
