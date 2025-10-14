import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain, BarChart3, Leaf, TrendingUp } from 'lucide-react';

export default function MLNavigation() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            🤖 AI Agricultural Predictions
          </h2>
          <p className="text-gray-600 text-sm">
            Get AI-powered yield predictions and crop recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ml-demo">
            <Button className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Try ML Demo
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span>Yield Predictions</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Leaf className="h-4 w-4 text-green-500" />
          <span>Crop Recommendations</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          <span>Comprehensive Analysis</span>
        </div>
      </div>
    </div>
  );
}
