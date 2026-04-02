import type { CategoryWithTransactions } from '../types';

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatDate(dateStr: string): string {
  // Convert YYYY-MM-DD to M/D/YY
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const year = parseInt(parts[0], 10) % 100;
  return `${month}/${day}/${year}`;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function exportMonthToCsv(
  year: number,
  month: number,
  categories: CategoryWithTransactions[],
): string {
  const lines: string[] = [];
  const numCategories = categories.length;
  // Each category has 3 columns (Name, Date, Amount), some have a Note column
  const colsPerCat = 3;
  const totalCols = numCategories * colsPerCat;

  // Helper to create a row with the right number of columns
  const emptyRow = () => new Array(totalCols).fill('');

  // Year row
  const yearRow = emptyRow();
  yearRow[0] = String(year);
  lines.push(yearRow.join(','));

  // Month row
  const monthRow = emptyRow();
  monthRow[0] = MONTH_NAMES[month];
  lines.push(monthRow.join(','));

  // Category header row
  const catRow = emptyRow();
  categories.forEach((cat, idx) => {
    catRow[idx * colsPerCat] = cat.name;
  });
  lines.push(catRow.join(','));

  // Field header row
  const fieldRow = emptyRow();
  categories.forEach((_, idx) => {
    fieldRow[idx * colsPerCat] = 'Name';
    fieldRow[idx * colsPerCat + 1] = 'Date';
    fieldRow[idx * colsPerCat + 2] = 'Amount';
  });
  lines.push(fieldRow.join(','));

  // Find the max number of transactions across all categories
  const maxTransactions = Math.max(...categories.map(c => c.transactions.length), 0);

  // Data rows
  for (let rowIdx = 0; rowIdx < maxTransactions; rowIdx++) {
    const row = emptyRow();
    categories.forEach((cat, catIdx) => {
      const txn = cat.transactions[rowIdx];
      if (txn) {
        row[catIdx * colsPerCat] = txn.name;
        row[catIdx * colsPerCat + 1] = formatDate(txn.transaction_date);
        row[catIdx * colsPerCat + 2] = formatAmount(txn.amount);
      }
    });
    lines.push(row.join(','));
  }

  // Totals row
  const totalsRow = emptyRow();
  categories.forEach((cat, idx) => {
    const base = idx * colsPerCat;
    totalsRow[base] = '';
    totalsRow[base + 1] = `Total ${cat.name}:`;
    totalsRow[base + 2] = formatAmount(cat.total);
  });
  lines.push(totalsRow.join(','));

  return lines.join('\n');
}

export function exportAllMonthsToCsv(
  monthsData: Array<{
    year: number;
    month: number;
    categories: CategoryWithTransactions[];
  }>,
): string {
  return monthsData.map(m => exportMonthToCsv(m.year, m.month, m.categories)).join('\n\n');
}
