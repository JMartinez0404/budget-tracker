import Papa from 'papaparse';
import type { ParsedMonth, ParsedCategory, ParsedTransaction } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// The category headers as they appear in Joel's spreadsheet (row 3 pattern)
// Each category occupies 3 columns: Name, Date, Amount
// Some categories have a 4th "Note" column (Savings has it)
const KNOWN_CATEGORIES = [
  'Income', 'Bills', 'Gas', 'Groceries', 'Restaurants',
  'Other', 'Vanguard', 'Unexpected Expenses', 'Savings',
  'Buffer Amount', 'Available Fun Money', "Joel's Fun Spending",
  'Leftover Fun Money',
];

function parseAmount(raw: string): number | null {
  if (!raw || raw.trim() === '') return null;
  // Remove dollar signs, whitespace
  const cleaned = raw.replace(/[$\s]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(raw: string, year: number): string | null {
  if (!raw || raw.trim() === '') return null;
  const trimmed = raw.trim();

  // Try various date formats Joel uses: "1/5", "1/5/26", "1/5/2026", "1/9/26"
  const parts = trimmed.split('/');
  if (parts.length < 2) return null;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  let dateYear = year;
  if (parts.length >= 3) {
    const rawYear = parseInt(parts[2], 10);
    if (!isNaN(rawYear)) {
      // Handle 2-digit years (16 -> 2016, 26 -> 2026)
      dateYear = rawYear < 100 ? 2000 + rawYear : rawYear;
    }
  }

  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${dateYear}-${m}-${d}`;
}

function isMonthRow(row: string[]): string | null {
  const first = (row[0] || '').trim();
  if (MONTH_NAMES.includes(first)) return first;
  return null;
}

function isYearRow(row: string[]): number | null {
  const first = (row[0] || '').trim();
  const num = parseInt(first, 10);
  if (!isNaN(num) && num >= 2000 && num <= 2100) {
    // Check that the rest of the row is mostly empty
    const nonEmpty = row.slice(1).filter(c => c && c.trim() !== '').length;
    if (nonEmpty <= 2) return num;
  }
  return null;
}

function isTotalsRow(row: string[]): boolean {
  return row.some(cell => cell && cell.trim().startsWith('Total'));
}

function isHeaderRow(row: string[]): boolean {
  // The header row contains "Income", "Bills", etc. in specific positions
  const first = (row[0] || '').trim();
  return first === 'Income' || first === 'Name';
}

interface CategorySlice {
  name: string;
  startCol: number;
  nameCol: number;
  dateCol: number;
  amountCol: number;
  noteCol?: number;
}

function detectCategorySlices(categoryRow: string[], headerRow: string[]): CategorySlice[] {
  const slices: CategorySlice[] = [];

  // The category row (row 3) has category names spaced out.
  // Each category has 3 columns (Name, Date, Amount).
  // We scan for known category names to find their positions.
  for (let i = 0; i < categoryRow.length; i++) {
    const cell = (categoryRow[i] || '').trim();
    if (!cell) continue;

    // Check for known categories or partial matches
    const matched = KNOWN_CATEGORIES.find(cat => {
      return cell === cat ||
        cell.toLowerCase() === cat.toLowerCase() ||
        cell.includes(cat) ||
        cat.includes(cell);
    });

    if (matched) {
      // Verify this is a category header by checking that the next row
      // has "Name" or similar in the same column position
      const belowCell = (headerRow[i] || '').trim();
      const isLikelyCategory = belowCell === 'Name' || belowCell === '' || belowCell === 'Note';

      if (isLikelyCategory) {
        slices.push({
          name: matched,
          startCol: i,
          nameCol: i,
          dateCol: i + 1,
          amountCol: i + 2,
        });
      }
    }
  }

  // Handle the "Note" column for Savings (it has 4 columns)
  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const nextSlice = slices[i + 1];
    if (nextSlice && nextSlice.startCol - slice.startCol > 3) {
      slice.noteCol = slice.startCol + 3;
    }
  }

  return slices;
}

function extractTransactionsFromRows(
  dataRows: string[][],
  slice: CategorySlice,
  year: number,
  monthNum: number,
): { transactions: ParsedTransaction[]; notes: string[] } {
  const transactions: ParsedTransaction[] = [];
  const notes: string[] = [];

  for (const row of dataRows) {
    const name = (row[slice.nameCol] || '').trim();
    const dateRaw = (row[slice.dateCol] || '').trim();
    const amountRaw = (row[slice.amountCol] || '').trim();

    // Extract notes if present
    if (slice.noteCol) {
      const note = (row[slice.noteCol] || '').trim();
      if (note) notes.push(note);
    }

    // A transaction needs at least a name and amount
    if (!name || !amountRaw) continue;
    // Skip if name starts with "Total"
    if (name.startsWith('Total')) continue;

    const amount = parseAmount(amountRaw);
    if (amount === null) continue;

    const date = parseDate(dateRaw, year) || `${year}-${String(monthNum).padStart(2, '0')}-01`;

    transactions.push({ name, date, amount });
  }

  return { transactions, notes };
}

export function parseBudgetCsv(csvContent: string): ParsedMonth[] {
  const result = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: false,
  });

  const rows = result.data;
  const months: ParsedMonth[] = [];

  let currentYear = new Date().getFullYear();
  let i = 0;

  while (i < rows.length) {
    const row = rows[i];

    // Check for year row
    const year = isYearRow(row);
    if (year !== null) {
      currentYear = year;
      i++;
      continue;
    }

    // Check for month row
    const monthName = isMonthRow(row);
    if (monthName !== null) {
      const monthNum = MONTH_NAMES.indexOf(monthName) + 1;

      // Next row should be category headers, then field headers, then data
      const categoryRow = rows[i + 1] || [];
      const headerRow = rows[i + 2] || [];

      const slices = detectCategorySlices(categoryRow, headerRow);

      // Collect data rows until we hit totals or another month/year
      const dataRows: string[][] = [];
      let j = i + 3; // Start after the Name/Date/Amount header row
      while (j < rows.length) {
        const r = rows[j];
        if (isTotalsRow(r)) {
          j++; // Skip totals row
          break;
        }
        if (isYearRow(r) !== null || isMonthRow(r) !== null) break;
        // Skip completely empty rows at the end
        const hasContent = r.some(c => c && c.trim() !== '');
        if (!hasContent) {
          j++;
          continue;
        }
        dataRows.push(r);
        j++;
      }

      // Extract transactions for each category
      const categories: ParsedCategory[] = slices.map(slice => {
        const { transactions, notes } = extractTransactionsFromRows(
          dataRows, slice, currentYear, monthNum,
        );
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        return {
          name: slice.name,
          transactions,
          total,
          notes: notes.length > 0 ? notes.join('; ') : undefined,
        };
      });

      months.push({
        year: currentYear,
        month: monthNum,
        label: monthName,
        categories,
      });

      i = j;
      continue;
    }

    i++;
  }

  return months;
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}
