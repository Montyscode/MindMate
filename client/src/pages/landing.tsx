import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ChartLine, Bot, Shield } from "lucide-react";

export default function Landing() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSignup = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="text-white" size={16} data-testid="logo-icon" />
              </div>
              <span className="text-xl font-bold text-text-primary" data-testid="app-title">MindBridge</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleLogin}
                className="text-text-primary hover:text-primary transition-colors"
                data-testid="button-login"
              >
                Login
              </Button>
              <Button
                onClick={handleSignup}
                className="bg-primary text-white hover:bg-primary-dark transition-colors"
                data-testid="button-signup"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6" data-testid="text-hero-title">
              Discover Your Mind with <span className="text-primary">AI Guidance</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto" data-testid="text-hero-description">
              Take scientifically-backed personality tests and receive personalized insights from your AI companion, designed to help you understand yourself better.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleSignup}
                className="bg-primary text-white px-8 py-4 text-lg font-semibold hover:bg-primary-dark transition-colors"
                data-testid="button-start-journey"
              >
                Start Your Journey
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-primary text-primary px-8 py-4 text-lg font-semibold hover:bg-primary hover:text-white transition-colors"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden card-shadow">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"
              alt="Peaceful meditation scene in nature"
              className="w-full h-96 object-cover"
              data-testid="img-hero"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="text-center card-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ChartLine className="text-primary" size={32} data-testid="icon-scientific-tests" />
                </div>
                <h3 className="text-xl font-semibold mb-4" data-testid="text-feature-title-1">Scientific Tests</h3>
                <p className="text-gray-600" data-testid="text-feature-description-1">
                  Take validated personality assessments based on Big Five and MBTI frameworks for accurate insights.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center card-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="text-accent" size={32} data-testid="icon-ai-companion" />
                </div>
                <h3 className="text-xl font-semibold mb-4" data-testid="text-feature-title-2">AI Companion</h3>
                <p className="text-gray-600" data-testid="text-feature-description-2">
                  Receive personalized feedback and guidance from an AI trained on your unique personality profile.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center card-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="text-primary" size={32} data-testid="icon-secure-private" />
                </div>
                <h3 className="text-xl font-semibold mb-4" data-testid="text-feature-title-3">Secure & Private</h3>
                <p className="text-gray-600" data-testid="text-feature-description-3">
                  Your data is encrypted and secure. We prioritize your privacy and mental health journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
