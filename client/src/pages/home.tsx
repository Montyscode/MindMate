import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Brain, 
  Play, 
  BarChart3, 
  Book, 
  Settings, 
  MessageCircle,
  CheckCircle,
  UserPlus,
  LogOut,
  Bot
} from "lucide-react";

export default function Home() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

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

  // Fetch user's test sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch personality results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/results"],
    retry: false,
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleChatWithAI = () => {
    // TODO: Implement AI chat interface
    toast({
      title: "Coming Soon",
      description: "AI companion chat will be available soon!",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  // Calculate progress for different test types
  const getTestProgress = (testType: string) => {
    if (!sessions || !Array.isArray(sessions)) return 0;
    
    const typeSession = sessions.find((s: any) => s.test?.type === testType);
    if (!typeSession) return 0;
    
    return Math.round((typeSession.currentQuestion / typeSession.totalQuestions) * 100);
  };

  const bigFiveProgress = getTestProgress('big-five');
  const mbtiProgress = getTestProgress('mbti');
  const eqProgress = getTestProgress('emotional-intelligence');

  // Find active session to continue
  const activeSession = Array.isArray(sessions) ? sessions.find((s: any) => s.isCompleted !== 'true') : undefined;

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-text-primary" data-testid="text-app-title">MindBridge</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {(user as any)?.profileImageUrl ? (
                  <img
                    src={(user as any).profileImageUrl}
                    alt="User profile"
                    className="w-8 h-8 rounded-full object-cover"
                    data-testid="img-user-avatar"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary" data-testid="text-username">
                  {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-text-primary transition-colors"
                data-testid="button-logout"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2" data-testid="text-welcome-title">
            Welcome back, {(user as any)?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600" data-testid="text-welcome-description">
            Continue your journey of self-discovery and personal growth.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 card-shadow">
            <CardHeader>
              <CardTitle data-testid="text-progress-title">Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sessionsLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Big Five Assessment</span>
                        <span className="text-sm text-gray-600" data-testid="text-big-five-progress">
                          {bigFiveProgress}%
                        </span>
                      </div>
                      <Progress value={bigFiveProgress} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">MBTI-Style Assessment</span>
                        <span className="text-sm text-gray-600" data-testid="text-mbti-progress">
                          {mbtiProgress}%
                        </span>
                      </div>
                      <Progress value={mbtiProgress} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Emotional Intelligence</span>
                        <span className="text-sm text-gray-600" data-testid="text-eq-progress">
                          {eqProgress}%
                        </span>
                      </div>
                      <Progress value={eqProgress} className="h-2" />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-ai-companion-title">AI Companion</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="text-white" size={32} />
              </div>
              <p className="text-sm text-gray-600 mb-4" data-testid="text-ai-companion-description">
                Your AI companion is learning about your personality
              </p>
              <Button
                className="w-full bg-primary text-white hover:bg-primary-dark transition-colors"
                onClick={handleChatWithAI}
                data-testid="button-chat-ai"
              >
                Chat Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {activeSession ? (
            <Link href={`/test/${activeSession.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow card-shadow">
                <CardContent className="p-6 text-left">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Play className="text-primary" size={24} />
                  </div>
                  <h3 className="font-semibold mb-2" data-testid="text-continue-test-title">Continue Test</h3>
                  <p className="text-sm text-gray-600" data-testid="text-continue-test-description">
                    Resume your personality assessment
                  </p>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Link href="/test">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow card-shadow">
                <CardContent className="p-6 text-left">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Play className="text-primary" size={24} />
                  </div>
                  <h3 className="font-semibold mb-2" data-testid="text-start-test-title">Start Test</h3>
                  <p className="text-sm text-gray-600" data-testid="text-start-test-description">
                    Begin a new personality assessment
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow card-shadow">
            <CardContent className="p-6 text-left">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-accent" size={24} />
              </div>
              <h3 className="font-semibold mb-2" data-testid="text-view-results-title">View Results</h3>
              <p className="text-sm text-gray-600" data-testid="text-view-results-description">
                See your completed assessments
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow card-shadow">
            <CardContent className="p-6 text-left">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Book className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2" data-testid="text-resources-title">Resources</h3>
              <p className="text-sm text-gray-600" data-testid="text-resources-description">
                Learn about personality psychology
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow card-shadow">
            <CardContent className="p-6 text-left">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="text-orange-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2" data-testid="text-settings-title">Settings</h3>
              <p className="text-sm text-gray-600" data-testid="text-settings-description">
                Manage your account
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle data-testid="text-activity-title">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsLoading || resultsLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4">
                {Array.isArray(sessions) && sessions.slice(0, 3).map((session: any, index: number) => (
                  <div key={session.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {session.isCompleted === 'true' ? (
                        <CheckCircle className="text-primary" size={20} />
                      ) : (
                        <Play className="text-primary" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-activity-item-${index}`}>
                        {session.isCompleted === 'true' 
                          ? `Completed ${session.test?.name || 'Personality Test'}`
                          : `In progress: ${session.test?.name || 'Personality Test'} (Question ${session.currentQuestion})`
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                {(!sessions || !Array.isArray(sessions) || sessions.length === 0) && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <UserPlus className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid="text-account-created">Account created</p>
                      <p className="text-sm text-gray-600">Welcome to MindBridge!</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
