import { sql, relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Personality tests table
export const personalityTests = pgTable("personality_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // 'big-five', 'mbti', 'emotional-intelligence'
  questions: jsonb("questions").notNull(), // Array of question objects
  createdAt: timestamp("created_at").defaultNow(),
});

// Test sessions table - tracks user progress through tests
export const testSessions = pgTable("test_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  testId: varchar("test_id").notNull().references(() => personalityTests.id, { onDelete: 'cascade' }),
  currentQuestion: integer("current_question").default(0),
  totalQuestions: integer("total_questions").notNull(),
  isCompleted: text("is_completed").default('false'), // Using text instead of boolean for better compatibility
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Test responses table - stores individual question responses
export const testResponses = pgTable("test_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => testSessions.id, { onDelete: 'cascade' }),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  response: integer("response").notNull(), // 1-5 scale typically
  trait: varchar("trait"), // e.g., 'extraversion', 'agreeableness', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Personality results table - stores calculated personality profiles
export const personalityResults = pgTable("personality_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id").notNull().references(() => testSessions.id, { onDelete: 'cascade' }),
  testType: varchar("test_type").notNull(),
  scores: jsonb("scores").notNull(), // e.g., { extraversion: 4.2, agreeableness: 3.8, ... }
  personalityType: varchar("personality_type"), // For MBTI-style results
  createdAt: timestamp("created_at").defaultNow(),
});

// AI conversations table - stores chat history with AI companion
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  isFromUser: text("is_from_user").notNull(), // 'true' or 'false'
  personalityContext: jsonb("personality_context"), // User's personality scores for context
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  testSessions: many(testSessions),
  personalityResults: many(personalityResults),
  aiConversations: many(aiConversations),
}));

export const personalityTestsRelations = relations(personalityTests, ({ many }) => ({
  testSessions: many(testSessions),
}));

export const testSessionsRelations = relations(testSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [testSessions.userId],
    references: [users.id],
  }),
  test: one(personalityTests, {
    fields: [testSessions.testId],
    references: [personalityTests.id],
  }),
  responses: many(testResponses),
  results: many(personalityResults),
}));

export const testResponsesRelations = relations(testResponses, ({ one }) => ({
  session: one(testSessions, {
    fields: [testResponses.sessionId],
    references: [testSessions.id],
  }),
}));

export const personalityResultsRelations = relations(personalityResults, ({ one }) => ({
  user: one(users, {
    fields: [personalityResults.userId],
    references: [users.id],
  }),
  session: one(testSessions, {
    fields: [personalityResults.sessionId],
    references: [testSessions.id],
  }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonalityTestSchema = createInsertSchema(personalityTests).omit({
  id: true,
  createdAt: true,
});

export const insertTestSessionSchema = createInsertSchema(testSessions).omit({
  id: true,
  startedAt: true,
});

export const insertTestResponseSchema = createInsertSchema(testResponses).omit({
  id: true,
  createdAt: true,
});

export const insertPersonalityResultSchema = createInsertSchema(personalityResults).omit({
  id: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type PersonalityTest = typeof personalityTests.$inferSelect;
export type InsertPersonalityTest = z.infer<typeof insertPersonalityTestSchema>;
export type TestSession = typeof testSessions.$inferSelect;
export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;
export type TestResponse = typeof testResponses.$inferSelect;
export type InsertTestResponse = z.infer<typeof insertTestResponseSchema>;
export type PersonalityResult = typeof personalityResults.$inferSelect;
export type InsertPersonalityResult = z.infer<typeof insertPersonalityResultSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
