import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Dashboard } from './components/Dashboard';
import { InteractionCheck } from './components/InteractionCheck';
import { ResultPage } from './components/ResultPage';
import { RiskProfile } from './components/RiskProfile';
import { LearningHub } from './components/LearningHub';
import { TrustPanel } from './components/TrustPanel';
import { HistoryPage } from './components/HistoryPage';

type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'check' | 'result' | 'profile' | 'learning' | 'trust' | 'history';

interface User {
  name: string;
  email: string;
  isGuest: boolean;
}

interface RiskProfileData {
  age: string;
  conditions: string[];
  allergies: string[];
}

interface InteractionResult {
  medication: string;
  food: string;
  riskLevel: 'mild' | 'moderate' | 'severe';
  explanation: string;
  clinicalImpact: string;
  example: string;
  recommendations: string[];
  alternatives: string[];
  timing: string;
  confidence: number;
  timestamp: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfileData | null>(null);
  const [interactionData, setInteractionData] = useState<{ medication: string; food: string } | null>(null);
  const [currentResult, setCurrentResult] = useState<InteractionResult | null>(null);
  const [history, setHistory] = useState<InteractionResult[]>([]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const handleLogin = (email: string, password: string, isGuest: boolean = false) => {
    if (isGuest) {
      setUser({ name: 'Guest', email: '', isGuest: true });
      navigateTo('check');
    } else {
      setUser({ name: email.split('@')[0], email, isGuest: false });
      navigateTo('dashboard');
    }
  };

  const handleSignup = (name: string, email: string, password: string) => {
    setUser({ name, email, isGuest: false });
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setRiskProfile(null);
    setHistory([]);
    navigateTo('landing');
  };

  const handleCheckStart = () => {
    navigateTo('check');
  };

  const handleCheckComplete = (medication: string, food: string) => {
    setInteractionData({ medication, food });
    
    // Simulate AI analysis
    const result = generateMockAnalysis(medication, food, riskProfile);
    setCurrentResult(result);
    
    // Add to history if user is logged in
    if (user && !user.isGuest) {
      setHistory(prev => [result, ...prev]);
    }
    
    navigateTo('result');
  };

  const handleSaveProfile = (profile: RiskProfileData) => {
    setRiskProfile(profile);
    navigateTo('dashboard');
  };

  const generateMockAnalysis = (medication: string, food: string, profile: RiskProfileData | null): InteractionResult => {
    // Simple mock logic for demonstration
    const interactions: Record<string, any> = {
      'warfarin': { foods: ['spinach', 'kale', 'broccoli'], risk: 'severe' },
      'metformin': { foods: ['alcohol', 'beer', 'wine'], risk: 'moderate' },
      'lisinopril': { foods: ['banana', 'orange', 'avocado'], risk: 'moderate' },
      'atorvastatin': { foods: ['grapefruit', 'pomelo'], risk: 'severe' },
      'levothyroxine': { foods: ['soy', 'coffee', 'milk'], risk: 'mild' },
    };

    let riskLevel: 'mild' | 'moderate' | 'severe' = 'mild';
    let confidence = 85 + Math.random() * 10;

    // Check for known interactions
    const medLower = medication.toLowerCase();
    const foodLower = food.toLowerCase();

    for (const [med, data] of Object.entries(interactions)) {
      if (medLower.includes(med)) {
        for (const riskFood of data.foods) {
          if (foodLower.includes(riskFood)) {
            riskLevel = data.risk;
            confidence = 92 + Math.random() * 5;
            break;
          }
        }
      }
    }

    // Adjust risk based on profile
    if (profile) {
      if (profile.conditions.length > 2) {
        confidence += 3;
      }
      if (profile.age === '65+' && riskLevel === 'moderate') {
        riskLevel = 'severe';
      }
    }

    const riskData = {
      mild: {
        explanation: 'Minor interaction detected. The combination is generally safe but may cause mild side effects.',
        clinicalImpact: 'May slightly reduce medication effectiveness or cause minor digestive discomfort.',
        example: 'Similar to taking calcium supplements with certain antibiotics.',
        recommendations: [
          'Monitor for any unusual symptoms',
          'Continue normal medication schedule',
          'Stay hydrated'
        ],
        alternatives: ['Try consuming at different times of day', 'Consider alternative food options'],
        timing: 'Space intake by 1-2 hours if concerned'
      },
      moderate: {
        explanation: 'Moderate interaction detected. This combination requires careful monitoring and timing adjustments.',
        clinicalImpact: 'May significantly affect medication absorption, metabolism, or increase side effect risk.',
        example: `Consuming ${food} may alter ${medication} blood levels by 20-40%.`,
        recommendations: [
          'Consult your pharmacist about timing',
          'Monitor for increased side effects',
          'Consider alternative food choices'
        ],
        alternatives: ['Choose foods from different category', 'Adjust meal timing'],
        timing: 'Space intake by 2-4 hours'
      },
      severe: {
        explanation: 'Severe interaction detected. This combination should be avoided or closely managed by healthcare provider.',
        clinicalImpact: 'May cause dangerous changes in drug levels, serious side effects, or treatment failure.',
        example: `${food} can increase or decrease ${medication} effectiveness by over 50%.`,
        recommendations: [
          '⚠️ Consult your doctor immediately',
          'Avoid this food-drug combination',
          'Discuss safer alternatives with healthcare provider'
        ],
        alternatives: ['Complete avoidance recommended', 'Ask doctor about alternative medications'],
        timing: 'Avoid combination entirely'
      }
    };

    const data = riskData[riskLevel];

    return {
      medication,
      food,
      riskLevel,
      explanation: data.explanation,
      clinicalImpact: data.clinicalImpact,
      example: data.example,
      recommendations: data.recommendations,
      alternatives: data.alternatives,
      timing: data.timing,
      confidence: Math.round(confidence),
      timestamp: new Date().toISOString()
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'landing' && (
        <LandingPage onNavigate={navigateTo} onGuestCheck={handleCheckStart} />
      )}
      {currentPage === 'login' && (
        <LoginPage onLogin={handleLogin} onNavigate={navigateTo} />
      )}
      {currentPage === 'signup' && (
        <SignupPage onSignup={handleSignup} onNavigate={navigateTo} />
      )}
      {currentPage === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onNavigate={navigateTo} 
          onLogout={handleLogout}
          hasRiskProfile={!!riskProfile}
          recentChecks={history.slice(0, 3)}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'check' && (
        <InteractionCheck 
          onComplete={handleCheckComplete} 
          onNavigate={navigateTo}
          isGuest={user?.isGuest || false}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'result' && currentResult && (
        <ResultPage 
          result={currentResult}
          onNavigate={navigateTo}
          onNewCheck={handleCheckStart}
          isGuest={user?.isGuest || false}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'profile' && (
        <RiskProfile 
          onSave={handleSaveProfile}
          onNavigate={navigateTo}
          existingProfile={riskProfile}
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'learning' && (
        <LearningHub 
          onNavigate={navigateTo} 
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'trust' && (
        <TrustPanel 
          onNavigate={navigateTo} 
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
      {currentPage === 'history' && user && (
        <HistoryPage 
          history={history} 
          onNavigate={navigateTo} 
          user={user}
          onLogout={handleLogout}
          currentPage={currentPage}
        />
      )}
    </div>
  );
}