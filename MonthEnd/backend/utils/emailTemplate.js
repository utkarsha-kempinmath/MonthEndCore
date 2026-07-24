function generateEmailHTML(report, tone = "supportive") {
  const topCategories = report.categories
    ?.sort((a, b) => b.amount - a.amount)
    .slice(0, 3) || [];

  return `
  <div style="font-family: Arial; padding: 24px; max-width: 600px; margin: auto; line-height: 1.6;">
    
    <h2 style="color: #333;">Monthly Financial Update</h2>

    <p style="color: #555;">
      ${report.reflection || "Here's a gentle overview of your child's financial journey this month."}
    </p>

    ${
      report.summary
        ? `
      <h3 style="margin-top: 20px;">Overview</h3>
      <p>• Total Spent: ₹${report.summary.totalSpent}</p>
      <p>• Remaining Balance: ₹${report.summary.remaining}</p>
      <p>• Risk Level: ${report.summary.riskLevel}</p>
    `
        : ""
    }

    ${
      topCategories.length
        ? `
      <h3 style="margin-top: 20px;">Top Spending Areas</h3>
      ${topCategories
        .map((c) => `<p>• ${c.category}: ₹${c.amount}</p>`)
        .join("")}
      
      <p style="color: #555;">
        ${report.topCategoryInsight || ""}
      </p>
    `
        : ""
    }

    ${
      report.events?.length
        ? `
      <h3 style="margin-top: 20px;">Spending Around Events</h3>
      ${report.events
        .map((e) => `<p>• ${e.event}: ₹${e.amount}</p>`)
        .join("")}

      <p style="color: #555;">
        ${report.eventInsight || ""}
      </p>
    `
        : ""
    }

    ${
      report.summary?.riskLevel
        ? `
      <h3 style="margin-top: 20px;">Behavior Insight</h3>
      <p>
        ${
          report.summary.riskLevel === "low"
            ? "Spending appears stable and controlled with no strong signs of impulsive behavior."
            : report.summary.riskLevel === "moderate"
            ? "There are occasional fluctuations in spending that may indicate some impulsive decisions."
            : "Spending shows high variability and may need closer attention."
        }
      </p>
    `
        : ""
    }

    <hr style="margin: 20px 0;" />

    <p style="color: gray; font-size: 13px;">
      This report is designed to provide supportive visibility, not judgment.
    </p>

  </div>
  `;
}

module.exports = { generateEmailHTML };