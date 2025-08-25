import {
  users,
  personalityTests,
  testSessions,
  testResponses,
  personalityResults,
  aiConversations,
  type User,
  type UpsertUser,
  type PersonalityTest,
  type InsertPersonalityTest,
  type TestSession,
  type InsertTestSession,
  type TestResponse,
  type InsertTestResponse,
  type PersonalityResult,
  type InsertPersonalityResult,
  type AiConversation,
  type InsertAiConversation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Personality test operations
  getPersonalityTests(): Promise<PersonalityTest[]>;
  getPersonalityTestById(id: string): Promise<PersonalityTest | undefined>;
  createPersonalityTest(test: InsertPersonalityTest): Promise<PersonalityTest>;
  
  // Test session operations
  getTestSession(id: string): Promise<TestSession | undefined>;
  getUserTestSessions(userId: string): Promise<TestSession[]>;
  createTestSession(session: InsertTestSession): Promise<TestSession>;
  updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession>;
  
  // Test response operations
  createTestResponse(response: InsertTestResponse): Promise<TestResponse>;
  getSessionResponses(sessionId: string): Promise<TestResponse[]>;
  
  // Personality results operations
  createPersonalityResult(result: InsertPersonalityResult): Promise<PersonalityResult>;
  getUserPersonalityResults(userId: string): Promise<PersonalityResult[]>;
  getLatestPersonalityResult(userId: string, testType?: string): Promise<PersonalityResult | undefined>;
  
  // AI conversation operations
  createAiMessage(message: InsertAiConversation): Promise<AiConversation>;
  getUserConversationHistory(userId: string, limit?: number): Promise<AiConversation[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Personality test operations
  async getPersonalityTests(): Promise<PersonalityTest[]> {
    return await db.select().from(personalityTests);
  }

  async getPersonalityTestById(id: string): Promise<PersonalityTest | undefined> {
    const [test] = await db.select().from(personalityTests).where(eq(personalityTests.id, id));
    return test;
  }

  async createPersonalityTest(test: InsertPersonalityTest): Promise<PersonalityTest> {
    const [newTest] = await db.insert(personalityTests).values(test).returning();
    return newTest;
  }

  // Test session operations
  async getTestSession(id: string): Promise<TestSession | undefined> {
    const [session] = await db.select().from(testSessions).where(eq(testSessions.id, id));
    return session;
  }

  async getUserTestSessions(userId: string): Promise<TestSession[]> {
    return await db
      .select()
      .from(testSessions)
      .where(eq(testSessions.userId, userId))
      .orderBy(desc(testSessions.startedAt));
  }

  async createTestSession(session: InsertTestSession): Promise<TestSession> {
    const [newSession] = await db.insert(testSessions).values(session).returning();
    return newSession;
  }

  async updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession> {
    const [updatedSession] = await db
      .update(testSessions)
      .set(updates)
      .where(eq(testSessions.id, id))
      .returning();
    return updatedSession;
  }

  // Test response operations
  async createTestResponse(response: InsertTestResponse): Promise<TestResponse> {
    const [newResponse] = await db.insert(testResponses).values(response).returning();
    return newResponse;
  }

  async getSessionResponses(sessionId: string): Promise<TestResponse[]> {
    return await db
      .select()
      .from(testResponses)
      .where(eq(testResponses.sessionId, sessionId))
      .orderBy(testResponses.questionIndex);
  }

  // Personality results operations
  async createPersonalityResult(result: InsertPersonalityResult): Promise<PersonalityResult> {
    const [newResult] = await db.insert(personalityResults).values(result).returning();
    return newResult;
  }

  async getUserPersonalityResults(userId: string): Promise<PersonalityResult[]> {
    return await db
      .select()
      .from(personalityResults)
      .where(eq(personalityResults.userId, userId))
      .orderBy(desc(personalityResults.createdAt));
  }

  async getLatestPersonalityResult(userId: string, testType?: string): Promise<PersonalityResult | undefined> {
    let whereCondition;

    if (testType) {
      whereCondition = and(
        eq(personalityResults.userId, userId),
        eq(personalityResults.testType, testType)
      );
    } else {
      whereCondition = eq(personalityResults.userId, userId);
    }

    const [result] = await db
      .select()
      .from(personalityResults)
      .where(whereCondition)
      .orderBy(desc(personalityResults.createdAt))
      .limit(1);
    
    return result;
  }

  // AI conversation operations
  async createAiMessage(message: InsertAiConversation): Promise<AiConversation> {
    const [newMessage] = await db.insert(aiConversations).values(message).returning();
    return newMessage;
  }

  async getUserConversationHistory(userId: string, limit = 50): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
