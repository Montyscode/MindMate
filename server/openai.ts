import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateAIResponse(
  userMessage: string,
  personalityScores?: Record<string, number> | null
): Promise<string> {
  try {
    let personalityContext = "";
    
    if (personalityScores && Object.keys(personalityScores).length > 0) {
      personalityContext = `The user has the following personality profile based on their assessment results:
${Object.entries(personalityScores)
  .map(([trait, score]) => `- ${trait}: ${score}/5`)
  .join('\n')}

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
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm here to help, but I'm having trouble generating a response right now. Please try again.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, and remember that I'm here to support you on your journey of self-discovery.";
  }
}

export async function generatePersonalityInsight(
  personalityScores: Record<string, number>,
  testType: string
): Promise<string> {
  try {
    const scoresText = Object.entries(personalityScores)
      .map(([trait, score]) => `${trait}: ${score}/5`)
      .join(', ');

    const prompt = `Based on these ${testType} personality assessment results: ${scoresText}

Please provide a comprehensive personality insight that includes:
1. A summary of the person's key personality strengths
2. Areas for potential growth and development
3. How these traits might influence relationships and work
4. Practical tips for leveraging their strengths
5. Gentle suggestions for addressing any challenges

Keep the tone encouraging, insightful, and psychologically informed. Respond in JSON format with the following structure:
{
  "summary": "Brief overview of personality profile",
  "strengths": ["strength1", "strength2", "strength3"],
  "growth_areas": ["area1", "area2"],
  "relationship_insights": "How personality affects relationships",
  "work_insights": "How personality affects work/career",
  "practical_tips": ["tip1", "tip2", "tip3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    return response.choices[0].message.content || "{}";
  } catch (error) {
    console.error("Error generating personality insight:", error);
    throw new Error("Failed to generate personality insight: " + (error as Error).message);
  }
}
