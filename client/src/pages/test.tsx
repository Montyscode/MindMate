import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircleQuestion,
  Bookmark,
  Save
} from "lucide-react";

// Sample Big Five questions - in production, these would come from the database
const BIG_FIVE_QUESTIONS = [
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
  { text: "I tend to procrastinate on important tasks.", trait: "conscientiousness" },
];

const ANSWER_OPTIONS = [
  { value: 1, label: "Strongly Disagree", emoji: "😟", description: "This doesn't describe me at all" },
  { value: 2, label: "Disagree", emoji: "😐", description: "This somewhat doesn't describe me" },
  { value: 3, label: "Neutral", emoji: "😶", description: "I'm not sure either way" },
  { value: 4, label: "Agree", emoji: "🙂", description: "This somewhat describes me" },
  { value: 5, label: "Strongly Agree", emoji: "😊", description: "This describes me perfectly" },
];

interface TestPageProps {
  params?: { sessionId?: string };
}

export default function Test({ params }: TestPageProps) {
  const [location, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [sessionId, setSessionId] = useState<string | null>(params?.sessionId || null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch existing session if sessionId is provided
  const { data: existingSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/sessions", sessionId],
    enabled: !!sessionId && isAuthenticated,
    retry: false,
  });

  // Fetch session responses if we have a session
  const { data: existingResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ["/api/sessions", sessionId, "responses"],
    enabled: !!sessionId && isAuthenticated,
    retry: false,
  });

  // Initialize session and responses from existing data
  useEffect(() => {
    if (existingSession && Array.isArray(existingResponses)) {
      setCurrentQuestionIndex((existingSession as any).currentQuestion || 0);
      
      const responseMap: Record<number, number> = {};
      existingResponses.forEach((response: any) => {
        responseMap[response.questionIndex] = response.response;
      });
      setResponses(responseMap);
      
      // Set selected answer for current question if it exists
      if (responseMap[(existingSession as any).currentQuestion || 0]) {
        setSelectedAnswer(responseMap[(existingSession as any).currentQuestion || 0]);
      }
    }
  }, [existingSession, existingResponses]);

  // Create test session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sessions", {
        testId: "big-five-default", // Would be dynamic in production
        totalQuestions: BIG_FIVE_QUESTIONS.length,
        currentQuestion: 0,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      toast({
        title: "Test Started",
        description: "Your personality assessment has begun!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start test. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async ({ questionIndex, response }: { questionIndex: number; response: number }) => {
      if (!sessionId) throw new Error("No session ID");
      
      const question = BIG_FIVE_QUESTIONS[questionIndex];
      await apiRequest("POST", "/api/responses", {
        sessionId,
        questionIndex,
        questionText: question.text,
        response,
        trait: question.trait,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!sessionId) throw new Error("No session ID");
      
      const response = await apiRequest("PATCH", `/api/sessions/${sessionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Initialize session if not provided
  useEffect(() => {
    if (!sessionId && isAuthenticated && !authLoading && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [sessionId, isAuthenticated, authLoading]);

  // Set selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(responses[currentQuestionIndex] || null);
  }, [currentQuestionIndex, responses]);

  const handleAnswerChange = (value: string) => {
    const answerValue = parseInt(value);
    setSelectedAnswer(answerValue);
  };

  const handleNext = async () => {
    if (selectedAnswer === null) {
      toast({
        title: "Please select an answer",
        description: "You need to choose an answer before proceeding.",
        variant: "destructive",
      });
      return;
    }

    // Save the response
    const newResponses = { ...responses, [currentQuestionIndex]: selectedAnswer };
    setResponses(newResponses);

    // Save to database
    await saveResponseMutation.mutateAsync({
      questionIndex: currentQuestionIndex,
      response: selectedAnswer,
    });

    const nextQuestion = currentQuestionIndex + 1;
    
    if (nextQuestion >= BIG_FIVE_QUESTIONS.length) {
      // Test completed
      await updateSessionMutation.mutateAsync({
        currentQuestion: nextQuestion,
        isCompleted: 'true',
        completedAt: new Date().toISOString(),
      });
      
      toast({
        title: "Test Completed!",
        description: "Your personality assessment is complete. Calculating results...",
      });
      
      navigate("/");
      return;
    }

    // Update session progress
    await updateSessionMutation.mutateAsync({
      currentQuestion: nextQuestion,
    });

    setCurrentQuestionIndex(nextQuestion);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevQuestion);
      
      // Update session progress
      updateSessionMutation.mutate({
        currentQuestion: prevQuestion,
      });
    }
  };

  const handleSaveAndExit = async () => {
    if (selectedAnswer !== null) {
      const newResponses = { ...responses, [currentQuestionIndex]: selectedAnswer };
      setResponses(newResponses);
      
      await saveResponseMutation.mutateAsync({
        questionIndex: currentQuestionIndex,
        response: selectedAnswer,
      });
    }
    
    await updateSessionMutation.mutateAsync({
      currentQuestion: currentQuestionIndex,
    });
    
    toast({
      title: "Progress Saved",
      description: "Your progress has been saved. You can continue later.",
    });
    
    navigate("/");
  };

  if (authLoading || sessionLoading || responsesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  const currentQuestion = BIG_FIVE_QUESTIONS[currentQuestionIndex];
  const progressPercentage = Math.round(((currentQuestionIndex + 1) / BIG_FIVE_QUESTIONS.length) * 100);
  const completedQuestions = currentQuestionIndex + 1;

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-text-primary transition-colors"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-text-primary" data-testid="text-test-title">
                  Big Five Personality Assessment
                </h1>
                <p className="text-sm text-gray-600" data-testid="text-question-counter">
                  MessageCircleQuestion {completedQuestions} of {BIG_FIVE_QUESTIONS.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600" data-testid="text-progress-percentage">
                {progressPercentage}% Complete
              </div>
              <Button variant="ghost" size="sm" data-testid="button-bookmark">
                <Bookmark size={16} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <Progress value={progressPercentage} className="h-1 rounded-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-3xl mx-auto card-shadow">
          <CardContent className="p-8">
            {/* MessageCircleQuestion */}
            <div className="mb-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircleQuestion className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-4" data-testid="text-question">
                  {currentQuestion.text}
                </h2>
                <p className="text-gray-600" data-testid="text-question-instruction">
                  Rate how accurately this statement describes you on a scale from 1 to 5.
                </p>
              </div>

              {/* Answer Options */}
              <RadioGroup
                value={selectedAnswer?.toString() || ""}
                onValueChange={handleAnswerChange}
                className="space-y-4"
              >
                {ANSWER_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      selectedAnswer === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                    <Label
                      htmlFor={`option-${option.value}`}
                      className="ml-4 flex-1 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium" data-testid={`text-option-label-${option.value}`}>
                          {option.label}
                        </span>
                        <span className="text-2xl">{option.emoji}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1" data-testid={`text-option-description-${option.value}`}>
                        {option.description}
                      </p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2"
                data-testid="button-previous"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </Button>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleSaveAndExit}
                  disabled={saveResponseMutation.isPending || updateSessionMutation.isPending}
                  className="flex items-center space-x-2"
                  data-testid="button-save-exit"
                >
                  <Save size={16} />
                  <span>Save & Exit</span>
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswer === null || saveResponseMutation.isPending || updateSessionMutation.isPending}
                  className="flex items-center space-x-2"
                  data-testid="button-next"
                >
                  <span>
                    {currentQuestionIndex === BIG_FIVE_QUESTIONS.length - 1 ? 'Complete Test' : 'Next MessageCircleQuestion'}
                  </span>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {Array.from({ length: Math.min(10, BIG_FIVE_QUESTIONS.length) }).map((_, i) => {
                const questionIndex = Math.floor((i * BIG_FIVE_QUESTIONS.length) / 10);
                const isCompleted = questionIndex <= currentQuestionIndex;
                return (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      isCompleted ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    data-testid={`progress-indicator-${i}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Test Info */}
        <Card className="mt-8 max-w-3xl mx-auto card-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4" data-testid="text-about-title">About This Assessment</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">What we're measuring:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Extraversion</li>
                  <li>• Agreeableness</li>
                  <li>• Conscientiousness</li>
                  <li>• Neuroticism</li>
                  <li>• Openness to Experience</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tips for accurate results:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Answer honestly, not how you want to be</li>
                  <li>• Think about how you generally behave</li>
                  <li>• Don't overthink each question</li>
                  <li>• Take breaks if you need them</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
