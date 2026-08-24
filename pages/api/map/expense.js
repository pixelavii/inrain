import { supabase } from './mapdb'

const EXPENSE = 'Expense'

export default async function handler (req, res) {
  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'PATCH') return handlePatch(req, res)
  return res.status(405).json({ message: 'Method not allowed' })
}

async function handleGet (req, res) {
  const { userId, month, format, openingBalance, companyName, userName } =
    req.query

  if (!userId || !month || isNaN(Number(userId))) {
    return res.status(400).json({ message: 'Valid User ID Required' })
  }

  const startDate = `${month}-01T00:00:00.000Z`
  const endDate = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)
  ).toISOString()

  try {
    const { data, error } = await supabase
      .from(EXPENSE)
      .select('*')
      .eq('User_ID', userId)
      .gte('entryDate', startDate)
      .lt('entryDate', endDate)
      .order('entryDate', { ascending: true })

    if (error) throw error

    const opening = Number(openingBalance) || 0

    if (format === 'csv') {
      const csv = buildLedgerCsv(data, {
        openingBalance: opening,
        companyName: companyName || 'InRain Construction Pvt Ltd.',
        userName: userName || 'User',
        month
      })
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${userName || 'ledger'}-${month}.csv"`
      )
      return res.status(200).send(csv)
    }

    if (format === 'ledger') {
      const rows = buildLedgerRows(data, opening)
      return res.status(200).json({ openingBalance: opening, rows })
    }

    // Default: unchanged, existing consumers still get the raw array
    return res.status(200).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function handlePatch (req, res) {
  const { rows } = req.body

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'No rows to update' })
  }

  try {
    const updates = rows.map(row => {
      const payload = {
        entryDate: row.date,
        site: row.location,
        updated_at: new Date().toISOString()
      }

      if (row.isCredit) {
        payload.credit_by = row.particular
        payload.credit_amount = Number(row.credit) || 0
      } else {
        payload.notes = row.particular
        payload.amount = Number(row.debit) || 0
      }

      return supabase.from(EXPENSE).update(payload).eq('id', row.id)
    })

    const results = await Promise.all(updates)
    const failed = results.filter(r => r.error)

    if (failed.length > 0) {
      console.error('Some updates failed:', failed)
      return res
        .status(500)
        .json({ message: `${failed.length} row(s) failed to update` })
    }

    return res.status(200).json({ message: 'Saved', updated: rows.length })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ---------- shared helpers ----------

function escapeCsvField (value) {
  if (value == null) return ''
  const str = String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function formatLedgerDate (isoDate) {
  const d = new Date(isoDate)
  const day = d.getUTCDate()
  const monthShort = d.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC'
  })
  return `${day}-${monthShort}`
}

function toIsoDate (entryDate) {
  return new Date(entryDate).toISOString().slice(0, 10) // YYYY-MM-DD
}

function monthLabel (month) {
  const [year, mm] = month.split('-')
  const d = new Date(Date.UTC(Number(year), Number(mm) - 1, 1))
  const monthFull = d.toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC'
  })
  return `${monthFull}-${year}`
}

// Structured rows with running balance + raw ISO dates + DB id, for editing.
function buildLedgerRows (rows, openingBalance) {
  let balance = openingBalance
  const result = [
    {
      id: null,
      date: rows.length > 0 ? toIsoDate(rows[0].entryDate) : '',
      particular: 'Balance',
      location: '',
      credit: openingBalance.toFixed(2),
      debit: '',
      balance: balance.toFixed(2),
      isBalanceRow: true,
      isCredit: false
    }
  ]

  rows.forEach(row => {
    const isCredit = row.credit_amount != null && Number(row.credit_amount) > 0

    if (isCredit) {
      const creditAmt = Number(row.credit_amount) || 0
      balance += creditAmt
      result.push({
        id: row.id,
        date: toIsoDate(row.entryDate),
        particular: row.credit_by || '',
        location: row.site || '',
        credit: creditAmt.toFixed(2),
        debit: '',
        balance: balance.toFixed(2),
        isBalanceRow: false,
        isCredit: true
      })
    } else {
      const debitAmt = Number(row.amount) || 0
      balance -= debitAmt
      result.push({
        id: row.id,
        date: toIsoDate(row.entryDate),
        particular: row.notes || '',
        location: row.site || '',
        credit: '',
        debit: debitAmt.toFixed(2),
        balance: balance.toFixed(2),
        isBalanceRow: false,
        isCredit: false
      })
    }
  })

  return result
}

// CSV reuses the same row builder, then blanks repeated dates for display.
function buildLedgerCsv (
  rows,
  { openingBalance, companyName, userName, month }
) {
  const structured = buildLedgerRows(rows, openingBalance)
  const lines = []

  lines.push(`,,,${escapeCsvField(companyName)},,,`)
  lines.push(
    `,,,${escapeCsvField(
      `${userName}'s Expense Dtl for the m/o (${monthLabel(month)})`
    )},,,`
  )
  lines.push('Date,Particular,Location,Credit,Debit,Amount')

  let lastDateShown = null
  structured.forEach(row => {
    const displayDate = row.date ? formatLedgerDate(row.date) : ''
    const dateCell = displayDate === lastDateShown ? '' : displayDate
    lastDateShown = displayDate

    lines.push(
      [
        dateCell,
        escapeCsvField(row.particular),
        escapeCsvField(row.location),
        row.credit,
        row.debit,
        row.balance
      ].join(',')
    )
  })

  return lines.join('\n')
}
