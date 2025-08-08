import { NextRequest, NextResponse } from 'next/server';
import { MessagingResponse } from 'twilio/lib/twiml/MessagingResponse';
import { conversationManager } from '@/lib/whatsapp/session-manager';
import { TwilioWebhookPayload, Message } from '@/lib/whatsapp/types';
import { processWithLexi } from '@/lib/agents/lexi';
import { logConversation } from '@/lib/whatsapp/database-logger';
import { db } from '@/lib/db';

// Twilio validation helper
function validateTwilioRequest(request: NextRequest): boolean {
  // In production, implement proper Twilio signature validation
  // For now, we'll skip validation for development
  return true;
}

// Extract phone number from Twilio format
function extractPhoneNumber(from: string): string {
  return from.replace('whatsapp:', '');
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Validate Twilio request
    if (!validateTwilioRequest(request)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse form data from Twilio
    const formData = await request.formData();
    const payload: TwilioWebhookPayload = {
      MessageSid: formData.get('MessageSid') as string,
      AccountSid: formData.get('AccountSid') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string || '',
      NumMedia: formData.get('NumMedia') as string || '0',
      MediaUrl0: formData.get('MediaUrl0') as string || undefined,
      MediaContentType0: formData.get('MediaContentType0') as string || undefined,
    };

    const phoneNumber = extractPhoneNumber(payload.From);
    console.log(`Received message from ${phoneNumber}: ${payload.Body}`);

    // Get or create session
    let session = conversationManager.getSession(phoneNumber);
    if (!session) {
      session = conversationManager.createSession(phoneNumber);
    }

    // Add user message to session
    const userMessage: Message = {
      role: 'user',
      content: payload.Body,
      timestamp: new Date(),
      messageId: payload.MessageSid
    };

    conversationManager.addMessageToSession(session.sessionId, userMessage);

    // Process message with Lexi
    const aiResponse = await processWithLexi(session, payload.Body);
    const responseTime = Date.now() - startTime;

    // Add AI response to session
    const assistantMessage: Message = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    conversationManager.addMessageToSession(session.sessionId, assistantMessage);

    // Log conversation to database
    try {
      await logConversation({
        sessionId: session.sessionId,
        phoneNumber: session.phoneNumber,
        messageSid: payload.MessageSid,
        userMessage: payload.Body,
        aiResponse: aiResponse,
        agent: 'lexi',
        responseTimeMs: responseTime,
        businessName: session.businessContext.name,
        industry: session.businessContext.industry,
        trialStatus: session.businessContext.trialStatus
      });
    } catch (dbError) {
      console.error('Failed to log conversation to database:', dbError);
      // Continue even if database logging fails
    }

    // Create TwiML response
    const twiml = new MessagingResponse();
    twiml.message(aiResponse);

    // Return TwiML response
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    
    // Return error response
    const twiml = new MessagingResponse();
    twiml.message('Sorry, I encountered an error. Please try again later.');
    
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
      status: 500,
    });
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'ODIA WhatsApp Webhook is running',
    timestamp: new Date().toISOString(),
    activeSessions: conversationManager.getActiveSessionCount()
  });
}