import { db } from '@/lib/db';
import { ConversationSession } from '@/lib/whatsapp/types';

export interface TrialCreationData {
  phoneNumber: string;
  businessName: string;
  industry?: string;
  contactPerson?: string;
}

export interface TrialUpdateData {
  businessName?: string;
  industry?: string;
  contactPerson?: string;
  trialStatus?: string;
  converted?: boolean;
  conversionDate?: Date;
  monthlyRevenue?: number;
}

export class TrialManager {
  private readonly TRIAL_DURATION_DAYS = 7;

  async createTrial(data: TrialCreationData): Promise<any> {
    try {
      const trial = await db.businessTrial.create({
        data: {
          phone_number: data.phoneNumber,
          business_name: data.businessName,
          industry: data.industry,
          contact_person: data.contactPerson,
          trial_start: new Date(),
          trial_end: new Date(Date.now() + this.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000),
          trial_status: 'active',
          converted: false,
          monthly_revenue: 15000,
          messages_exchanged: 0,
          last_activity: new Date()
        }
      });

      console.log(`Created trial for ${data.businessName} (${data.phoneNumber})`);
      return trial;
    } catch (error) {
      console.error('Error creating trial:', error);
      throw error;
    }
  }

  async getTrialByPhoneNumber(phoneNumber: string): Promise<any | null> {
    try {
      const trial = await db.businessTrial.findFirst({
        where: {
          phone_number: phoneNumber
        }
      });
      return trial;
    } catch (error) {
      console.error('Error fetching trial:', error);
      throw error;
    }
  }

  async updateTrial(phoneNumber: string, updates: TrialUpdateData): Promise<any> {
    try {
      const trial = await db.businessTrial.update({
        where: {
          phone_number: phoneNumber
        },
        data: {
          ...(updates.businessName && { business_name: updates.businessName }),
          ...(updates.industry && { industry: updates.industry }),
          ...(updates.contactPerson && { contact_person: updates.contactPerson }),
          ...(updates.trialStatus && { trial_status: updates.trialStatus }),
          ...(updates.converted !== undefined && { converted: updates.converted }),
          ...(updates.conversionDate && { conversion_date: updates.conversionDate }),
          ...(updates.monthlyRevenue && { monthly_revenue: updates.monthlyRevenue }),
          last_activity: new Date()
        }
      });

      console.log(`Updated trial for ${phoneNumber}:`, updates);
      return trial;
    } catch (error) {
      console.error('Error updating trial:', error);
      throw error;
    }
  }

  async incrementMessageCount(phoneNumber: string): Promise<void> {
    try {
      await db.businessTrial.update({
        where: {
          phone_number: phoneNumber
        },
        data: {
          messages_exchanged: {
            increment: 1
          },
          last_activity: new Date()
        }
      });
    } catch (error) {
      console.error('Error incrementing message count:', error);
      throw error;
    }
  }

  async getActiveTrials(): Promise<any[]> {
    try {
      const trials = await db.businessTrial.findMany({
        where: {
          trial_status: 'active'
        },
        orderBy: {
          trial_start: 'desc'
        }
      });
      return trials;
    } catch (error) {
      console.error('Error fetching active trials:', error);
      throw error;
    }
  }

  async getExpiringTrials(daysAhead: number = 2): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const trials = await db.businessTrial.findMany({
        where: {
          trial_status: 'active',
          trial_end: {
            lte: cutoffDate
          }
        },
        orderBy: {
          trial_end: 'asc'
        }
      });
      return trials;
    } catch (error) {
      console.error('Error fetching expiring trials:', error);
      throw error;
    }
  }

  async getConvertedTrials(): Promise<any[]> {
    try {
      const trials = await db.businessTrial.findMany({
        where: {
          converted: true
        },
        orderBy: {
          conversion_date: 'desc'
        }
      });
      return trials;
    } catch (error) {
      console.error('Error fetching converted trials:', error);
      throw error;
    }
  }

  async expireOldTrials(): Promise<number> {
    try {
      const now = new Date();
      const result = await db.businessTrial.updateMany({
        where: {
          trial_status: 'active',
          trial_end: {
            lt: now
          }
        },
        data: {
          trial_status: 'expired'
        }
      });

      console.log(`Expired ${result.count} trials`);
      return result.count;
    } catch (error) {
      console.error('Error expiring old trials:', error);
      throw error;
    }
  }

  async getTrialStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    converted: number;
    conversionRate: number;
    averageMessagesPerTrial: number;
  }> {
    try {
      const [total, active, expired, converted, messageStats] = await Promise.all([
        db.businessTrial.count(),
        db.businessTrial.count({ where: { trial_status: 'active' } }),
        db.businessTrial.count({ where: { trial_status: 'expired' } }),
        db.businessTrial.count({ where: { converted: true } }),
        db.businessTrial.aggregate({
          _avg: {
            messages_exchanged: true
          }
        })
      ]);

      const conversionRate = total > 0 ? (converted / total) * 100 : 0;

      return {
        total,
        active,
        expired,
        converted,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageMessagesPerTrial: Math.round((messageStats._avg.messages_exchanged || 0) * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching trial stats:', error);
      throw error;
    }
  }

  async checkAndHandleTrialExpiry(): Promise<void> {
    try {
      const expiringTrials = await this.getExpiringTrials(0);
      
      for (const trial of expiringTrials) {
        await this.updateTrial(trial.phone_number, {
          trialStatus: 'expired'
        });
        
        console.log(`Expired trial for ${trial.business_name} (${trial.phone_number})`);
      }
    } catch (error) {
      console.error('Error handling trial expiry:', error);
      throw error;
    }
  }

  generateTrialInstructions(businessName: string): string {
    return `🎉 Welcome ${businessName} to your ODIA WhatsApp Automation Trial!

📧 Check your email for setup instructions
📱 Link your WhatsApp Business number
🤖 Start automating customer inquiries
📊 Track your results in real-time

Your trial ends in 7 days. Need help? Just reply to this message!`;
  }

  async sendTrialReminder(trial: any): Promise<string> {
    const daysLeft = Math.ceil((new Date(trial.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return `Hi ${trial.business_name}! Your trial has ended. Continue for ₦15k/month and save ₦185k monthly. Reply YES to continue!`;
    }
    
    if (daysLeft === 1) {
      return `Hi ${trial.business_name}! Your trial ends tomorrow. Seen the results? Continue for ₦15k/month. Reply YES to keep your automation!`;
    }
    
    if (daysLeft === 2) {
      return `Hi ${trial.business_name}! Your trial ends in 2 days. Loving the automation? Continue for ₦15k/month. Reply YES to extend!`;
    }
    
    return `Hi ${trial.business_name}! Your trial ends in ${daysLeft} days. How's the automation working for you?`;
  }
}

// Export singleton instance
export const trialManager = new TrialManager();