import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Categories that get rolled over
const ROLLOVER_CATEGORIES = ['Income', 'Bills', 'Vanguard', 'Savings', 'Buffer Amount'];

// Categories used to compute Available Fun Money
const PRE_FUN_CATEGORIES = [
  'Income', 'Bills', 'Gas', 'Groceries', 'Restaurants',
  'Other', 'Vanguard', 'Unexpected Expenses', 'Savings', 'Buffer Amount',
];

function updateDateToMonth(dateStr: string, targetYear: number, targetMonth: number): string {
  const parts = dateStr.split('-');
  const day = parseInt(parts[2] || '1', 10);
  const maxDay = new Date(targetYear, targetMonth, 0).getDate();
  const clampedDay = Math.min(day, maxDay);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceMonth, targetMonth } = body;
    // sourceMonth = "2026-03-01", targetMonth = "2026-04-01"

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order');

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: 'No categories found' }, { status: 400 });
    }

    const categoryMap: Record<string, { id: string; name: string }> = {};
    for (const cat of categories) {
      categoryMap[cat.name] = { id: cat.id, name: cat.name };
    }

    // Get source month transactions
    const { data: sourceTxns } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', sourceMonth);

    if (!sourceTxns || sourceTxns.length === 0) {
      return NextResponse.json({ error: `No data found for ${sourceMonth}` }, { status: 400 });
    }

    // Calculate source month totals per category
    const catTotals: Record<string, number> = {};
    const catTxns: Record<string, typeof sourceTxns> = {};
    for (const txn of sourceTxns) {
      const cat = categories.find((c: { id: string }) => c.id === txn.category_id);
      if (!cat) continue;
      catTotals[cat.name] = (catTotals[cat.name] || 0) + Number(txn.amount);
      if (!catTxns[cat.name]) catTxns[cat.name] = [];
      catTxns[cat.name].push(txn);
    }

    // Parse target month
    const targetParts = targetMonth.split('-');
    const targetYear = parseInt(targetParts[0]);
    const targetMo = parseInt(targetParts[1]);

    // Delete existing target month transactions
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)
      .eq('month', targetMonth);

    const inserts: Array<{
      user_id: string;
      category_id: string;
      month: string;
      name: string;
      transaction_date: string;
      amount: number;
      is_recurring: boolean;
    }> = [];

    // 1. Buffer carryover as Income
    const bufferTotal = catTotals['Buffer Amount'] || 0;
    if (bufferTotal !== 0 && categoryMap['Income']) {
      inserts.push({
        user_id: user.id,
        category_id: categoryMap['Income'].id,
        month: targetMonth,
        name: 'Buffer amount',
        transaction_date: `${targetYear}-${String(targetMo).padStart(2, '0')}-01`,
        amount: Math.abs(bufferTotal),
        is_recurring: true,
      });
    }

    // 2. Fun money leftover carryover
    const availableFun = PRE_FUN_CATEGORIES.reduce(
      (sum, name) => sum + (catTotals[name] || 0), 0,
    );
    const funSpentTotal = Math.abs(catTotals["Joel's Fun Spending"] || 0);
    const leftoverFun = availableFun - funSpentTotal;

    if (leftoverFun !== 0 && categoryMap["Joel's Fun Spending"]) {
      inserts.push({
        user_id: user.id,
        category_id: categoryMap["Joel's Fun Spending"].id,
        month: targetMonth,
        name: "Joel's Fun Money debt from last month",
        transaction_date: `${targetYear}-${String(targetMo).padStart(2, '0')}-01`,
        amount: leftoverFun,
        is_recurring: false,
      });
    }

    // 3. Copy rollover categories
    for (const catName of ROLLOVER_CATEGORIES) {
      const cat = categoryMap[catName];
      if (!cat) continue;
      const txns = catTxns[catName] || [];

      if (catName === 'Savings' && txns.length === 0) {
        const savingsEntries = [
          { name: 'Barclays Main Savings', amount: -700 },
          { name: 'Barclays Vacation Savings', amount: -200 },
          { name: 'Vanguard Emergency Savings', amount: -200 },
          { name: 'Tattoo Savings', amount: -400 },
        ];
        for (const entry of savingsEntries) {
          inserts.push({
            user_id: user.id,
            category_id: cat.id,
            month: targetMonth,
            name: entry.name,
            transaction_date: `${targetYear}-${String(targetMo).padStart(2, '0')}-27`,
            amount: entry.amount,
            is_recurring: true,
          });
        }
      } else {
        for (const txn of txns) {
          inserts.push({
            user_id: user.id,
            category_id: cat.id,
            month: targetMonth,
            name: txn.name,
            transaction_date: updateDateToMonth(txn.transaction_date, targetYear, targetMo),
            amount: Number(txn.amount),
            is_recurring: true,
          });
        }
      }
    }

    // Insert all
    if (inserts.length > 0) {
      const { error: insertErr } = await supabase
        .from('transactions')
        .insert(inserts);
      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      inserted: inserts.length,
      bufferCarryover: Math.abs(bufferTotal),
      funMoneyLeftover: leftoverFun,
      summary: {
        source: sourceMonth,
        target: targetMonth,
        categoriesRolled: ROLLOVER_CATEGORIES,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
