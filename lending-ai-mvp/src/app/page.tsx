import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LendingAI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Google-Powered AI Loan Processing
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Transform 3-day loan processing into 3 minutes. Save $1,000 per loan with Google's AI technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/demo"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                🚀 Watch Live Demo
              </Link>
              <Link 
                href="/dashboard"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-blue-600"
              >
                📊 View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Google-Powered LendingAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on Google's enterprise AI infrastructure for maximum reliability and cost efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Speed */}
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">99% Faster Processing</h3>
              <p className="text-gray-600 mb-4">
                Google Vision API + Gemini AI processes loans in 2-3 minutes vs 3-5 days manual processing
              </p>
              <div className="text-2xl font-bold text-blue-600">2.5 minutes</div>
              <div className="text-sm text-gray-500">average processing time</div>
            </div>

            {/* Cost Savings */}
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">$1,000 Savings Per Loan</h3>
              <p className="text-gray-600 mb-4">
                Reduce processing costs from $1,200 manual labor to $200 AI processing
              </p>
              <div className="text-2xl font-bold text-green-600">$50,000</div>
              <div className="text-sm text-gray-500">monthly savings at 50 loans</div>
            </div>

            {/* Accuracy */}
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">97% OCR Accuracy</h3>
              <p className="text-gray-600 mb-4">
                Google Cloud Vision API delivers industry-leading document extraction accuracy
              </p>
              <div className="text-2xl font-bold text-purple-600">97.2%</div>
              <div className="text-sm text-gray-500">average confidence score</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                The Google Advantage
              </h2>
              <p className="text-xl text-gray-600">
                Why we chose Google's AI ecosystem over AWS and other providers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Cost Comparison</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-900">Manual Processing</span>
                    <span className="text-xl font-bold text-red-600">$1,200</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-gray-900">AWS Alternative</span>
                    <span className="text-xl font-bold text-yellow-600">$350</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-900">Google AI Stack</span>
                    <span className="text-xl font-bold text-green-600">$200</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Processing Speed</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-900">Manual Review</span>
                    <span className="text-xl font-bold text-red-600">3-5 days</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-gray-900">Traditional OCR</span>
                    <span className="text-xl font-bold text-yellow-600">4-6 hours</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-900">Google Vision + Gemini</span>
                    <span className="text-xl font-bold text-green-600">2-3 minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link 
                href="/demo"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                See It In Action →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Loan Processing?</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join forward-thinking lenders who are saving $50,000+ annually with Google-powered AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/demo"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Schedule Demo
              </Link>
              <Link 
                href="/dashboard"
                className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
