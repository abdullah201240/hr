import {
  pgTable,
  varchar,
  text,
  date,
  boolean,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';

// ─── Job Openings ───────────────────────────────────────────────────────────

export const jobOpenings = pgTable(
  'job_openings',
  {
    ...baseTable,
    title: varchar('title', { length: 255 }).notNull(),
    department: varchar('department', { length: 255 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    experience: varchar('experience', { length: 100 }).notNull(),
    description: text('description').default('').notNull(),
    status: varchar('status', { length: 50 }).default('Open').notNull(), // Open | Closed
    dateOpened: date('date_opened').notNull(),
  },
  (table) => [
    index('job_openings_status_idx').on(table.status),
    index('job_openings_department_idx').on(table.department),
  ],
);

// ─── Candidates ─────────────────────────────────────────────────────────────

export const candidates = pgTable(
  'candidates',
  {
    ...baseTable,
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    linkedIn: varchar('linkedin', { length: 255 }),
    resumeUrl: text('resume_url'),
    role: varchar('role', { length: 255 }).notNull(),
    source: varchar('source', { length: 100 }).notNull(),
    stage: varchar('stage', { length: 50 }).default('Applied').notNull(), // Applied | Screening | Interview | Technical | Offer | Hired | Rejected
    appliedDate: date('applied_date').notNull(),
    notes: text('notes').default('').notNull(),
    interviewDate: date('interview_date'),
    interviewTime: varchar('interview_time', { length: 50 }),
    interviewLocation: varchar('interview_location', { length: 255 }),
    offerLetterGenerated: boolean('offer_letter_generated').default(false).notNull(),
    joiningLetterGenerated: boolean('joining_letter_generated').default(false).notNull(),
    offeredSalary: varchar('offered_salary', { length: 100 }),
    offeredStartDate: date('offered_start_date'),
    joiningManager: varchar('joining_manager', { length: 255 }),
  },
  (table) => [
    index('candidates_stage_idx').on(table.stage),
    index('candidates_email_idx').on(table.email),
  ],
);

// ─── Candidate Stage History ──────────────────────────────────────────────────

export const candidateStageHistories = pgTable(
  'candidate_stage_histories',
  {
    ...baseTable,
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    stage: varchar('stage', { length: 50 }).notNull(),
    date: date('date').notNull(),
  },
  (table) => [
    index('candidate_stage_histories_candidate_idx').on(table.candidateId),
  ],
);

// ─── Onboarding Hires ────────────────────────────────────────────────────────

export const onboardingHires = pgTable(
  'onboarding_hires',
  {
    ...baseTable,
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 255 }).notNull(),
    department: varchar('department', { length: 255 }).notNull(),
    startDate: date('start_date').notNull(),
  },
  (table) => [
    index('onboarding_hires_candidate_idx').on(table.candidateId),
  ],
);

// ─── Onboarding Tasks ────────────────────────────────────────────────────────

export const onboardingTasks = pgTable(
  'onboarding_tasks',
  {
    ...baseTable,
    hireId: uuid('hire_id')
      .notNull()
      .references(() => onboardingHires.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    completed: boolean('completed').default(false).notNull(),
  },
  (table) => [
    index('onboarding_tasks_hire_idx').on(table.hireId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const candidatesRelations = relations(candidates, ({ many }) => ({
  stageHistory: many(candidateStageHistories),
  onboarding: many(onboardingHires),
}));

export const candidateStageHistoriesRelations = relations(
  candidateStageHistories,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateStageHistories.candidateId],
      references: [candidates.id],
    }),
  }),
);

export const onboardingHiresRelations = relations(onboardingHires, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [onboardingHires.candidateId],
    references: [candidates.id],
  }),
  tasks: many(onboardingTasks),
}));

export const onboardingTasksRelations = relations(onboardingTasks, ({ one }) => ({
  hire: one(onboardingHires, {
    fields: [onboardingTasks.hireId],
    references: [onboardingHires.id],
  }),
}));
