export const parseReportDateRange = (period, startDate, endDate) => {
  const now = new Date();
  let start = null;
  let end = new Date(now);

  if (startDate) {
    start = new Date(startDate);
    if (endDate) end = new Date(endDate);
    return { start, end };
  }

  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (period === "this_week") {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else if (period === "this_month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  } else if (period === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (period === "this_year") {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
  } else {
    start = new Date(0);
  }

  return { start, end };
};

export const aggregateCategoryExpenses = (expenses) => {
  const categoryMap = {};
  let total = 0;
  for (const exp of expenses) {
    const cat = exp.category || "General / Misc";
    const amt = Number(exp.amount) || 0;
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    total += amt;
  }
  return {
    total,
    byCategory: Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    })),
  };
};
