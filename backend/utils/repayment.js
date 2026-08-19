function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(num, decimals = 2) {
  const n = toNum(num);
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function toDateOnly(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(baseDate, months) {
  const d = new Date(baseDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function toScheduleRow(row) {
  const plain = row && typeof row.toObject === 'function' ? row.toObject() : row || {};

  return {
    installmentNo: plain.installmentNo,
    dueDate: plain.dueDate,
    emi: toNum(plain.emi),
    principalComponent: toNum(plain.principalComponent),
    interestComponent: toNum(plain.interestComponent),
    paidAmount: toNum(plain.paidAmount),
    paidDate: plain.paidDate || null,
    status: plain.status || 'pending',
  };
}

export function createRepaymentSchedule({ principal, annualRate, tenureMonths, emi, disbursedAt }) {
  const safePrincipal = toNum(principal);
  const safeAnnualRate = toNum(annualRate);
  const safeTenureMonths = Math.max(0, Math.floor(toNum(tenureMonths)));
  const safeEmi = toNum(emi);
  const monthlyRate = safeAnnualRate / 12 / 100;
  const start = toDateOnly(disbursedAt || new Date());

  let remainingPrincipal = round(safePrincipal);
  const schedule = [];

  for (let i = 1; i <= safeTenureMonths; i++) {
    const interestComponent = round(remainingPrincipal * monthlyRate);
    const principalComponent = i === safeTenureMonths
      ? round(remainingPrincipal)
      : round(Math.max(safeEmi - interestComponent, 0));

    remainingPrincipal = round(Math.max(remainingPrincipal - principalComponent, 0));

    schedule.push({
      installmentNo: i,
      dueDate: addMonths(start, i),
      emi: round(safeEmi),
      principalComponent,
      interestComponent,
      paidAmount: 0,
      paidDate: null,
      status: 'pending',
    });
  }

  return schedule;
}

export function refreshOverdueStatuses(schedule, now = new Date()) {
  const today = toDateOnly(now).getTime();

  return schedule.map((row) => {
    const plain = toScheduleRow(row);
    const due = toDateOnly(plain.dueDate).getTime();
    const remainingDue = round(plain.emi - plain.paidAmount);

    if (remainingDue <= 0) {
      return { ...plain, status: 'paid' };
    }

    if (due < today) {
      return { ...plain, status: plain.paidAmount > 0 ? 'partial' : 'overdue' };
    }

    return { ...plain, status: plain.paidAmount > 0 ? 'partial' : 'pending' };
  });
}

export function summarizeRepayment(schedule, totalRepayment, now = new Date()) {
  const normalized = refreshOverdueStatuses(schedule, now);
  const safeTotalRepayment = toNum(totalRepayment);
  const totalPaid = round(normalized.reduce((sum, row) => sum + row.paidAmount, 0));
  const outstandingAmount = round(Math.max(safeTotalRepayment - totalPaid, 0));

  const pendingRows = normalized
    .filter((row) => row.status !== 'paid')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const nextDue = pendingRows[0] || null;
  const overdueAmount = round(
    normalized
      .filter((row) => row.status === 'overdue' || (row.status === 'partial' && new Date(row.dueDate) < now))
      .reduce((sum, row) => sum + Math.max(row.emi - row.paidAmount, 0), 0)
  );

  const nextDueAmount = nextDue
    ? round(Math.max(nextDue.emi - nextDue.paidAmount, 0))
    : 0;

  return {
    schedule: normalized,
    totalPaid,
    outstandingAmount,
    overdueAmount,
    nextDueDate: nextDue ? nextDue.dueDate : null,
    nextDueAmount,
  };
}

export function applyPaymentToSchedule(schedule, amount, paidAt = new Date()) {
  let remaining = round(toNum(amount));

  const ordered = schedule
    .map(toScheduleRow)
    .sort((a, b) => {
      const d = new Date(a.dueDate) - new Date(b.dueDate);
      return d !== 0 ? d : a.installmentNo - b.installmentNo;
    });

  for (const row of ordered) {
    if (remaining <= 0) break;

    const rowRemaining = round(row.emi - row.paidAmount);
    if (rowRemaining <= 0) continue;

    const paidPart = Math.min(rowRemaining, remaining);
    row.paidAmount = round(row.paidAmount + paidPart);
    remaining = round(remaining - paidPart);

    if (round(row.emi - row.paidAmount) <= 0) {
      row.status = 'paid';
      row.paidDate = paidAt;
    } else {
      row.status = 'partial';
      row.paidDate = paidAt;
    }
  }

  ordered.sort((a, b) => a.installmentNo - b.installmentNo);

  return { schedule: ordered, unallocatedAmount: remaining };
}

export function replayPaymentsOnSchedule(schedule, payments = []) {
  let currentSchedule = schedule.map(toScheduleRow);

  const successfulPayments = payments
    .filter((payment) => payment.status === 'success')
    .sort((a, b) => new Date(a.paidAt || 0) - new Date(b.paidAt || 0));

  for (const payment of successfulPayments) {
    const result = applyPaymentToSchedule(currentSchedule, payment.amount, payment.paidAt || new Date());
    currentSchedule = result.schedule;
  }

  return currentSchedule;
}

export function sumSuccessfulPayments(payments = []) {
  return round(
    payments
      .filter((payment) => payment.status === 'success')
      .reduce((sum, payment) => sum + toNum(payment.amount), 0)
  );
}
