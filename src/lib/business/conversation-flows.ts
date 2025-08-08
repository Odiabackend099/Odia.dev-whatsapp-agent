import { ConversationSession, Message } from '@/lib/whatsapp/types';
import { db } from '@/lib/db';

export interface FlowStep {
  name: string;
  handler: (session: ConversationSession, userMessage: string) => Promise<FlowResult>;
}

export interface FlowResult {
  response: string;
  nextStep?: string;
  sessionUpdates?: Partial<ConversationSession>;
  shouldCreateTrial?: boolean;
  shouldProcessPayment?: boolean;
}

export class ConversationFlowManager {
  private flows: Map<string, FlowStep[]> = new Map();

  constructor() {
    this.initializeFlows();
  }

  private initializeFlows() {
    // New Prospect Flow
    this.flows.set('newProspect', [
      {
        name: 'greeting',
        handler: this.handleGreeting.bind(this)
      },
      {
        name: 'qualification',
        handler: this.handleQualification.bind(this)
      },
      {
        name: 'solution_presentation',
        handler: this.handleSolutionPresentation.bind(this)
      },
      {
        name: 'trial_offer',
        handler: this.handleTrialOffer.bind(this)
      }
    ]);

    // Trial User Flow
    this.flows.set('trialUser', [
      {
        name: 'onboarding',
        handler: this.handleOnboarding.bind(this)
      },
      {
        name: 'support',
        handler: this.handleTrialSupport.bind(this)
      },
      {
        name: 'value_demonstration',
        handler: this.handleValueDemonstration.bind(this)
      }
    ]);

    // Payment Flow
    this.flows.set('paymentFlow', [
      {
        name: 'pricing',
        handler: this.handlePricing.bind(this)
      },
      {
        name: 'objection_handling',
        handler: this.handleObjectionHandling.bind(this)
      },
      {
        name: 'payment_link',
        handler: this.handlePaymentLink.bind(this)
      }
    ]);
  }

  async processMessage(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    const flowType = this.determineFlowType(session);
    const currentStep = this.determineCurrentStep(session);
    
    const flow = this.flows.get(flowType);
    if (!flow) {
      return {
        response: "I'm here to help with WhatsApp automation. What type of business do you run?"
      };
    }

    const stepHandler = flow.find(step => step.name === currentStep);
    if (!stepHandler) {
      return {
        response: "Let me help you with WhatsApp automation. What's your business type?"
      };
    }

    return await stepHandler.handler(session, userMessage);
  }

  private determineFlowType(session: ConversationSession): string {
    const trialStatus = session.businessContext.trialStatus;
    
    switch (trialStatus) {
      case 'prospect':
        return 'newProspect';
      case 'trial':
        return 'trialUser';
      case 'paid':
        return 'paymentFlow';
      default:
        return 'newProspect';
    }
  }

  private determineCurrentStep(session: ConversationSession): string {
    const history = session.conversationHistory;
    const trialStatus = session.businessContext.trialStatus;
    
    if (trialStatus === 'paid') {
      return 'support';
    }
    
    if (trialStatus === 'trial') {
      if (history.length < 4) return 'onboarding';
      return 'support';
    }
    
    // Prospect flow
    if (history.length === 0) return 'greeting';
    if (history.length === 2) return 'qualification';
    if (history.length === 4) return 'solution_presentation';
    return 'trial_offer';
  }

  // Flow Handlers
  private async handleGreeting(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    return {
      response: "Hi! I'm Lexi from ODIA. What type of business do you run? 🇳🇬",
      nextStep: 'qualification'
    };
  }

  private async handleQualification(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    const businessType = userMessage.toLowerCase();
    let industry = 'general';
    
    // Detect industry from user response
    if (businessType.includes('restaurant') || businessType.includes('food')) {
      industry = 'restaurant';
    } else if (businessType.includes('shop') || businessType.includes('store')) {
      industry = 'retail';
    } else if (businessType.includes('service')) {
      industry = 'service';
    } else if (businessType.includes('tech') || businessType.includes('software')) {
      industry = 'technology';
    }

    return {
      response: "Perfect! WhatsApp automation saves ₦150k monthly vs human agents. How do you currently handle customer inquiries?",
      nextStep: 'solution_presentation',
      sessionUpdates: {
        businessContext: {
          ...session.businessContext,
          industry
        }
      }
    };
  }

