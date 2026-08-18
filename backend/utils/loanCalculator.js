/**
 * Loan calculation utilities
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * IRR computed via Newton-Raphson on cash flows
 */

export const INTEREST_RATES = {
  excellent: 10.5,
  good: 12.5,
  fair: 14.5,
  poor: 16.5,
};

export const PROCESSING_FEE_PERCENT = 2;
export const GST_PERCENT = 18;
export const OTHER_CHARGES = 500;

export function getInterestRate(creditScore) {
  if (creditScore >= 750) return INTEREST_RATES.excellent;
  if (creditScore >= 700) return INTEREST_RATES.good;
  if (creditScore >= 650) return INTEREST_RATES.fair;
  return INTEREST_RATES.poor;
}

export function calculateEMI(principal, annualRate, tenureMonths) {
  if (principal <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalInterest: 0, totalRepayment: 0 };
  }
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    return {
      emi: round(emi),
      totalInterest: 0,
      totalRepayment: round(emi * tenureMonths),
    };
  }
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  const totalRepayment = emi * tenureMonths;
  const totalInterest = totalRepayment - principal;
  return {
    emi: round(emi),
    totalInterest: round(totalInterest),
    totalRepayment: round(totalRepayment),
  };
}

export function calculateCharges(loanAmount) {
  const processingFee = round((loanAmount * PROCESSING_FEE_PERCENT) / 100);
  const gst = round((processingFee * GST_PERCENT) / 100);
  const totalCharges = round(processingFee + gst + OTHER_CHARGES);
  const netDisbursement = round(loanAmount - totalCharges);
  return { processingFee, gst, otherCharges: OTHER_CHARGES, totalCharges, netDisbursement };
}

export function calculateIRR(loanAmount, emi, tenureMonths, totalCharges) {
  const netReceived = loanAmount - totalCharges;
  const cashFlows = [-netReceived];
  for (let i = 0; i < tenureMonths; i++) {
    cashFlows.push(emi);
  }
  return round(newtonRaphsonIRR(cashFlows) * 12 * 100, 2);
}

function newtonRaphsonIRR(cashFlows, guess = 0.01) {
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      if (t > 0) dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-7) return newRate;
    rate = newRate;
  }
  return rate;
}

export function checkEligibility({ income, loanAmount, creditScore, currentDebts, incomeType = 'monthly' }) {
  const annualIncome = incomeType === 'monthly' ? income * 12 : income;
  const monthlyIncome = annualIncome / 12;
  const debtToIncome = monthlyIncome > 0 ? (currentDebts / monthlyIncome) * 100 : 100;
  const loanToIncome = annualIncome > 0 ? (loanAmount / annualIncome) * 100 : 100;

  let score = 0;
  const reasons = [];

  if (creditScore >= 750) {
    score += 40;
    reasons.push('Excellent credit score (750+)');
  } else if (creditScore >= 700) {
    score += 30;
    reasons.push('Good credit score (700-749)');
  } else if (creditScore >= 650) {
    score += 20;
    reasons.push('Fair credit score (650-699)');
  } else {
    score += 5;
    reasons.push('Low credit score (<650)');
  }

  if (debtToIncome <= 30) {
    score += 30;
    reasons.push('Healthy debt-to-income ratio');
  } else if (debtToIncome <= 50) {
    score += 15;
    reasons.push('Moderate debt-to-income ratio');
  } else {
    score += 0;
    reasons.push('High debt-to-income ratio');
  }

  if (loanToIncome <= 300) {
    score += 30;
    reasons.push('Loan amount within income limits');
  } else if (loanToIncome <= 500) {
    score += 15;
    reasons.push('Loan amount moderately high vs income');
  } else {
    score += 0;
    reasons.push('Loan amount too high vs income');
  }

  let status;
  let maxEligibleAmount;

  if (score >= 70) {
    status = 'Eligible';
    maxEligibleAmount = Math.min(loanAmount, annualIncome * 5);
  } else if (score >= 40) {
    status = 'Partially Eligible';
    maxEligibleAmount = Math.min(loanAmount * 0.6, annualIncome * 3);
  } else {
    status = 'Not Eligible';
    maxEligibleAmount = 0;
  }

  return {
    status,
    score,
    reasons,
    debtToIncome: round(debtToIncome, 1),
    loanToIncome: round(loanToIncome, 1),
    maxEligibleAmount: round(maxEligibleAmount),
    creditRating:
      creditScore >= 750 ? 'Excellent' : creditScore >= 700 ? 'Good' : creditScore >= 650 ? 'Fair' : 'Poor',
  };
}

function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function getFullLoanTerms(loanAmount, tenureMonths, creditScore) {
  const annualRate = getInterestRate(creditScore);
  const charges = calculateCharges(loanAmount);
  const { emi, totalInterest, totalRepayment } = calculateEMI(loanAmount, annualRate, tenureMonths);
  const irr = calculateIRR(loanAmount, emi, tenureMonths, charges.totalCharges);

  return {
    loanAmount,
    tenureMonths,
    annualInterestRate: annualRate,
    ...charges,
    emi,
    totalInterest,
    totalRepayment,
    irr,
  };
}
