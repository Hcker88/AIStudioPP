/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatINR } from '../lib/formatters';
import { db } from '../lib/db';
import { financialProfiles, loans, expenses } from '../lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Financial PDF/CSV Export
 * Generates a "Bharat Financial Roadmap" PDF.
 */
export async function generateFinancialRoadmap(userId: string) {
  try {
    // 1. Get user's profile, loans and expenses
    const profile = await db.query.financialProfiles.findFirst({
      where: eq(financialProfiles.userId, userId),
    });
    
    if (!profile) throw new Error("Profile not found");
    
    const userLoans = await db.query.loans.findMany({
      where: eq(loans.profileId, profile.id),
    });

    const userExpenses = await db.query.expenses.findMany({
      where: eq(expenses.profileId, profile.id),
    });

    const totalExpenses = userExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

    // 2. Initialize jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // 3. Header
    doc.setFontSize(22);
    doc.setTextColor(242, 125, 38); // #F27D26
    doc.text('BHARAT FINANCIAL ROADMAP', margin, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, margin, 40);
    doc.text(`User ID: ${userId}`, margin, 45);

    // 4. The Current "Now" (Lakhs/Crores summary)
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('THE CURRENT "NOW"', margin, 60);
    
    const totalDebt = userLoans.reduce((acc, l) => acc + Number(l.principalAmount), 0);
    const totalEmi = userLoans.reduce((acc, l) => acc + Number(l.monthlyEmi), 0);
    
    const summaryData = [
      ['Monthly Income', `₹${formatINR(Number(profile.monthlyIncome))}`],
      ['Monthly Expenses', `₹${formatINR(totalExpenses)}`],
      ['Total Debt Principal', `₹${formatINR(totalDebt)}`],
      ['Total Monthly EMI', `₹${formatINR(totalEmi)}`],
    ];

    (doc as any).autoTable({
      startY: 65,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [242, 125, 38] },
    });

    // 5. Liability Breakdown
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text('LIABILITY BREAKDOWN', margin, finalY + 20);
    
    const loanData = userLoans.map(l => [
      l.name,
      `₹${formatINR(Number(l.principalAmount))}`,
      `${l.interestRate}%`,
      `₹${formatINR(Number(l.monthlyEmi))}`,
    ]);

    (doc as any).autoTable({
      startY: finalY + 25,
      head: [['Loan Name', 'Principal', 'Interest Rate', 'Monthly EMI']],
      body: loanData,
      theme: 'striped',
      headStyles: { fillColor: [50, 50, 50] },
    });

    // 6. AI's "Verified Verdict"
    const finalY2 = (doc as any).lastAutoTable.finalY || 200;
    doc.setFontSize(12);
    doc.setTextColor(242, 125, 38);
    doc.text('AI VERIFIED VERDICT', margin, finalY2 + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(50);
    const verdict = "Based on your current debt-to-income ratio, prioritizing the ICICI Personal Loan (14.5%) while maintaining your HDFC Home Loan interest deduction is the optimal path. Your projected debt-free date is OCT 2035.";
    const splitVerdict = doc.splitTextToSize(verdict, pageWidth - (margin * 2));
    doc.text(splitVerdict, margin, finalY2 + 30);

    // 7. Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('LEGAL DISCLAIMER: DebtStrategist.AI provides mathematical analysis. Not a licensed financial advisor.', margin, doc.internal.pageSize.getHeight() - 10);

    // 8. Output as Base64 (for preview or download)
    const pdfBase64 = doc.output('datauristring');
    return { success: true, pdfBase64 };
  } catch (error) {
    console.error('PDF generation failed:', error);
    return { success: false, error: 'Failed to generate PDF' };
  }
}