  private async handleSolutionPresentation(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    return {
      response: "Our AI handles inquiries 24/7, books appointments, and sends follow-ups. Ready for a free 7-day trial?",
      nextStep: 'trial_offer'
    };
  }

  private async handleTrialOffer(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    const response = userMessage.toLowerCase();
    
    if (response.includes('yes') || response.includes('sure') || response.includes('okay')) {
      return {
        response: "Great! What's your business name?",
        nextStep: 'collect_business_info',
        shouldCreateTrial: true
      };
    }
    
    if (response.includes('no') || response.includes('not')) {
      return {
        response: "No worries! What concerns do you have about automation?",
        nextStep: 'objection_handling'
      };
    }
    
    return {
      response: "Would you like to try our free 7-day trial? Just say 'yes' to get started!",
      nextStep: 'trial_offer'
    };
  }

  private async handleOnboarding(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    return {
      response: "Welcome to your trial! Check your email for setup instructions. Need help?",
      nextStep: 'support'
    };
  }

  private async handleTrialSupport(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    return {
      response: "I'm here to help! What do you need assistance with?",
      nextStep: 'support'
    };
  }

  private async handleValueDemonstration(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    return {
      response: "Trial users see 3x ROI in first month. Continue for just ₦15k/month?",
      nextStep: 'payment_link'
    };
  }

  private async handlePricing(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    return {
      response: "Just ₦15k/month vs ₦200k for human agents. Saves you ₦185k monthly!",
      nextStep: 'objection_handling'
    };
  }

  private async handleObjectionHandling(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    const response = userMessage.toLowerCase();
    
    if (response.includes('expensive') || response.includes('cost')) {
      return {
        response: "It pays for itself in 3 days! Most clients save ₦150k+ monthly.",
        nextStep: 'payment_link'
      };
    }
    
    if (response.includes('difficult') || response.includes('hard')) {
      return {
        response: "Super easy! No tech skills needed. We handle everything for you.",
        nextStep: 'payment_link'
      };
    }
    
    return {
      response: "Try it free for 7 days. No credit card needed. What do you say?",
      nextStep: 'trial_offer'
    };
  }

  private async handlePaymentLink(session: ConversationSession, userMessage: string): Promise<FlowResult> {
    const response = userMessage.toLowerCase();
    
    if (response.includes('yes') || response.includes('sure') || response.includes('okay')) {
      return {
        response: "Perfect! I'll send you a payment link. What's your business email?",
        nextStep: 'process_payment',
        shouldProcessPayment: true
      };
    }
    
    return {
      response: "Ready to start saving ₦185k monthly? Just say 'yes' for the payment link!",
      nextStep: 'payment_link'
    };
  }
}

// Export singleton instance
export const conversationFlowManager = new ConversationFlowManager();

// Helper function to extract business information from user messages
export function extractBusinessInfo(userMessage: string): { name?: string; industry?: string } {
  const message = userMessage.toLowerCase();
  const result: { name?: string; industry?: string } = {};
  
  // Simple business name extraction (look for capitalized words)
  const words = userMessage.split(' ');
  const capitalizedWords = words.filter(word => 
    word.length > 2 && word[0] === word[0].toUpperCase()
  );
  
  if (capitalizedWords.length > 0) {
    result.name = capitalizedWords.join(' ');
  }
  
  // Industry detection
  if (message.includes('restaurant') || message.includes('food') || message.includes('cafe')) {
    result.industry = 'restaurant';
  } else if (message.includes('shop') || message.includes('store') || message.includes('retail')) {
    result.industry = 'retail';
  } else if (message.includes('service') || message.includes('consulting')) {
    result.industry = 'service';
  } else if (message.includes('tech') || message.includes('software') || message.includes('app')) {
    result.industry = 'technology';
  }
  
  return result;
}