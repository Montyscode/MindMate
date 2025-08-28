var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiConversations: () => aiConversations,
  aiConversationsRelations: () => aiConversationsRelations,
  insertAiConversationSchema: () => insertAiConversationSchema,
  insertPersonalityResultSchema: () => insertPersonalityResultSchema,
  insertPersonalityTestSchema: () => insertPersonalityTestSchema,
  insertTestResponseSchema: () => insertTestResponseSchema,
  insertTestSessionSchema: () => insertTestSessionSchema,
  insertUserSchema: () => insertUserSchema,
  personalityResults: () => personalityResults,
  personalityResultsRelations: () => personalityResultsRelations,
  personalityTests: () => personalityTests,
  personalityTestsRelations: () => personalityTestsRelations,
  sessions: () => sessions,
  testResponses: () => testResponses,
  testResponsesRelations: () => testResponsesRelations,
  testSessions: () => testSessions,
  testSessionsRelations: () => testSessionsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var personalityTests = pgTable("personality_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(),
  // 'big-five', 'mbti', 'emotional-intelligence'
  questions: jsonb("questions").notNull(),
  // Array of question objects
  createdAt: timestamp("created_at").defaultNow()
});
var testSessions = pgTable("test_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  testId: varchar("test_id").notNull().references(() => personalityTests.id, { onDelete: "cascade" }),
  currentQuestion: integer("current_question").default(0),
  totalQuestions: integer("total_questions").notNull(),
  isCompleted: text("is_completed").default("false"),
  // Using text instead of boolean for better compatibility
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var testResponses = pgTable("test_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => testSessions.id, { onDelete: "cascade" }),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  response: integer("response").notNull(),
  // 1-5 scale typically
  trait: varchar("trait"),
  // e.g., 'extraversion', 'agreeableness', etc.
  createdAt: timestamp("created_at").defaultNow()
});
var personalityResults = pgTable("personality_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull().references(() => testSessions.id, { onDelete: "cascade" }),
  testType: varchar("test_type").notNull(),
  scores: jsonb("scores").notNull(),
  // e.g., { extraversion: 4.2, agreeableness: 3.8, ... }
  personalityType: varchar("personality_type"),
  // For MBTI-style results
  createdAt: timestamp("created_at").defaultNow()
});
var aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isFromUser: text("is_from_user").notNull(),
  // 'true' or 'false'
  personalityContext: jsonb("personality_context"),
  // User's personality scores for context
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  testSessions: many(testSessions),
  personalityResults: many(personalityResults),
  aiConversations: many(aiConversations)
}));
var personalityTestsRelations = relations(personalityTests, ({ many }) => ({
  testSessions: many(testSessions)
}));
var testSessionsRelations = relations(testSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [testSessions.userId],
    references: [users.id]
  }),
  test: one(personalityTests, {
    fields: [testSessions.testId],
    references: [personalityTests.id]
  }),
  responses: many(testResponses),
  results: many(personalityResults)
}));
var testResponsesRelations = relations(testResponses, ({ one }) => ({
  session: one(testSessions, {
    fields: [testResponses.sessionId],
    references: [testSessions.id]
  })
}));
var personalityResultsRelations = relations(personalityResults, ({ one }) => ({
  user: one(users, {
    fields: [personalityResults.userId],
    references: [users.id]
  }),
  session: one(testSessions, {
    fields: [personalityResults.sessionId],
    references: [testSessions.id]
  })
}));
var aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPersonalityTestSchema = createInsertSchema(personalityTests).omit({
  id: true,
  createdAt: true
});
var insertTestSessionSchema = createInsertSchema(testSessions).omit({
  id: true,
  startedAt: true
});
var insertTestResponseSchema = createInsertSchema(testResponses).omit({
  id: true,
  createdAt: true
});
var insertPersonalityResultSchema = createInsertSchema(personalityResults).omit({
  id: true,
  createdAt: true
});
var insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var hasDatabaseUrl = !!process.env.DATABASE_URL;
if (hasDatabaseUrl) {
  neonConfig.webSocketConstructor = ws;
}
var pool = null;
var db = null;
if (hasDatabaseUrl) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
    console.log("Database connection established");
  } catch (error) {
    console.error("Failed to connect to database:", error);
  }
} else {
  console.log("No DATABASE_URL provided - running without database");
}

