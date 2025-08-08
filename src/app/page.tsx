'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Shield, 
  Smartphone,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({
    activeSessions: 0,
    dailyConversations: 0,
    activeTrials: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Fetch basic stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        setStats({
          activeSessions: data.realtime.activeSessions,
          dailyConversations: data.system.dailyConversations,
          activeTrials: data.realtime.activeTrials,
          totalRevenue: data.payments.totalRevenue
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ODIA WhatsApp Automation</h1>
              <p className="text-gray-600 mt-2">Nigeria's First WhatsApp Business AI Platform</p>
            </div>
            <div className="flex gap-4">
              <Link href="/admin">
                <Button variant="outline">Admin Dashboard</Button>
              </Link>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Business with WhatsApp Automation
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Replace ₦200,000/month human agents with ₦15,000/month AI automation. 
            Get instant, intelligent responses 24/7 in Nigerian English.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="h-8 w-8 mx-auto text-blue-600" />
              <CardTitle className="text-2xl">{formatNumber(stats.activeSessions)}</CardTitle>
              <CardDescription>Active Conversations</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 mx-auto text-green-600" />
              <CardTitle className="text-2xl">{formatNumber(stats.dailyConversations)}</CardTitle>
              <CardDescription>Daily Messages</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-8 w-8 mx-auto text-purple-600" />
              <CardTitle className="text-2xl">{formatNumber(stats.activeTrials)}</CardTitle>
              <CardDescription>Active Trials</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <DollarSign className="h-8 w-8 mx-auto text-yellow-600" />
              <CardTitle className="text-2xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
              <CardDescription>Total Revenue</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose ODIA?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Zap className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Less than 3 second response time with 99.9% uptime. Your customers get instant answers, 24/7.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>
                  Enterprise-grade security with zero conversation mixing. Your data is safe and isolated.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Smartphone className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <CardTitle>WhatsApp Native</CardTitle>
                <CardDescription>
                  Works seamlessly with WhatsApp Business API. No app downloads required for your customers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                <CardTitle>Cost Effective</CardTitle>
                <CardDescription>
                  Save ₦185,000 monthly compared to human agents. ROI in just 3 days.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Real-time dashboard with conversation insights and business metrics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-12 w-12 mx-auto text-indigo-500 mb-4" />
                <CardTitle>Easy Setup</CardTitle>
                <CardDescription>
                  Get started in minutes. No technical skills required. We handle everything.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="step1" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="step1">Step 1</TabsTrigger>
                <TabsTrigger value="step2">Step 2</TabsTrigger>
                <TabsTrigger value="step3">Step 3</TabsTrigger>
                <TabsTrigger value="step4">Step 4</TabsTrigger>
              </TabsList>
              
              <TabsContent value="step1" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Sign Up for Free Trial
                    </CardTitle>
                    <CardDescription>
                      Start your 7-day free trial with no credit card required. 
                      Just provide your business details and WhatsApp number.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
              
              <TabsContent value="step2" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Configure Your AI Agent
                    </CardTitle>
                    <CardDescription>
                      Customize Lexi, your AI assistant, with your business information, 
                      FAQs, and conversation flows.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
              
              <TabsContent value="step3" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Connect WhatsApp Business
                    </CardTitle>
                    <CardDescription>
                      Link your WhatsApp Business number in minutes. 
                      We handle all the technical setup.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
              
              <TabsContent value="step4" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Start Automating
                    </CardTitle>
                    <CardDescription>
                      Your AI agent starts handling customer inquiries immediately. 
                      Monitor performance from your dashboard.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          
          <div className="max-w-md mx-auto">
            <Card className="text-center transform scale-105 border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-3xl">₦15,000<span className="text-lg font-normal">/month</span></CardTitle>
                <CardDescription>Everything you need to automate WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Unlimited conversations</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>24/7 AI automation</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time analytics</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Custom AI training</span>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  Start Free Trial
                </Button>
                <p className="text-sm text-gray-600">
                  Save ₦185,000/month vs human agents
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of Nigerian businesses already using ODIA to automate their WhatsApp communications and save money.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="text-lg px-8">
              Start 7-Day Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ODIA Automation</h3>
              <p className="text-gray-400">
                Nigeria's leading WhatsApp business automation platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ODIA Automation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}