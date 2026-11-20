import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { wrap } from '../utils/http.js'
import { appTimezone, localDayStart, todayLocalDate } from '../utils/time.js'

const TZ = '$1'
const DAY_START = localDayStart(TZ, todayLocalDate(TZ))
const DAY_END = `(${DAY_START} + INTERVAL '1 day')`
const TODAY = todayLocalDate(TZ)

export const getSummary = wrap(async (_req, res) => {
  const tz = appTimezone()
  const [today, revenue, week, invoices, stock, expiry, patients, treatments, next, waiting] = await Promise.all([
    query(`SELECT status, COUNT(*)::int AS n FROM appointments WHERE start_at >= ${DAY_START} AND start_at < ${DAY_END} GROUP BY status`, [tz]),
    query(
      `SELECT method, COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS n FROM payments
       WHERE paid_at >= ${DAY_START} AND paid_at < ${DAY_END} GROUP BY method`,
      [tz],
    ),
    query(
      `SELECT d::date::text AS day, COALESCE(SUM(p.amount), 0) AS total
       FROM generate_series((${TODAY} - 6)::timestamp, ${TODAY}::timestamp, INTERVAL '1 day') AS d
       LEFT JOIN payments p ON (p.paid_at AT TIME ZONE ${TZ}::text)::date = d::date
       GROUP BY d ORDER BY d`,
      [tz],
    ),
    query(
      `SELECT COUNT(*)::int AS n, COALESCE(SUM(total - amount_paid), 0) AS balance,
              COUNT(*) FILTER (WHERE due_at < NOW())::int AS overdue
       FROM invoices WHERE status IN ('pending', 'partial')`,
    ),
    query('SELECT COUNT(*)::int AS n FROM inventory_items WHERE stock <= min_stock'),
    query(
      `SELECT COUNT(*) FILTER (WHERE expires_at < ${TODAY})::int AS expired,
              COUNT(*) FILTER (WHERE expires_at >= ${TODAY} AND expires_at <= ${TODAY} + 30)::int AS expiring
       FROM inventory_items WHERE expires_at IS NOT NULL`,
      [tz],
    ),
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'active')::int AS active,
              COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW() AT TIME ZONE ${TZ}::text) AT TIME ZONE ${TZ}::text)::int AS new_month
       FROM patients`,
      [tz],
    ),
    query("SELECT COUNT(*)::int AS n FROM treatments WHERE status IN ('planned', 'in_progress')"),
    query(
      `SELECT a.*, p.first_name || ' ' || p.last_name AS patient_name, d.name AS dentist_name
       FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN dentists d ON d.id = a.dentist_id
       WHERE a.start_at >= NOW() AND a.start_at < ${DAY_END} AND a.status IN ('pending', 'confirmed')
       ORDER BY a.start_at LIMIT 5`,
      [tz],
    ),
    query(
      `SELECT a.*, p.first_name || ' ' || p.last_name AS patient_name, d.name AS dentist_name
       FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN dentists d ON d.id = a.dentist_id
       WHERE a.status = 'waiting' AND a.start_at >= ${DAY_START} AND a.start_at < ${DAY_END}
       ORDER BY a.waiting_since NULLS LAST`,
      [tz],
    ),
  ])

  const byStatus = Object.fromEntries(today.rows.map((r) => [r.status, r.n]))
  const count = (...s) => s.reduce((sum, k) => sum + (byStatus[k] ?? 0), 0)
  const rev = Object.fromEntries(revenue.rows.map((r) => [r.method, Number(r.total)]))
  const withNames = (r) => ({ ...mappers.appointment(r), patientName: r.patient_name, dentistName: r.dentist_name })

  res.json({
    timezone: tz,
    appointmentsToday: {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      byStatus,
      pending: count('pending', 'confirmed'),
      waiting: count('waiting'),
      inProgress: count('in_progress'),
      completed: count('completed'),
      cancelled: count('cancelled'),
      noShow: count('no_show'),
    },
    revenueToday: {
      total: Object.values(rev).reduce((a, b) => a + b, 0),
      byMethod: { cash: rev.cash ?? 0, card: rev.card ?? 0, transfer: rev.transfer ?? 0 },
      payments: revenue.rows.reduce((a, r) => a + r.n, 0),
    },
    revenueLast7Days: week.rows.map((r) => ({ date: r.day, total: Number(r.total) })),
    pendingInvoices: {
      count: invoices.rows[0].n,
      balance: Number(invoices.rows[0].balance),
      overdue: invoices.rows[0].overdue,
    },
    inventory: {
      lowStock: stock.rows[0].n,
      expiringSoon: expiry.rows[0].expiring,
      expired: expiry.rows[0].expired,
    },
    patients: { active: patients.rows[0].active, newThisMonth: patients.rows[0].new_month },
    activeTreatments: treatments.rows[0].n,
    nextAppointments: next.rows.map(withNames),
    waitingRoom: waiting.rows.map(withNames),
  })
})
