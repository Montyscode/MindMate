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

// In-memory storage fallback when no database is available
const memoryStore = {
  users: new Map<string, any>(),
  tests: new Map<string, any>(),
  sessions: new Map<string, any>(),
  responses: new Map<string, any[]>(),
  results: new Map<string, any[]>(),
  conversations: new Map<string, any[]>(),
};
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
    if (!db) {
      return memoryStore.users.get(id);
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!db) {
      const user = { 
        ...userData, 
        id: userData.id || 'demo-user-001',
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      memoryStore.users.set(user.id, user);
      return user as User;
    }
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
    if (!db) {
      return Array.from(memoryStore.tests.values());
    }
    return await db.select().from(personalityTests);
  }

  async getPersonalityTestById(id: string): Promise<PersonalityTest | undefined> {
    if (!db) {
      return memoryStore.tests.get(id) || this.getDefaultBigFiveTest();
    }
    const [test] = await db.select().from(personalityTests).where(eq(personalityTests.id, id));
    return test || this.getDefaultBigFiveTest();
  }

  async createPersonalityTest(test: InsertPersonalityTest): Promise<PersonalityTest> {
    if (!db) {
      const newTest = { 
        ...test, 
        id: test.name?.toLowerCase().replace(/\s+/g, '-') || 'test-' + Date.now(),
        createdAt: new Date() 
      };
      memoryStore.tests.set(newTest.id, newTest);
      return newTest as PersonalityTest;
    }
    const [newTest] = await db.insert(personalityTests).values(test).returning();
    return newTest;
  }

  private getDefaultBigFiveTest(): PersonalityTest {
    return {
      id: 'big-five-default',
      name: 'Big Five Personality Assessment',
      description: 'A comprehensive personality test based on the scientifically validated Big Five model.',
      type: 'big-five',
      questions: [
        { text: "I am usually the one who initiates conversations at social gatherings.", trait: "extraversion" },
        { text: "I often feel worried about things that might go wrong.", trait: "neuroticism" },
        { text: "I enjoy trying new and unfamiliar experiences.", trait: "openness" },
        { text: "I try to be considerate of other people's feelings.", trait: "agreeableness" },
        { text: "I like to keep my workspace organized and tidy.", trait: "conscientiousness" },
        { text: "I feel comfortable being the center of attention.", trait: "extraversion" },
        { text: "I rarely feel anxious or stressed about things.", trait: "neuroticism" },
        { text: "I prefer routine and predictable situations.", trait: "openness" },
        { text: "I sometimes find it difficult to trust other people.", trait: "agreeableness" },
        { text: "I always complete tasks on time.", trait: "conscientiousness" },
        { text: "I enjoy meeting new people and making friends.", trait: "extraversion" },
        { text: "I often worry about making mistakes.", trait: "neuroticism" },
        { text: "I appreciate art and creative expression.", trait: "openness" },
        { text: "I enjoy helping others without expecting anything in return.", trait: "agreeableness" },
        { text: "I set goals and work systematically toward achieving them.", trait: "conscientiousness" },
        { text: "I prefer quiet activities to loud, social events.", trait: "extraversion" },
        { text: "I remain calm under pressure.", trait: "neuroticism" },
        { text: "I like to explore new ideas and concepts.", trait: "openness" },
        { text: "I forgive others easily when they make mistakes.", trait: "agreeableness" },
        { text: "I tend to procrastinate on important tasks.", trait: "conscientiousness" }
      ] as any,
      createdAt: new Date(),
    };
  }

  // Test session operations
  async getTestSession(id: string): Promise<TestSession | undefined> {
    if (!db) {
      return memoryStore.sessions.get(id);
    }
    const [session] = await db.select().from(testSessions).where(eq(testSessions.id, id));
    return session;
  }

  async getUserTestSessions(userId: string): Promise<TestSession[]> {
    if (!db) {
      return Array.from(memoryStore.sessions.values()).filter((s: any) => s.userId === userId);
    }
    return await db
      .select()
      .from(testSessions)
      .where(eq(testSessions.userId, userId))
      .orderBy(desc(testSessions.startedAt));
  }

  async createTestSession(session: InsertTestSession): Promise<TestSession> {
    if (!db) {
      const newSession = {
        ...session,
        id: 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        startedAt: new Date(),
        completedAt: null
      };
      memoryStore.sessions.set(newSession.id, newSession);
      return newSession as TestSession;
    }
    const [newSession] = await db.insert(testSessions).values(session).returning();
    return newSession;
  }

  async updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession> {
    if (!db) {
      const existing = memoryStore.sessions.get(id);
      if (!existing) throw new Error('Session not found');
      const updated = { ...existing, ...updates };
      memoryStore.sessions.set(id, updated);
      return updated;
    }
    const [updatedSession] = await db
      .update(testSessions)
      .set(updates)
      .where(eq(testSessions.id, id))
      .returning();
    return updatedSession;
  }

  // Test response operations
  async createTestResponse(response: InsertTestResponse): Promise<TestResponse> {
    if (!db) {
      const newResponse = {
        ...response,
        id: 'response-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date()
      };
      if (!memoryStore.responses.has(response.sessionId)) {
        memoryStore.responses.set(response.sessionId, []);
      }
      memoryStore.responses.get(response.sessionId)!.push(newResponse);
      return newResponse as TestResponse;
    }
    const [newResponse] = await db.insert(testResponses).values(response).returning();
    return newResponse;
  }

  async getSessionResponses(sessionId: string): Promise<TestResponse[]> {
    if (!db) {
      return memoryStore.responses.get(sessionId) || [];
    }
    return await db
      .select()
      .from(testResponses)
      .where(eq(testResponses.sessionId, sessionId))
      .orderBy(testResponses.questionIndex);
  }

  // Personality results operations
  async createPersonalityResult(result: InsertPersonalityResult): Promise<PersonalityResult> {
    if (!db) {
      const newResult = {
        ...result,
        id: 'result-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date()
      };
      if (!memoryStore.results.has(result.userId)) {
        memoryStore.results.set(result.userId, []);
      }
      memoryStore.results.get(result.userId)!.push(newResult);
      return newResult as PersonalityResult;
    }
    const [newResult] = await db.insert(personalityResults).values(result).returning();
    return newResult;
  }

  async getUserPersonalityResults(userId: string): Promise<PersonalityResult[]> {
    if (!db) {
      return memoryStore.results.get(userId) || [];
    }
    return await db
      .select()
      .from(personalityResults)
      .where(eq(personalityResults.userId, userId))
      .orderBy(desc(personalityResults.createdAt));
  }

  async getLatestPersonalityResult(userId: string, testType?: string): Promise<PersonalityResult | undefined> {
    if (!db) {
      const userResults = memoryStore.results.get(userId) || [];
      const filtered = testType ? userResults.filter((r: any) => r.testType === testType) : userResults;
      return filtered.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    }

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
    if (!db) {
      const newMessage = {
        ...message,
        id: 'conversation-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date()
      };
      if (!memoryStore.conversations.has(message.userId)) {
        memoryStore.conversations.set(message.userId, []);
      }
      memoryStore.conversations.get(message.userId)!.push(newMessage);
      return newMessage as AiConversation;
    }
    const [newMessage] = await db.insert(aiConversations).values(message).returning();
    return newMessage;
  }

  async getUserConversationHistory(userId: string, limit = 50): Promise<AiConversation[]> {
    if (!db) {
      const userConversations = memoryStore.conversations.get(userId) || [];
      return userConversations
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
