export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: string;
}

export interface BusinessContext {
  name?: string;
  industry?: string;
  trialStatus: 'prospect' | 'trial' | 'paid' | 'expired';
  signupDate?: Date;
  lastPayment?: Date;
}

export interface ConversationSession {
  sessionId: string;           // "whatsapp_{phoneNumber}_{timestamp}"
  phoneNumber: string;         // +234XXXXXXXXXX format
  agent: 'lexi';              // Start with single agent
  conversationHistory: Message[];
  businessContext: BusinessContext;
  lastActivity: Date;
  startTime: Date;
  isActive: boolean;
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;        // "whatsapp:+234XXXXXXXXXX"
  To: string;          // "whatsapp:+14155238886"
  Body: string;        // User message content
  NumMedia: string;    // "0" or "1" 
  MediaUrl0?: string;  // If media present
  MediaContentType0?: string;
}

export interface LexiConfig {
  maxResponseLength: number; // SMS character limit
  responseTimeTarget: number; // 3 seconds max
  conversationFlow: string[];
  keywordTriggers: {
    business: string[];
    automation: string[];
    pricing: string[];
    trial: string[];
  };
}

export interface ConversationFlow {
  newProspect: string[];
  trialUser: string[];
  paymentFlow: string[];
}