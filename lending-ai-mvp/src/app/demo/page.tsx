'use client';
import { useState, useEffect } from 'react';

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

  const demoSteps: DemoStep[] = [
    {
      id: 'intro',
      title: 'Google-Powered AI Demo',
      duration: 30,
      description: "I'm going to show you how Google's AI transforms 3-day loan processing into 3 minutes, saving you $1,000 per loan while helping you compete with Wells Fargo on speed."
    },
    {
      id: 'upload',
      title: 'Document Upload to Google Cloud',
      duration: 60,
      description: "Here's a loan package from Sarah Johnson at Keller Williams. Michael and Jennifer Martinez want to buy a $450K house in Frisco. Documents upload to Google Cloud Storage with enterprise security."
    },
    {
      id: 'processing',
      title: 'Google AI Processing',
      duration: 120,
      description: `Google's Vision API extracting text with 97% accuracy:
• Paystub: $8,500/month, Texas Instruments, 5+ years
• Bank statement: $110,000 assets, consistent deposits
• Tax return: $102,000 annual income verified

Gemini AI calculating risk:
• DTI ratio: 28% (excellent)
• Employment: 5+ years (low risk)
• Risk Score: 89/100 - STRONG APPROVE`
    },
    {
      id: 'results',
      title: 'Instant Results & ROI',
      duration: 45,
      description: `Processing complete: 2 minutes 31 seconds

Your Google-powered savings:
• Current cost: $1,200 labor + 3-5 days
• Google AI cost: $200 + 2.5 minutes
• Your savings: $1,000 per loan

At 50 loans monthly: $50,000 annual savings`
    }
  ];

  const startDemo = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i);
      setProgress(0);
      
      // Simulate step progress
      for (let p = 0; p <= 100; p += 2) {
        setProgress(p);
        await new Promise(resolve => setTimeout(resolve, (demoSteps[i].duration * 1000) / 50));
      }
    }
    
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">LendingAI Live Demo</h1>
            <p className="text-blue-100">Google-Powered AI Loan Processing</p>
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
                <button
                  onClick={startDemo}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Start Live Demo
                </button>
              </div>
            ) : (
              <div>
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Step {currentStep + 1} of {demoSteps.length}
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
                  
                  {currentStep === 1 && (
                    <div className="space-y-1">
                      <div className="text-blue-400">$ Uploading to Google Cloud Storage...</div>
                      <div className="text-yellow-400">✓ martinez_paystub.pdf → uploaded (2.1s)</div>
                      <div className="text-yellow-400">✓ chase_statement.pdf → uploaded (1.8s)</div>
                      <div className="text-yellow-400">✓ tax_return_2024.pdf → uploaded (2.3s)</div>
                      <div className="text-green-400">✓ All documents secured in Google Cloud</div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-1">
                      <div className="text-blue-400">$ google-vision-api --extract-text</div>
                      <div className="text-yellow-400">✓ OCR confidence: 97.2%</div>
                      <div className="text-blue-400">$ gemini-2.0-flash --analyze-loan</div>
                      <div className="text-yellow-400">✓ Income: $8,500/month verified</div>
                      <div className="text-yellow-400">✓ Assets: $110,000 liquid</div>
                      <div className="text-yellow-400">✓ DTI: 28.5% (excellent)</div>
                      <div className="text-green-400 animate-pulse">✓ Risk Score: 89/100 (LOW RISK)</div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-1">
                      <div className="text-blue-400">$ Processing complete in 2m 31s</div>
                      <div className="text-green-400">✓ RECOMMENDATION: APPROVE</div>
                      <div className="text-yellow-400">✓ Cost savings: $1,000 per loan</div>
                      <div className="text-yellow-400">✓ Speed improvement: 99% faster</div>
                      <div className="text-green-400">✓ Ready for lender review</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
