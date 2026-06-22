process.env.WS_PORT = '3098';

/**
 * Payroll Module — E2E Tests
 */
import {
  TestContext,
  bootstrapApp,
  teardownApp,
  authPost,
  authGet,
  uniqueEmail,
  uniqueEmployeeId,
} from './helpers';
import { DB_CONNECTION, type Database } from '../src/db';
import {
  employees,
  employeeSalaries,
  attendanceLogs,
  attendanceSettings,
  holidays,
  leaveApplications,
  leaveTypes,
  employeePayslips,
  permissions,
  rolePermissions,
} from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

describe('Payroll Module - Attendance Deductions (e2e)', () => {
  let ctx: TestContext;
  let db: Database;
  let testEmployeeId: string;
  let testDepartmentId: string;
  let testDesignationId: string;
  let unpaidLeaveTypeId: string;
  let testHolidayId: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
    db = ctx.app.get<Database>(DB_CONNECTION);

    // Clean up previous test data if any got left behind from previous aborted runs
    const existingLeaveTypes = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.name, 'E2E Unpaid Leave'));
    for (const lt of existingLeaveTypes) {
      await db.delete(leaveApplications).where(eq(leaveApplications.leaveTypeId, lt.id));
      await db.delete(leaveTypes).where(eq(leaveTypes.id, lt.id));
    }

    const existingEmps = await db
      .select()
      .from(employees)
      .where(eq(employees.phone, '01712345678'));
    for (const emp of existingEmps) {
      await db.delete(employeePayslips).where(eq(employeePayslips.employeeId, emp.id));
      await db.delete(attendanceLogs).where(eq(attendanceLogs.employeeId, emp.id));
      await db.delete(leaveApplications).where(eq(leaveApplications.employeeId, emp.id));
      await db.delete(employeeSalaries).where(eq(employeeSalaries.employeeId, emp.id));
      await db.delete(employees).where(eq(employees.id, emp.id));
    }

    await db.delete(holidays).where(eq(holidays.name, 'E2E Test Holiday'));

    // 1. Grant payroll:read and payroll:write permissions to admin user's role
    const [adminUser] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, 'admin@company.com'))
      .limit(1);

    if (adminUser && adminUser.customRoleId) {
      let [readPerm] = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.resource, 'payroll'),
            eq(permissions.action, 'read'),
          ),
        )
        .limit(1);
      if (!readPerm) {
        [readPerm] = await db
          .insert(permissions)
          .values({
            resource: 'payroll',
            action: 'read',
            description: 'Read payroll',
          })
          .returning();
      }

      let [writePerm] = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.resource, 'payroll'),
            eq(permissions.action, 'write'),
          ),
        )
        .limit(1);
      if (!writePerm) {
        [writePerm] = await db
          .insert(permissions)
          .values({
            resource: 'payroll',
            action: 'write',
            description: 'Write payroll',
          })
          .returning();
      }

      let [updatePerm] = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.resource, 'payroll'),
            eq(permissions.action, 'update'),
          ),
        )
        .limit(1);
      if (!updatePerm) {
        [updatePerm] = await db
          .insert(permissions)
          .values({
            resource: 'payroll',
            action: 'update',
            description: 'Update payroll',
          })
          .returning();
      }

      await db
        .insert(rolePermissions)
        .values([
          { roleKey: adminUser.customRoleId, permissionId: readPerm.id },
          { roleKey: adminUser.customRoleId, permissionId: writePerm.id },
          { roleKey: adminUser.customRoleId, permissionId: updatePerm.id },
        ])
        .onConflictDoNothing();
    }

    // 2. Get active department and designation
    const deptRes = await authGet(ctx, '/departments/options');
    expect(deptRes.status).toBe(200);
    testDepartmentId = deptRes.body.data[0].id;

    const desigRes = await authGet(ctx, '/designations/options');
    expect(desigRes.status).toBe(200);
    testDesignationId = desigRes.body.data[0].id;

    // 3. Create a Leave Type for Unpaid Leave
    const [unpaidLeave] = await db
      .insert(leaveTypes)
      .values({
        name: 'E2E Unpaid Leave',
        days: 10,
        paid: false,
        isActive: true,
      })
      .returning();
    unpaidLeaveTypeId = unpaidLeave.id;
  });

  afterAll(async () => {
    // Perform thorough cleanup in afterAll to prevent database pollution and constraints failure
    if (db) {
      if (testEmployeeId) {
        await db
          .delete(employeePayslips)
          .where(eq(employeePayslips.employeeId, testEmployeeId));
        await db
          .delete(attendanceLogs)
          .where(eq(attendanceLogs.employeeId, testEmployeeId));
        await db
          .delete(leaveApplications)
          .where(eq(leaveApplications.employeeId, testEmployeeId));
        await db
          .delete(employeeSalaries)
          .where(eq(employeeSalaries.employeeId, testEmployeeId));
        await db.delete(employees).where(eq(employees.id, testEmployeeId));
      }
      if (unpaidLeaveTypeId) {
        await db.delete(leaveTypes).where(eq(leaveTypes.id, unpaidLeaveTypeId));
      }
      if (testHolidayId) {
        await db.delete(holidays).where(eq(holidays.id, testHolidayId));
      }
    }
    await teardownApp(ctx);
  });

  it('should calculate and verify attendance deductions correctly on payroll sync', async () => {
    // 1. Create a test employee
    const email = uniqueEmail('test-payroll');
    const empId = uniqueEmployeeId();
    const [emp] = await db
      .insert(employees)
      .values({
        employeeId: empId,
        email,
        personalEmail: uniqueEmail('test-payroll-p'),
        passwordHash: 'fake_hash',
        fullNameEnglish: 'Payroll Test Employee',
        fullNameBangla: 'Payroll Test Employee Bangla',
        phone: '01712345678',
        religion: 'Islam',
        gender: 'Male',
        dateOfBirth: '1995-01-01',
        bloodGroup: 'A+',
        nidNumber: 'NID-PAYROLL-001',
        designationId: testDesignationId,
        departmentId: testDepartmentId,
        employeeType: 'Full-time',
        joinDate: '2026-06-01', // Joined at the start of June 2026
        status: 'active',
        isEmailVerified: true,
      })
      .returning();
    testEmployeeId = emp.id;

    // 2. Assign active salary
    await db.insert(employeeSalaries).values({
      employeeId: testEmployeeId,
      basicSalary: 30000,
      effectiveDate: '2026-06-01',
      pfApplicable: false,
      status: 'active',
    });

    // 3. Set attendanceSettings
    const [existingSettings] = await db
      .select()
      .from(attendanceSettings)
      .where(eq(attendanceSettings.id, 'default'))
      .limit(1);

    if (!existingSettings) {
      await db.insert(attendanceSettings).values({
        id: 'default',
        weeklyHolidays: ['Saturday', 'Sunday'],
        startTime: '09:00',
        halfDayThreshold: 240,
        lateThreshold: 15,
        lateRules: [
          { minMinutes: 16, maxMinutes: 30, penalty: '30 minutes Basic Cut' },
          { minMinutes: 31, maxMinutes: 60, penalty: '1 hour Basic Cut' },
        ],
      });
    } else {
      await db
        .update(attendanceSettings)
        .set({
          weeklyHolidays: ['Saturday', 'Sunday'],
          startTime: '09:00',
          halfDayThreshold: 240,
          lateThreshold: 15,
          lateRules: [
            { minMinutes: 16, maxMinutes: 30, penalty: '30 minutes Basic Cut' },
            { minMinutes: 31, maxMinutes: 60, penalty: '1 hour Basic Cut' },
          ],
        })
        .where(eq(attendanceSettings.id, 'default'));
    }

    // June 2026 details:
    // Calendar days: 30 days
    // Weekends (Saturday/Sunday): 4 Saturdays (6, 13, 20, 27) and 4 Sundays (7, 14, 21, 28) = 8 weekend days.
    // Total working days before public holidays: 30 - 8 = 22.

    // 4. Create one public holiday on a weekday: Monday, June 1, 2026.
    // Total working days will become 22 - 1 = 21.
    const [holiday] = await db
      .insert(holidays)
      .values({
        name: 'E2E Test Holiday',
        startDate: '2026-06-01',
        endDate: '2026-06-01',
      })
      .returning();
    testHolidayId = holiday.id;

    // 5. Create one unpaid leave on a weekday: Tuesday, June 2, 2026.
    await db.insert(leaveApplications).values({
      employeeId: testEmployeeId,
      leaveTypeId: unpaidLeaveTypeId,
      startDate: '2026-06-02',
      endDate: '2026-06-02',
      days: 1,
      reason: 'E2E LWP Test',
      status: 'Approved',
    });

    // 6. Create attendance logs
    // June 3 (Wednesday): Present, normal
    await db.insert(attendanceLogs).values({
      employeeId: testEmployeeId,
      date: '2026-06-03',
      status: 'present',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      hours: 9.0,
    });

    // June 4 (Thursday): Late check-in: 09:45 AM (45 minutes late). Late rule: '1 hour Basic Cut'
    await db.insert(attendanceLogs).values({
      employeeId: testEmployeeId,
      date: '2026-06-04',
      status: 'late',
      checkIn: '09:45 AM',
      checkOut: '06:00 PM',
      hours: 8.25,
    });

    // June 5 (Friday): Half-day: check-in 09:00 AM, checkout 12:00 PM (3 hours worked < 4 hours).
    await db.insert(attendanceLogs).values({
      employeeId: testEmployeeId,
      date: '2026-06-05',
      status: 'present',
      checkIn: '09:00 AM',
      checkOut: '12:00 PM',
      hours: 3.0,
    });

    // June 8 (Monday): Absent log
    await db.insert(attendanceLogs).values({
      employeeId: testEmployeeId,
      date: '2026-06-08',
      status: 'absent',
    });

    // Populate present logs for all other working days in June 2026 up to today,
    // to prevent them from being counted as absent days.
    const todayObj = new Date();
    const todayYear = todayObj.getFullYear();
    const todayMonth = todayObj.getMonth() + 1;
    const maxDay = (todayYear === 2026 && todayMonth === 6) ? todayObj.getDate() : 30;

    for (let d = 1; d <= maxDay; d++) {
      const dateStr = `2026-06-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(2026, 5, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      const skipDays = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-08'];
      if (!isWeekend && !skipDays.includes(dateStr)) {
        await db.insert(attendanceLogs).values({
          employeeId: testEmployeeId,
          date: dateStr,
          status: 'present',
          checkIn: '09:00 AM',
          checkOut: '06:00 PM',
          hours: 9.0,
        });
      }
    }

    // Trigger payroll cycle for June 2026
    const initRes = await authGet(ctx, '/payroll/cycles/2026-06');
    expect(initRes.status).toBe(200);

    const syncRes = await authPost(ctx, '/payroll/cycles/2026-06/sync', {});
    expect(syncRes.status).toBe(201);

    // Fetch test employee's payslip
    const cyclePayslips = syncRes.body.data.payslips;
    const testPayslip = cyclePayslips.find(
      (p: any) => p.employeeId === testEmployeeId,
    );

    expect(testPayslip).toBeDefined();

    // Verify deductions math:
    // Total working days = 21 (30 calendar - 8 weekends - 1 holiday)
    // Basic = 30,000. Fallback allowances: HRA = 20% (6,000), Transport = 10% (3,000), Medical = 5% (1,500).
    // Gross = 30,000 + 6,000 + 3,000 + 1,500 = 40,500.
    // perDayGross = 40,500 / 21 = 1928.5714 => ~1929
    // perDayBasic = 30,000 / 21 = 1428.57 => ~1429
    // perHourBasic = perDayBasic / 8 = 178.57 => ~178.57

    // 1. Absenteeism Cut: 1 day (June 8)
    // absentDeduction = 1 * perDayGross = Math.round(1928.57) = 1929
    expect(testPayslip.deductions['Absenteeism Cut']).toBe(1929);

    // 2. LWP Deduction: 1 day (June 2)
    // lwpDeduction = 1 * perDayGross = Math.round(1928.57) = 1929
    expect(testPayslip.deductions['LWP Deduction']).toBe(1929);

    // 3. Half-Day Cut: 1 half-day (June 5)
    // halfDayDeduction = 0.5 * perDayGross = Math.round(964.28) = 964
    expect(testPayslip.deductions['Half-Day Cut']).toBe(964);

    // 4. Late Penalty: 45 mins late => 1 hour penalty => 1 * perHourBasic = Math.round(178.57) = 179
    expect(testPayslip.deductions['Late Penalty']).toBe(179);

    // Net pay checking:
    // Basic: 30000
    // Allowances: HRA(6000), Transport(3000), Medical(1500) = 10,500 (Gross = 40,500)
    // Deductions: Tax(30000 * 0.12 = 3600) + Absent(1929) + LWP(1929) + HalfDay(964) + Late(179) = 8601
    // NetPay: 30000 + 10500 - 8601 = 31899
    expect(testPayslip.netPay).toBe(31899);
  });
});
