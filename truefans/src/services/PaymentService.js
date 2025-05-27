import { loadStripe } from '@stripe/stripe-js';

class PaymentService {
  constructor() {
    this.stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
  }

  async createPaymentIntent(amount, currency = 'usd') {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async processPayment(paymentMethodId, amount) {
    try {
      const stripe = await this.stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentMethodId,
        {
          payment_method: paymentMethodId,
          amount,
          currency: 'usd',
        }
      );

      if (error) {
        throw error;
      }

      return paymentIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
}

export default new PaymentService(); 