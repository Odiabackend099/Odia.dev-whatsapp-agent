import { ConversationSession } from '@/lib/whatsapp/types';
import ZAI from 'z-ai-web-dev-sdk';

export interface LexiConfig {
  maxResponseLength: number;
  responseTimeTarget: number;
  conversationFlow: string[];
  keywordTriggers: {
    business: string[];
    automation: string[];
    pricing: string[];
    trial: string[];
  };
}

const lexiConfig: LexiConfig = {
  maxResponseLength: 160,
  responseTimeTarget: 3000,
  conversationFlow: [
    'greeting_and_qualification',
    'needs_assessment', 
    'solution_presentation',
    'trial_offer',
    'objection_handling',
    'conversion_to_trial',
    'onboarding_support'
  ],
  keywordTriggers: {
    business: ['business', 'company', 'shop', 'store', 'enterprise', 'organization'],
    automation: ['automate', 'bot', 'ai', 'automatic', 'system', 'automation'],
    pricing: ['price', 'cost', 'how much', 'pricing', 'fee', 'charge'],
    trial: ['trial', 'test', 'try', 'demo', 'free', 'sample']
  }
};

const lexiPrompt = `
You are Lexi, ODIA's WhatsApp business automation expert for Nigerian businesses.

CONTEXT: You're speaking with Nigerian business owners interested in WhatsApp automation
PRICING: ₦15,000/month (saves ₦200,000/month vs human agents)
TRIAL: Free 7-day trial available
TARGET: Convert prospects to paid subscriptions

PERSONALITY:
- Professional Nigerian business consultant
- Concise and action-oriented
- Nigerian English tone
- Focus on business ROI and cost savings

RESPONSE RULES:
- Keep responses under 160 characters (SMS limit)
- Ask one question at a time
- Always suggest next step
- Be helpful but direct
- Use Nigerian business context

CONVERSATION FLOW:
1. Greeting & Qualification: Ask about their business type
2. Needs Assessment: Understand their current WhatsApp usage
3. Solution Presentation: Explain automation benefits
4. Trial Offer: Propose free 7-day trial
5. Objection Handling: Address concerns about cost/complexity
6. Conversion to Trial: Collect business details
7. Onboarding Support: Guide through setup

KEY BUSINESS POINTS:
- Human agents cost ₦200k/month vs AI ₦15k/month
- 24/7 automated customer service
- No technical skills required
- Works with existing WhatsApp Business
- Nigerian businesses seeing 3x ROI

CURRENT SESSION CONTEXT:
- Business Name: {{businessName}}
- Industry: {{industry}}
- Trial Status: {{trialStatus}}
- Conversation History: {{conversationHistory}}

Respond to the user's message following these guidelines.
`;

export async function processWithLexi(session: ConversationSession, userMessage: string): Promise<string> {
  try {
    const startTime = Date.now();
    
    // Format conversation history for context
    const conversationHistory = session.conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Format the prompt with session context
    const formattedPrompt = lexiPrompt
      .replace('{{businessName}}', session.businessContext.name || 'Not provided')
      .replace('{{industry}}', session.businessContext.industry || 'Not provided')
      .replace('{{trialStatus}}', session.businessContext.trialStatus)
      .replace('{{conversationHistory}}', conversationHistory);

    // Create ZAI instance
    const zai = await ZAI.create();

    // Process with Claude AI
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: formattedPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 50, // Keep responses short
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    
    // Ensure response is within character limit
    const finalResponse = aiResponse.length > lexiConfig.maxResponseLength
      ? aiResponse.substring(0, lexiConfig.maxResponseLength - 3) + '...'
      : aiResponse;

    const responseTime = Date.now() - startTime;
    console.log(`Lexi response generated in ${responseTime}ms: ${finalResponse}`);

    return finalResponse;

  } catch (error) {
    console.error('Error processing with Lexi:', error);
    
    // Fallback responses based on keywords
    return getFallbackResponse(userMessage, session);
  }
}

function getFallbackResponse(userMessage: string, session: ConversationSession): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Business-related keywords
  if (lexiConfig.keywordTriggers.business.some(keyword => lowerMessage.includes(keyword))) {
    return "What type of business do you run? 🇳🇬";
  }
  
  // Automation-related keywords
  if (lexiConfig.keywordTriggers.automation.some(keyword => lowerMessage.includes(keyword))) {
    return "Our WhatsApp automation saves ₦150k/month. Ready for a free trial?";
  }
  
  // Pricing-related keywords
  if (lexiConfig.keywordTriggers.pricing.some(keyword => lowerMessage.includes(keyword))) {
    return "Just ₦15k/month vs ₦200k for human agents. 7-day free trial available!";
  }
  
  // Trial-related keywords
  if (lexiConfig.keywordTriggers.trial.some(keyword => lowerMessage.includes(keyword))) {
    return "Great! I need your business name to start your free 7-day trial.";
  }
  
  // Greeting patterns
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return "Hi! I'm Lexi from ODIA. What business are you in? 🇳🇬";
  }
  
  // Default response
  return "I help Nigerian businesses automate WhatsApp. What's your business type?";
}

export function detectIntent(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lexiConfig.keywordTriggers.business.some(keyword => lowerMessage.includes(keyword))) {
    return 'business_inquiry';
  }
  
  if (lexiConfig.keywordTriggers.automation.some(keyword => lowerMessage.includes(keyword))) {
    return 'automation_interest';
  }
  
  if (lexiConfig.keywordTriggers.pricing.some(keyword => lowerMessage.includes(keyword))) {
    return 'pricing_inquiry';
  }
  
  if (lexiConfig.keywordTriggers.trial.some(keyword => lowerMessage.includes(keyword))) {
    return 'trial_request';
  }
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return 'greeting';
  }
  
  return 'general_inquiry';
}

export function getNextConversationStep(session: ConversationSession): string {
  const history = session.conversationHistory;
  const trialStatus = session.businessContext.trialStatus;
  
  if (trialStatus === 'paid') {
    return 'support';
  }
  
  if (trialStatus === 'trial') {
    return 'trial_support';
  }
  
  // Simple flow detection based on conversation length
  if (history.length === 0) {
    return 'greeting';
  }
  
  if (history.length === 2) {
    return 'qualification';
  }
  
  if (history.length === 4) {
    return 'solution_presentation';
  }
  
  if (history.length >= 6) {
    return 'trial_offer';
  }
  
  return 'general';
}