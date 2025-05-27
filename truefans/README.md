# Restaurant Loyalty App

A restaurant loyalty application that allows customers to scan QR codes, register, and receive location-based promotions. The app is free for diners, while restaurant owners pay a monthly subscription fee of $15 to access premium features.

## Features

### For Diners (Free)
- QR code scanning for restaurant registration
- User registration with personal information
- Digital wallet pass integration
- Location-based notifications (within 500m of restaurants)

### For Restaurant Owners ($15/month)
- Customizable digital wallet passes
- QR code generation for customer scanning
- Promotion management
- Customer analytics
- Location-based marketing

## Prerequisites

- Node.js (v14 or higher)
- Stripe account
- Modern web browser with geolocation support

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_PRICE_ID=your_stripe_price_id  # $15/month subscription price ID
   JWT_SECRET=your_jwt_secret
   ```

4. Start MongoDB
5. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

### For Restaurant Owners
1. Sign up for an account
2. Subscribe to the service ($15/month)
3. Customize your digital wallet pass
4. Generate and download your QR code
5. Print and display the QR code in your restaurant

### For Diners
1. Scan the restaurant's QR code with your phone camera
2. Fill out the registration form
3. Receive a digital pass in your email
4. Get notifications when near participating restaurants

## API Endpoints

### Users
- POST `/api/users/register` - Register a new user
- POST `/api/users/:id/location` - Update user location
- GET `/api/users/:id/nearby-restaurants` - Get nearby restaurants

### Restaurants
- POST `/api/restaurants` - Create a new restaurant
- PUT `/api/restaurants/:id/promotion` - Update restaurant promotion
- GET `/api/restaurants/qr/:qrCode` - Get restaurant by QR code
- PUT `/api/restaurants/:id/wallet` - Update digital wallet customization

### Subscriptions
- POST `/api/subscriptions/create` - Create a new subscription
- PUT `/api/subscriptions/:id` - Update subscription
- GET `/api/subscriptions/:id` - Get subscription status

## Technologies Used

- Express.js
- Stripe
- QR Code
- Geolocation API
- Tailwind CSS 