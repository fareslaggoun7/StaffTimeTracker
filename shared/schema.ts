import { pgTable, text, serial, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isOvernight: boolean("is_overnight").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const punchRecords = pgTable("punch_records", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  firstName: text("first_name").notNull(),
  department: text("department").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  time: text("time").notNull(), // HH:MM format
  punchState: text("punch_state").notNull(), // "Check In" or "Check Out"
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const processedRecords = pgTable("processed_records", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  firstName: text("first_name").notNull(),
  department: text("department").notNull(),
  date: text("date").notNull(),
  shiftCode: text("shift_code"),
  shiftStartDateTime: text("shift_start_datetime"),
  shiftEndDateTime: text("shift_end_datetime"),
  actualCheckIn: text("actual_check_in"),
  actualCheckOut: text("actual_check_out"),
  status: text("status").notNull(), // "On-Time", "Late", "Unmatched"
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const processingSettings = pgTable("processing_settings", {
  id: serial("id").primaryKey(),
  gracePeriodMinutes: integer("grace_period_minutes").notNull().default(15),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

export const insertPunchRecordSchema = createInsertSchema(punchRecords).omit({
  id: true,
  createdAt: true,
});

export const insertProcessedRecordSchema = createInsertSchema(processedRecords).omit({
  id: true,
  createdAt: true,
});

export const insertProcessingSettingsSchema = createInsertSchema(processingSettings).omit({
  id: true,
  createdAt: true,
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type PunchRecord = typeof punchRecords.$inferSelect;
export type InsertPunchRecord = z.infer<typeof insertPunchRecordSchema>;
export type ProcessedRecord = typeof processedRecords.$inferSelect;
export type InsertProcessedRecord = z.infer<typeof insertProcessedRecordSchema>;
export type ProcessingSettings = typeof processingSettings.$inferSelect;
export type InsertProcessingSettings = z.infer<typeof insertProcessingSettingsSchema>;

// Additional types for frontend
export type ProcessingStats = {
  total: number;
  matched: number;
  late: number;
  unmatched: number;
};

export type ProcessingProgress = {
  current: number;
  total: number;
  message: string;
  percentage: number;
};

export type ExportFormat = 'excel' | 'csv' | 'pdf';

export type ExportOptions = {
  format: ExportFormat;
  includeSummary: boolean;
  includeUnmatched: boolean;
  includeProcessingLog: boolean;
};
