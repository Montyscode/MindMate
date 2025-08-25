import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertTestSessionSchema,
  insertTestResponseSchema,
  insertPersonalityResultSchema,
  insertAiConversationSchema 
} from "@shared/schema";
import { generateAIResponse } from "./openai";
import { z } from "zod";

// Validation schemas
const createTestResponseSchema = z.object({
  sessionId: z.string(),
  questionIndex: z.number(),
  questionText: z.string(),
  response: z.number().min(1).max(5),
  trait: z.string().optional(),
});

const createAiMessageSchema = z.object({
  message: z.string().min(1),
});

const updateTestSessionSchema = z.object({
  currentQuestion: z.number().optional(),
  isCompleted: z.string().optional(),
  completedAt: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Personality tests routes
  app.get('/api/tests', async (req, res) => {
    try {
      const tests = await storage.getPersonalityTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  app.get('/api/tests/:testId', async (req, res) => {
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

  // Test sessions routes
  app.get('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserTestSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertTestSessionSchema.parse({
        ...req.body,
        userId,
      });

      const session = await storage.createTestSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get('/api/sessions/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      
      const session = await storage.getTestSession(sessionId);
      
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.patch('/api/sessions/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      
      const session = await storage.getTestSession(sessionId);
      
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }

      const parsedData = updateTestSessionSchema.parse(req.body);
      const updateData: any = { ...parsedData };
      // Convert completedAt string to Date if provided
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

  // Test responses routes
  app.post('/api/responses', isAuthenticated, async (req: any, res) => {
    try {
      const responseData = createTestResponseSchema.parse(req.body);
      
      // Verify the session belongs to the authenticated user
      const session = await storage.getTestSession(responseData.sessionId);
      if (!session || session.userId !== req.user.claims.sub) {
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

  app.get('/api/sessions/:sessionId/responses', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      
      const session = await storage.getTestSession(sessionId);
      
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }

      const responses = await storage.getSessionResponses(sessionId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  // Personality results routes
  app.get('/api/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getUserPersonalityResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.post('/api/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resultData = insertPersonalityResultSchema.parse({
        ...req.body,
        userId,
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

  // AI conversation routes
  app.get('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const conversations = await storage.getUserConversationHistory(userId, limit);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = createAiMessageSchema.parse(req.body);

      // Get user's latest personality results for context
      const personalityResult = await storage.getLatestPersonalityResult(userId);

      // Store user message
      await storage.createAiMessage({
        userId,
        message,
        isFromUser: 'true',
        personalityContext: personalityResult?.scores || null,
      });

      // Generate AI response
      const aiResponse = await generateAIResponse(message, personalityResult?.scores);

      // Store AI response
      const aiMessage = await storage.createAiMessage({
        userId,
        message: aiResponse,
        isFromUser: 'false',
        personalityContext: personalityResult?.scores || null,
      });

      res.json({
        userMessage: message,
        aiResponse: aiResponse,
        conversation: aiMessage,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Calculate personality results endpoint
  app.post('/api/sessions/:sessionId/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      
      const session = await storage.getTestSession(sessionId);
      
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.isCompleted !== 'true') {
        return res.status(400).json({ message: "Session not completed" });
      }

      const responses = await storage.getSessionResponses(sessionId);
      const test = await storage.getPersonalityTestById(session.testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      // Calculate personality scores based on responses
      const scores = calculatePersonalityScores(responses, test.type);
      
      const result = await storage.createPersonalityResult({
        userId,
        sessionId,
        testType: test.type,
        scores,
        personalityType: determinePersonalityType(scores, test.type),
      });

      res.json(result);
    } catch (error) {
      console.error("Error calculating results:", error);
      res.status(500).json({ message: "Failed to calculate results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate personality scores
function calculatePersonalityScores(responses: any[], testType: string): Record<string, number> {
  if (testType === 'big-five') {
    // Calculate Big Five scores
    const traits = {
      openness: responses.filter(r => r.trait === 'openness'),
      conscientiousness: responses.filter(r => r.trait === 'conscientiousness'),
      extraversion: responses.filter(r => r.trait === 'extraversion'),
      agreeableness: responses.filter(r => r.trait === 'agreeableness'),
      neuroticism: responses.filter(r => r.trait === 'neuroticism'),
    };

    const scores: Record<string, number> = {};
    
    for (const [trait, traitResponses] of Object.entries(traits)) {
      if (traitResponses.length > 0) {
        const average = traitResponses.reduce((sum, r) => sum + r.response, 0) / traitResponses.length;
        scores[trait] = Math.round(average * 100) / 100; // Round to 2 decimal places
      } else {
        scores[trait] = 0;
      }
    }

    return scores;
  }

  // Default calculation for other test types
  return {};
}

// Helper function to determine personality type
function determinePersonalityType(scores: Record<string, number>, testType: string): string | null {
  if (testType === 'mbti' && Object.keys(scores).length >= 4) {
    // Simple MBTI-style type determination
    const e_i = scores.extraversion > 3 ? 'E' : 'I';
    const s_n = scores.openness > 3 ? 'N' : 'S';
    const t_f = scores.agreeableness > 3 ? 'F' : 'T';
    const j_p = scores.conscientiousness > 3 ? 'J' : 'P';
    
    return `${e_i}${s_n}${t_f}${j_p}`;
  }

  return null;
}
