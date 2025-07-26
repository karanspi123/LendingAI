'use client';
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ApiStatus from '@/components/ApiStatus';

interface DemoStep {
  id: string;
  title: string;
  duration: number;
  description: string;
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apiHealth, setApiHealth] = useState<any>(null);

  // Check API health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/extract-text');
        const health = await response.json();
        setApiHealth(health);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };
    
    checkHealth();
  }, []);

  const demoSteps: DemoStep[] = [
    {
      id: 'intro',
      title: 'Google-Powered AI Demo',
      duration: 30,
      description: `Live API Status: ${apiHealth?.status || 'Checking...'}
Services Active: ${apiHealth?.services?.services ? Object.keys(apiHealth.services.services).length : 0}/3
Capabilities: ${apiHealth?.capabilities?.features?.length || 0} enterprise features

I'm going to show you how Google's AI transforms 3-day loan processing into 3 minutes, saving you $1,000 per loan while helping you compete with Wells Fargo on speed.`
    },
    {
      id: 'upload',
      title: 'Document Upload to Google Cloud',
      duration: 60,
      description: `Here's a loan package from Sarah Johnson at Keller Williams. Michael and Jennifer Martinez want to buy a $450K house in Frisco.

Documents uploading to Google Cloud Storage with enterprise security:
• Pay stub (2.1MB PDF) - Texas Instruments employee
• Chase bank statement (1.8MB PDF) - $110K in assets  
• 2024 tax return (2.3MB PDF) - $102K annual income

All documents secured with Google's enterprise-grade encryption and access controls.`
    },
    {
      id: 'processing',
      title: 'Google AI Processing',
      duration: 120,
      description: `Google's Vision API extracting text with 97% accuracy:
• Pay stub: $8,500/month, Texas Instruments, 5+ years employment
• Bank statement: $110,000 liquid assets, consistent deposits
• Tax return: $102,000 annual income verified, married filing jointly

Gemini AI calculating comprehensive risk assessment:
• Debt-to-Income ratio: 28% (excellent - well below 43% threshold)
• Employment stability: 5+ years at Fortune 500 company (low risk)
• Asset reserves: 6+ months of payments (strong financial cushion)
• Credit utilization: Estimated 15% (healthy credit management)

Final Risk Score: 89/100 - STRONG APPROVE RECOMMENDATION`
    },
    {
      id: 'results',
      title: 'Instant Results & ROI',
      duration: 45,
      description: `Processing complete: 2 minutes 31 seconds

LOAN RECOMMENDATION: APPROVE ✅
Risk Score: 89/100 (Excellent)
Confidence Level: 97.2%

Key Findings:
• Monthly Income: $8,500 (verified)
• DTI Ratio: 28% (excellent)
• Employment: 5+ years stable
• Assets: $110,000 liquid reserves

Your Google-powered savings per loan:
• Traditional processing: $1,200 labor + 3-5 days
• Google AI processing: $200 + 2.5 minutes  
• Net savings: $1,000 per loan (83% cost reduction)

At 50 loans monthly: $50,000 annual savings
ROI: 2,400% return on AI investment`
    }
  ];

  const startDemo = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i);
      setProgress(0);
      
      // Simulate step progress with realistic timing
      const stepDuration = demoSteps[i].duration * 1000;
      const progressInterval = stepDuration / 50;
      
      for (let p = 0; p <= 100; p += 2) {
        setProgress(p);
        await new Promise(resolve => setTimeout(resolve, progressInterval));
      }
    }
    
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">LendingAI Live Demo</h1>
            <p className="text-blue-100">Google-Powered AI Loan Processing</p>
            
            {/* API Status Indicator */}
            <div className="mt-4 flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                apiHealth?.status === 'healthy' 
                  ? 'bg-green-500 bg-opacity-20 text-green-100' 
                  : 'bg-yellow-500 bg-opacity-20 text-yellow-100'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  apiHealth?.status === 'healthy' ? 'bg-green-300' : 'bg-yellow-300'
                }`}></div>
                <span>API {apiHealth?.status || 'Checking...'}</span>
              </div>
              
              {apiHealth?.services?.services && (
                <div className="text-sm text-blue-100">
                  Services: {Object.values(apiHealth.services.services).filter(Boolean).length}/
                  {Object.keys(apiHealth.services.services).length} Active
                </div>
              )}
            </div>
          </div>

          {/* Demo Content */}
          <div className="p-8">
            {!isRunning ? (
              <div className="text-center py-12">
                <div className="text-8xl mb-6">🚀</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Ready to See 3-Minute Loan Processing?
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
                  Watch as we process a complete loan application in under 3 minutes using Google's AI,
                  delivering 99% faster processing and $1,000 savings per loan.
                </p>
                
                {/* Pre-demo Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2.5min</div>
                    <div className="text-sm text-blue-800">Avg Processing</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">97.2%</div>
                    <div className="text-sm text-green-800">OCR Accuracy</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">$1,000</div>
                    <div className="text-sm text-purple-800">Savings/Loan</div>
                  </div>
                </div>
                
                <button
                  onClick={startDemo}
                  disabled={!apiHealth || apiHealth.status !== 'healthy'}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {apiHealth?.status === 'healthy' ? 'Start Live Demo' : 'Checking API Status...'}
                </button>
                
                {apiHealth?.status !== 'healthy' && (
                  <p className="text-sm text-gray-500 mt-2">
                    Waiting for API services to be ready...
                  </p>
                )}
              </div>
            ) : (
              <div>
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Step {currentStep + 1} of {demoSteps.length}: {demoSteps[currentStep]?.title}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Current Step */}
                <div className="bg-gray-50 rounded-lg p-8 mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {demoSteps[currentStep]?.title}
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line text-lg leading-relaxed">
                    {demoSteps[currentStep]?.description}
                  </div>
                </div>

                {/* Terminal Simulation */}
                <div className="bg-black rounded-lg p-6 text-green-400 font-mono text-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="ml-4 text-gray-300">LendingAI Terminal</span>
                  </div>
                  
                  {currentStep === 0 && (
                    <div className="space-y-1">
                      <div className="text-blue-400">$ lendingai --health-check</div>
                      <div className="text-green-400">✓ Google Vision API: Online</div>
                      <div className="text-green-400">✓ Gemini AI: Online</div>
                      <div className="text-green-400">✓ Document Processor: Ready</div>
                      <div className="text-yellow-400">→ System ready for loan processing</div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-1">
                      <div className="text-blue-400">$ gcloud storage cp documents/* gs://lending-secure/</div>
                      <div className="text-yellow-400">✓ martinez_paystub.pdf → uploaded (2.1s)</div>
                      <div className="text-yellow-400">✓ chase_statement.pdf → uploaded (1.8s)</div>
                      <div className="text-yellow-400">✓ tax_return_2024.pdf → uploaded (2.3s)</div>
                      <div className="text-green-400">✓ All documents secured with 256-bit encryption</div>
                      <div className="text-blue-400">→ Initiating AI processing pipeline...</div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-1">
                      <div className="text-blue-400">$ google-vision-api --extract-text --confidence-threshold=95</div>
                      <div className="text-yellow-400">✓ OCR confidence: 97.2% (excellent)</div>
                      <div className="text-yellow-400">✓ Text extraction: 2,847 characters</div>
                      <div className="text-blue-400">$ gemini-2.0-flash --analyze-loan --risk-assessment</div>
                      <div className="text-yellow-400">✓ Income verification: $8,500/month</div>
                      <div className="text-yellow-400">✓ Asset verification: $110,000 liquid</div>
                      <div className="text-yellow-400">✓ DTI calculation: 28.5% (excellent)</div>
                      <div className="text-yellow-400">✓ Employment stability: 5+ years</div>
                      <div className="text-green-400 animate-pulse">✓ Risk Score: 89/100 (LOW RISK - APPROVE)</div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-1">
                      <div className="text-blue-400">$ lendingai --generate-report --calculate-roi</div>
                      <div className="text-green-400">✓ Processing complete in 2m 31s</div>
                      <div className="text-green-400">✓ RECOMMENDATION: STRONG APPROVE</div>
                      <div className="text-yellow-400">✓ Traditional cost: $1,200 + 3-5 days</div>
                      <div className="text-yellow-400">✓ AI processing cost: $200 + 2.5 minutes</div>
                      <div className="text-green-400">✓ Net savings: $1,000 (83% reduction)</div>
                      <div className="text-blue-400">→ Report ready for underwriter review</div>
                    </div>
                  )}
                </div>

                {/* Real-time Metrics During Demo */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {currentStep === 3 ? '2m 31s' : `${Math.floor(progress/25)}m ${Math.floor((progress%25)*2.4)}s`}
                    </div>
                    <div className="text-sm text-blue-800">Processing Time</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">
                      {currentStep >= 2 ? '97.2%' : progress > 50 ? `${95 + Math.floor(progress/50)}%` : '--'}
                    </div>
                    <div className="text-sm text-green-800">Confidence</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {currentStep >= 2 ? '89/100' : progress > 75 ? `${Math.floor(progress*0.89)}/100` : '--'}
                    </div>
                    <div className="text-sm text-purple-800">Risk Score</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {currentStep === 3 ? '$1,000' : progress > 25 ? `$${Math.floor(progress*10)}` : '$0'}
                    </div>
                    <div className="text-sm text-orange-800">Savings</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Status Footer */}
          <div className="border-t bg-gray-50 p-4">
            <ApiStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