// server/storage.ts
import { eq, and, desc } from "drizzle-orm";
var memoryStore = {
  users: /* @__PURE__ */ new Map(),
  tests: /* @__PURE__ */ new Map(),
  sessions: /* @__PURE__ */ new Map(),
  responses: /* @__PURE__ */ new Map(),
  results: /* @__PURE__ */ new Map(),
  conversations: /* @__PURE__ */ new Map()
};
var DatabaseStorage = class {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id) {
    if (!db) {
      return memoryStore.users.get(id);
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    if (!db) {
      const user2 = {
        ...userData,
        id: userData.id || "demo-user-001",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      memoryStore.users.set(user2.id, user2);
      return user2;
    }
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Personality test operations
  async getPersonalityTests() {
    if (!db) {
      return Array.from(memoryStore.tests.values());
    }
    return await db.select().from(personalityTests);
  }
  async getPersonalityTestById(id) {
    if (!db) {
      return memoryStore.tests.get(id) || this.getDefaultBigFiveTest();
    }
    const [test] = await db.select().from(personalityTests).where(eq(personalityTests.id, id));
    return test || this.getDefaultBigFiveTest();
  }
  async createPersonalityTest(test) {
    if (!db) {
      const newTest2 = {
        ...test,
        id: test.name?.toLowerCase().replace(/\s+/g, "-") || "test-" + Date.now(),
        createdAt: /* @__PURE__ */ new Date()
      };
      memoryStore.tests.set(newTest2.id, newTest2);
      return newTest2;
    }
    const [newTest] = await db.insert(personalityTests).values(test).returning();
    return newTest;
  }
  getDefaultBigFiveTest() {
    return {
      id: "big-five-default",
      name: "Big Five Personality Assessment",
      description: "A comprehensive personality test based on the scientifically validated Big Five model.",
      type: "big-five",
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
      ],
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  // Test session operations
  async getTestSession(id) {
    if (!db) {
      return memoryStore.sessions.get(id);
    }
    const [session2] = await db.select().from(testSessions).where(eq(testSessions.id, id));
    return session2;
  }
  async getUserTestSessions(userId) {
    if (!db) {
      return Array.from(memoryStore.sessions.values()).filter((s) => s.userId === userId);
    }
    return await db.select().from(testSessions).where(eq(testSessions.userId, userId)).orderBy(desc(testSessions.startedAt));
  }
  async createTestSession(session2) {
    if (!db) {
      const newSession2 = {
        ...session2,
        id: "session-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        startedAt: /* @__PURE__ */ new Date(),
        completedAt: null
      };
      memoryStore.sessions.set(newSession2.id, newSession2);
      return newSession2;
    }
    const [newSession] = await db.insert(testSessions).values(session2).returning();
    return newSession;
  }
  async updateTestSession(id, updates) {
    if (!db) {
      const existing = memoryStore.sessions.get(id);
      if (!existing) throw new Error("Session not found");
      const updated = { ...existing, ...updates };
      memoryStore.sessions.set(id, updated);
      return updated;
    }
    const [updatedSession] = await db.update(testSessions).set(updates).where(eq(testSessions.id, id)).returning();
    return updatedSession;
  }
  // Test response operations
  async createTestResponse(response) {
    if (!db) {
      const newResponse2 = {
        ...response,
        id: "response-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        createdAt: /* @__PURE__ */ new Date()
      };
      if (!memoryStore.responses.has(response.sessionId)) {
        memoryStore.responses.set(response.sessionId, []);
      }
      memoryStore.responses.get(response.sessionId).push(newResponse2);
      return newResponse2;
    }
    const [newResponse] = await db.insert(testResponses).values(response).returning();
    return newResponse;
  }
  async getSessionResponses(sessionId) {
    if (!db) {
      return memoryStore.responses.get(sessionId) || [];
    }
    return await db.select().from(testResponses).where(eq(testResponses.sessionId, sessionId)).orderBy(testResponses.questionIndex);
  }
  // Personality results operations
  async createPersonalityResult(result) {
    if (!db) {
      const newResult2 = {
        ...result,
        id: "result-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        createdAt: /* @__PURE__ */ new Date()
      };
      if (!memoryStore.results.has(result.userId)) {
        memoryStore.results.set(result.userId, []);
      }
      memoryStore.results.get(result.userId).push(newResult2);
      return newResult2;
    }
    const [newResult] = await db.insert(personalityResults).values(result).returning();
    return newResult;
  }
  async getUserPersonalityResults(userId) {
    if (!db) {
      return memoryStore.results.get(userId) || [];
    }
    return await db.select().from(personalityResults).where(eq(personalityResults.userId, userId)).orderBy(desc(personalityResults.createdAt));
  }
  async getLatestPersonalityResult(userId, testType) {
    if (!db) {
      const userResults = memoryStore.results.get(userId) || [];
      const filtered = testType ? userResults.filter((r) => r.testType === testType) : userResults;
      return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
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
    const [result] = await db.select().from(personalityResults).where(whereCondition).orderBy(desc(personalityResults.createdAt)).limit(1);
    return result;
  }
  // AI conversation operations
  async createAiMessage(message) {
    if (!db) {
      const newMessage2 = {
        ...message,
        id: "conversation-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        createdAt: /* @__PURE__ */ new Date()
      };
      if (!memoryStore.conversations.has(message.userId)) {
        memoryStore.conversations.set(message.userId, []);
      }
      memoryStore.conversations.get(message.userId).push(newMessage2);
      return newMessage2;
    }
    const [newMessage] = await db.insert(aiConversations).values(message).returning();
    return newMessage;
  }
  async getUserConversationHistory(userId, limit = 50) {
    if (!db) {
      const userConversations = memoryStore.conversations.get(userId) || [];
      return userConversations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
    }
    return await db.select().from(aiConversations).where(eq(aiConversations.userId, userId)).orderBy(desc(aiConversations.createdAt)).limit(limit);
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
var isReplitEnvironment = !!(process.env.REPLIT_DOMAINS && process.env.REPL_ID);
if (!isReplitEnvironment) {
  console.log("Not running in Replit environment - authentication will be disabled");
}
var getOidcConfig = memoize(
  async () => {
    if (!isReplitEnvironment) {
      throw new Error("OIDC not available outside Replit environment");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  let store;
  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    store = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions"
    });
  }
  return session({
    secret: process.env.SESSION_SECRET || "development-secret-key-change-in-production",
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  if (!isReplitEnvironment) {
    console.log("Skipping Replit auth setup - not in Replit environment");
    return;
  }
  try {
    const config = await getOidcConfig();
    const verify = async (tokens, verified) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };
    for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`
        },
        verify
      );
      passport.use(strategy);
    }
    passport.serializeUser((user, cb) => cb(null, user));
    passport.deserializeUser((user, cb) => cb(null, user));
    app2.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"]
      })(req, res, next);
    });
    app2.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login"
      })(req, res, next);
    });
    app2.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
          }).href
        );
      });
    });
  } catch (error) {
    console.error("Failed to setup Replit auth:", error);
  }
}
var isAuthenticated = async (req, res, next) => {
  if (!isReplitEnvironment) {
    req.user = {
      claims: {
        sub: "demo-user-001",
        email: "demo@example.com",
        first_name: "Demo",
        last_name: "User",
        profile_image_url: null
      }
    };
    return next();
  }
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/openai.ts
import OpenAI from "openai";
var openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
async function generateAIResponse(userMessage, personalityScores) {
  if (!openai) {
    let personalityResponse = "";
    if (personalityScores && Object.keys(personalityScores).length > 0) {
      personalityResponse = `

Based on your personality profile, I can see some interesting patterns. Your scores suggest unique strengths that can guide your personal development journey.`;
    }
    return `Thank you for sharing that with me. While I'm currently running in demo mode without my full AI capabilities, I want you to know that your journey of self-discovery is valuable and important.${personalityResponse}

I encourage you to reflect on your thoughts and feelings, and remember that professional counselors and therapists are always available if you need additional support.`;
  }
  try {
    let personalityContext = "";
    if (personalityScores && Object.keys(personalityScores).length > 0) {
      personalityContext = `The user has the following personality profile based on their assessment results:
${Object.entries(personalityScores).map(([trait, score]) => `- ${trait}: ${score}/5`).join("\n")}

Please tailor your response to be appropriate for someone with this personality profile. `;
    }
    const systemPrompt = `You are MindBridge, a compassionate and knowledgeable AI psychology companion. Your role is to:

1. Provide thoughtful, supportive responses based on psychological principles
2. Help users understand themselves better through their personality assessments
3. Offer gentle guidance and insights without replacing professional therapy
4. Be empathetic, non-judgmental, and encouraging
5. Use evidence-based psychological concepts when appropriate

${personalityContext}

Always maintain a warm, professional tone and remember you are a supportive companion, not a licensed therapist. If someone expresses serious mental health concerns, gently suggest they seek professional help.`;
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    return response.choices[0].message.content || "I'm here to help, but I'm having trouble generating a response right now. Please try again.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, and remember that I'm here to support you on your journey of self-discovery.";
  }
}

// server/routes.ts
import { z } from "zod";
var createTestResponseSchema = z.object({
  sessionId: z.string(),
  questionIndex: z.number(),
  questionText: z.string(),
  response: z.number().min(1).max(5),
  trait: z.string().optional()
});
var createAiMessageSchema = z.object({
  message: z.string().min(1)
});
var updateTestSessionSchema = z.object({
  currentQuestion: z.number().optional(),
  isCompleted: z.string().optional(),
  completedAt: z.string().optional()
});
async function registerRoutes(app2) {
  app2.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development",
      hasDatabase: !!process.env.DATABASE_URL,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    });
  });
  app2.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  await setupAuth(app2);
  const isReplitEnvironment2 = !!(process.env.REPLIT_DOMAINS && process.env.REPL_ID);
  if (!isReplitEnvironment2) {
    app2.get("/api/login", (req, res) => {
      res.status(200).json({ message: "Demo mode - authentication not required" });
    });
    app2.get("/api/logout", (req, res) => {
      res.status(200).json({ message: "Demo mode - logout not required" });
    });
    app2.get("/api/callback", (req, res) => {
      res.redirect("/");
    });
  }
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/tests", async (req, res) => {
    try {
      const tests = await storage.getPersonalityTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });
  app2.get("/api/tests/:testId", async (req, res) => {
    try {
      const { testId } = req.params;
      const test = await storage.getPersonalityTestById(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ message: "Failed to fetch test" });
    }
  });
  app2.get("/api/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions2 = await storage.getUserTestSessions(userId);
      res.json(sessions2);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });
  app2.post("/api/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertTestSessionSchema.parse({
        ...req.body,
        userId
      });
      const session2 = await storage.createTestSession(sessionData);
      res.json(session2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });
  app2.get("/api/sessions/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      const session2 = await storage.getTestSession(sessionId);
      if (!session2 || session2.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session2);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });
  app2.patch("/api/sessions/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      const session2 = await storage.getTestSession(sessionId);
      if (!session2 || session2.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      const parsedData = updateTestSessionSchema.parse(req.body);
      const updateData = { ...parsedData };
      if (updateData.completedAt) {
        updateData.completedAt = new Date(updateData.completedAt);
      }
      const updatedSession = await storage.updateTestSession(sessionId, updateData);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });
  app2.post("/api/responses", isAuthenticated, async (req, res) => {
    try {
      const responseData = createTestResponseSchema.parse(req.body);
      const session2 = await storage.getTestSession(responseData.sessionId);
      if (!session2 || session2.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Session not found" });
      }
      const response = await storage.createTestResponse(responseData);
      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      console.error("Error creating response:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });
  app2.get("/api/sessions/:sessionId/responses", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      const session2 = await storage.getTestSession(sessionId);
      if (!session2 || session2.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      const responses = await storage.getSessionResponses(sessionId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });
  app2.get("/api/results", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getUserPersonalityResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });
  app2.post("/api/results", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const resultData = insertPersonalityResultSchema.parse({
        ...req.body,
        userId
      });
      const result = await storage.createPersonalityResult(resultData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid result data", errors: error.errors });
      }
      console.error("Error creating result:", error);
      res.status(500).json({ message: "Failed to create result" });
    }
  });
  app2.get("/api/ai/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const conversations = await storage.getUserConversationHistory(userId, limit);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = createAiMessageSchema.parse(req.body);
      const personalityResult = await storage.getLatestPersonalityResult(userId);
      await storage.createAiMessage({
        userId,
        message,
        isFromUser: "true",
        personalityContext: personalityResult?.scores || null
      });
      const aiResponse = await generateAIResponse(message, personalityResult?.scores);
      const aiMessage = await storage.createAiMessage({
        userId,
        message: aiResponse,
        isFromUser: "false",
        personalityContext: personalityResult?.scores || null
      });
      res.json({
        userMessage: message,
        aiResponse,
        conversation: aiMessage
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });
  app2.post("/api/sessions/:sessionId/calculate", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      const session2 = await storage.getTestSession(sessionId);
      if (!session2 || session2.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session2.isCompleted !== "true") {
        return res.status(400).json({ message: "Session not completed" });
      }
      const responses = await storage.getSessionResponses(sessionId);
      const test = await storage.getPersonalityTestById(session2.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      const scores = calculatePersonalityScores(responses, test.type);
      const result = await storage.createPersonalityResult({
        userId,
        sessionId,
        testType: test.type,
        scores,
        personalityType: determinePersonalityType(scores, test.type)
      });
      res.json(result);
    } catch (error) {
      console.error("Error calculating results:", error);
      res.status(500).json({ message: "Failed to calculate results" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function calculatePersonalityScores(responses, testType) {
  if (testType === "big-five") {
    const traits = {
      openness: responses.filter((r) => r.trait === "openness"),
      conscientiousness: responses.filter((r) => r.trait === "conscientiousness"),
      extraversion: responses.filter((r) => r.trait === "extraversion"),
      agreeableness: responses.filter((r) => r.trait === "agreeableness"),
      neuroticism: responses.filter((r) => r.trait === "neuroticism")
    };
    const scores = {};
    for (const [trait, traitResponses] of Object.entries(traits)) {
      if (traitResponses.length > 0) {
        const average = traitResponses.reduce((sum, r) => sum + r.response, 0) / traitResponses.length;
        scores[trait] = Math.round(average * 100) / 100;
      } else {
        scores[trait] = 0;
      }
    }
    return scores;
  }
  return {};
}
function determinePersonalityType(scores, testType) {
  if (testType === "mbti" && Object.keys(scores).length >= 4) {
    const e_i = scores.extraversion > 3 ? "E" : "I";
    const s_n = scores.openness > 3 ? "N" : "S";
    const t_f = scores.agreeableness > 3 ? "F" : "T";
    const j_p = scores.conscientiousness > 3 ? "J" : "P";
    return `${e_i}${s_n}${t_f}${j_p}`;
  }
  return null;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
