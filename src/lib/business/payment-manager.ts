import { db } from '@/lib/db';

export interface PaymentCreationData {
  phoneNumber: string;
  businessName: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}

export interface PaymentUpdateData {
  status?: string;
  transactionId?: string;
  paidAt?: Date;
  paymentMethod?: string;
}

export class PaymentManager {
  private readonly MONTHLY_SUBSCRIPTION_PRICE = 15000;
  private readonly CURRENCY = 'NGN';

  async createPayment(data: PaymentCreationData): Promise<any> {
    try {
      const payment = await db.payment.create({
        data: {
          phone_number: data.phoneNumber,
          business_name: data.businessName,
          amount: data.amount,
          currency: data.currency || this.CURRENCY,
          payment_method: data.paymentMethod,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      console.log(`Created payment for ${data.businessName}: ₦${data.amount}`);
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getPaymentByTransactionId(transactionId: string): Promise<any | null> {
    try {
      const payment = await db.payment.findFirst({
        where: {
          transaction_id: transactionId
        }
      });
      return payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  async getPaymentsByPhoneNumber(phoneNumber: string): Promise<any[]> {
    try {
      const payments = await db.payment.findMany({
        where: {
          phone_number: phoneNumber
        },
        orderBy: {
          created_at: 'desc' // This will be timestamp in the schema
        }
      });
      return payments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async updatePayment(paymentId: string, updates: PaymentUpdateData): Promise<any> {
    try {
      const payment = await db.payment.update({
        where: {
          id: paymentId
        },
        data: {
          ...(updates.status && { status: updates.status }),
          ...(updates.transactionId && { transaction_id: updates.transactionId }),
          ...(updates.paidAt && { paid_at: updates.paidAt }),
          ...(updates.paymentMethod && { payment_method: updates.paymentMethod })
        }
      });

      console.log(`Updated payment ${paymentId}:`, updates);
      return payment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async createSubscriptionPayment(phoneNumber: string, businessName: string): Promise<any> {
    return await this.createPayment({
      phoneNumber,
      businessName,
      amount: this.MONTHLY_SUBSCRIPTION_PRICE,
      currency: this.CURRENCY,
      paymentMethod: 'flutterwave' // Default payment method
    });
  }

  async processPayment(paymentId: string, transactionId: string): Promise<any> {
    try {
      // In a real implementation, this would integrate with Flutterwave/Paystack
      // For now, we'll simulate successful payment processing
      
      const payment = await this.updatePayment(paymentId, {
        status: 'completed',
        transactionId: transactionId,
        paidAt: new Date()
      });

      // Update the corresponding trial to converted status
      await this.updateTrialAfterPayment(payment.phone_number);

      console.log(`Processed payment ${paymentId} successfully`);
      return payment;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  private async updateTrialAfterPayment(phoneNumber: string): Promise<void> {
    try {
      await db.businessTrial.update({
        where: {
          phone_number: phoneNumber
        },
        data: {
          converted: true,
          conversion_date: new Date(),
          trial_status: 'converted'
        }
      });
    } catch (error) {
      console.error('Error updating trial after payment:', error);
      throw error;
    }
  }

  async getPendingPayments(): Promise<any[]> {
    try {
      const payments = await db.payment.findMany({
        where: {
          status: 'pending'
        },
        orderBy: {
          created_at: 'asc' // This will be timestamp in the schema
        }
      });
      return payments;
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }
  }

  async getCompletedPayments(): Promise<any[]> {
    try {
      const payments = await db.payment.findMany({
        where: {
          status: 'completed'
        },
        orderBy: {
          paid_at: 'desc'
        }
      });
      return payments;
    } catch (error) {
      console.error('Error fetching completed payments:', error);
      throw error;
    }
  }

  async getFailedPayments(): Promise<any[]> {
    try {
      const payments = await db.payment.findMany({
        where: {
          status: 'failed'
        },
        orderBy: {
          created_at: 'desc' // This will be timestamp in the schema
        }
      });
      return payments;
    } catch (error) {
      console.error('Error fetching failed payments:', error);
      throw error;
    }
  }

  async expireOldPayments(): Promise<number> {
    try {
      const now = new Date();
      const result = await db.payment.updateMany({
        where: {
          status: 'pending',
          expires_at: {
            lt: now
          }
        },
        data: {
          status: 'failed'
        }
      });

      console.log(`Expired ${result.count} payments`);
      return result.count;
    } catch (error) {
      console.error('Error expiring old payments:', error);
      throw error;
    }
  }

  async getPaymentStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalRevenue: number;
    averagePaymentAmount: number;
  }> {
    try {
      const [total, completed, pending, failed, revenueStats] = await Promise.all([
        db.payment.count(),
        db.payment.count({ where: { status: 'completed' } }),
        db.payment.count({ where: { status: 'pending' } }),
        db.payment.count({ where: { status: 'failed' } }),
        db.payment.aggregate({
          where: { status: 'completed' },
          _sum: { amount: true },
          _avg: { amount: true }
        })
      ]);

      return {
        total,
        completed,
        pending,
        failed,
        totalRevenue: revenueStats._sum.amount || 0,
        averagePaymentAmount: Math.round((revenueStats._avg.amount || 0) * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  generatePaymentLink(paymentId: string, businessName: string, amount: number): string {
    // In a real implementation, this would generate a Flutterwave/Paystack payment link
    // For now, we'll return a mock link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://odia.dev';
    return `${baseUrl}/payment/${paymentId}?amount=${amount}&business=${encodeURIComponent(businessName)}`;
  }

  async sendPaymentConfirmation(phoneNumber: string, businessName: string, amount: number): Promise<string> {
    return `✅ Payment confirmed! ${businessName} is now subscribed to ODIA WhatsApp Automation.

📅 Monthly subscription: ₦${amount.toLocaleString()}
🤖 Your automation is active
📞 24/7 customer support included
💾 All your data is saved

Need help? Just reply to this message!`;
  }

  async sendPaymentReminder(phoneNumber: string, businessName: string, amount: number, daysLeft: number): Promise<string> {
    if (daysLeft <= 0) {
      return `⚠️ Payment overdue! ${businessName}, your subscription needs payment to continue automation. Pay ₦${amount.toLocaleString()} to keep your service active.`;
    }
    
    if (daysLeft === 1) {
      return `⏰ Reminder: ${businessName}, your subscription payment is due tomorrow. Pay ₦${amount.toLocaleString()} to avoid service interruption.`;
    }
    
    return `💳 ${businessName}, your subscription payment of ₦${amount.toLocaleString()} is due in ${daysLeft} days. Keep your automation running smoothly!`;
  }

  // Mock payment processing for development
  async simulatePaymentProcessing(paymentId: string): Promise<any> {
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 90% success rate for simulation
      const isSuccess = Math.random() < 0.9;
      
      if (isSuccess) {
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return await this.processPayment(paymentId, transactionId);
      } else {
        return await this.updatePayment(paymentId, {
          status: 'failed'
        });
      }
    } catch (error) {
      console.error('Error simulating payment processing:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentManager = new PaymentManager();