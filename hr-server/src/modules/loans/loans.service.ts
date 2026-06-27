import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { loans, loanPayments, employees } from '../../db/schema';

@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async createLoanRequest(employeeId: string, amount: number, termMonths: number, reason: string) {
    // Check if employee already has an active loan (Approved or Disbursed)
    const existingActiveLoans = await this.db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.employeeId, employeeId),
          sql`${loans.status} IN ('Approved', 'Disbursed')`
        )
      );

    if (existingActiveLoans.length > 0) {
      throw new BadRequestException(
        'You already have an active loan request or disbursed loan in progress. Please settle it first.'
      );
    }

    const monthlyInstallment = Math.round(amount / termMonths);

    const [newLoan] = await this.db
      .insert(loans)
      .values({
        employeeId,
        amount,
        reason,
        interestRate: 0, // 0% interest default
        termMonths,
        monthlyInstallment,
        remainingBalance: amount,
        status: 'Pending',
      })
      .returning();

    return newLoan;
  }

  async getLoans(employeeId?: string) {
    const conditions = [];
    if (employeeId) {
      conditions.push(eq(loans.employeeId, employeeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select({
        id: loans.id,
        employeeId: loans.employeeId,
        fullName: employees.fullNameEnglish,
        employeeDisplayId: employees.employeeId,
        amount: loans.amount,
        reason: loans.reason,
        termMonths: loans.termMonths,
        monthlyInstallment: loans.monthlyInstallment,
        remainingBalance: loans.remainingBalance,
        status: loans.status,
        remarks: loans.remarks,
        approvedAt: loans.approvedAt,
        disbursedAt: loans.disbursedAt,
        createdAt: loans.createdAt,
      })
      .from(loans)
      .innerJoin(employees, eq(loans.employeeId, employees.id))
      .where(whereClause)
      .orderBy(desc(loans.createdAt));
  }

  async getLoanDetails(id: string) {
    const [loanRecord] = await this.db
      .select({
        id: loans.id,
        employeeId: loans.employeeId,
        fullName: employees.fullNameEnglish,
        employeeDisplayId: employees.employeeId,
        amount: loans.amount,
        reason: loans.reason,
        interestRate: loans.interestRate,
        termMonths: loans.termMonths,
        monthlyInstallment: loans.monthlyInstallment,
        remainingBalance: loans.remainingBalance,
        status: loans.status,
        remarks: loans.remarks,
        approvedAt: loans.approvedAt,
        disbursedAt: loans.disbursedAt,
        createdAt: loans.createdAt,
      })
      .from(loans)
      .innerJoin(employees, eq(loans.employeeId, employees.id))
      .where(eq(loans.id, id))
      .limit(1);

    if (!loanRecord) {
      throw new NotFoundException(`Loan record with ID ${id} not found`);
    }

    const payments = await this.db
      .select()
      .from(loanPayments)
      .where(eq(loanPayments.loanId, id))
      .orderBy(desc(loanPayments.paymentDate));

    return {
      ...loanRecord,
      payments,
    };
  }

  async processLoanRequest(id: string, status: 'Approved' | 'Rejected', remarks: string, approvedById: string) {
    const [loanRecord] = await this.db.select().from(loans).where(eq(loans.id, id)).limit(1);
    if (!loanRecord) {
      throw new NotFoundException(`Loan record with ID ${id} not found`);
    }

    if (loanRecord.status !== 'Pending') {
      throw new BadRequestException(`Loan request has already been ${loanRecord.status.toLowerCase()}`);
    }

    const [updated] = await this.db
      .update(loans)
      .set({
        status,
        remarks: remarks || null,
        approvedById,
        approvedAt: new Date(),
      })
      .where(eq(loans.id, id))
      .returning();

    return updated;
  }

  async disburseLoan(id: string, disbursedById: string) {
    const [loanRecord] = await this.db.select().from(loans).where(eq(loans.id, id)).limit(1);
    if (!loanRecord) {
      throw new NotFoundException(`Loan record with ID ${id} not found`);
    }

    if (loanRecord.status !== 'Approved') {
      throw new BadRequestException(`Loan must be approved before disbursement. Current status: ${loanRecord.status}`);
    }

    const [updated] = await this.db
      .update(loans)
      .set({
        status: 'Disbursed',
        disbursedById,
        disbursedAt: new Date(),
        remainingBalance: loanRecord.amount,
      })
      .where(eq(loans.id, id))
      .returning();

    return updated;
  }

  async recordPayment(loanId: string, amount: number, paymentMethod: string, remarks?: string, payslipId?: string) {
    const [loanRecord] = await this.db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
    if (!loanRecord) {
      throw new NotFoundException(`Loan record with ID ${loanId} not found`);
    }

    if (loanRecord.status !== 'Disbursed') {
      throw new BadRequestException('Payments can only be logged against disbursed active loans');
    }

    const newBalance = Math.max(0, loanRecord.remainingBalance - amount);
    const finalStatus = newBalance <= 0 ? 'Repaid' : 'Disbursed';

    const [paymentRecord] = await this.db
      .insert(loanPayments)
      .values({
        loanId,
        payslipId: payslipId || null,
        amount,
        paymentMethod,
        remarks: remarks || null,
      })
      .returning();

    await this.db
      .update(loans)
      .set({
        remainingBalance: newBalance,
        status: finalStatus,
      })
      .where(eq(loans.id, loanId));

    return {
      payment: paymentRecord,
      remainingBalance: newBalance,
      status: finalStatus,
    };
  }
}
