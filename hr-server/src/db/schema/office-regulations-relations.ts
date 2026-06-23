import { relations } from 'drizzle-orm';
import { regulationPolicies, regulationRequests } from './office-regulations';
import { employees } from './employee';

export const regulationPoliciesRelations = relations(
  regulationPolicies,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [regulationPolicies.createdById],
      references: [employees.id],
      relationName: 'policyCreator',
    }),
    updatedBy: one(employees, {
      fields: [regulationPolicies.updatedById],
      references: [employees.id],
      relationName: 'policyUpdater',
    }),
    requests: many(regulationRequests),
  })
);

export const regulationRequestsRelations = relations(
  regulationRequests,
  ({ one }) => ({
    policy: one(regulationPolicies, {
      fields: [regulationRequests.policyId],
      references: [regulationPolicies.id],
    }),
    employee: one(employees, {
      fields: [regulationRequests.employeeId],
      references: [employees.id],
      relationName: 'employeeRegulationRequests',
    }),
    firstApprovedBy: one(employees, {
      fields: [regulationRequests.firstApprovedById],
      references: [employees.id],
      relationName: 'regulationFirstApprover',
    }),
    finalApprovedBy: one(employees, {
      fields: [regulationRequests.finalApprovedById],
      references: [employees.id],
      relationName: 'regulationFinalApprover',
    }),
    createdBy: one(employees, {
      fields: [regulationRequests.createdById],
      references: [employees.id],
      relationName: 'requestCreator',
    }),
    updatedBy: one(employees, {
      fields: [regulationRequests.updatedById],
      references: [employees.id],
      relationName: 'requestUpdater',
    }),
  })
);
