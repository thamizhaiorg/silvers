# TAR - E-commerce Storefront

A modern, React Native-based e-commerce storefront app built with Expo, featuring real-time data synchronization, cloud storage, and a clean, intuitive shopping experience for customers.

## ✨ Features

### 🛍️ Customer Shopping Experience
- **Product Browsing**: Clean, modern product grid with search and filtering
- **Collections**: Browse products organized by collections/categories
- **Shopping Cart**: Add products to cart with quantity selection
- **Checkout**: Streamlined checkout process with address management
- **User Profiles**: Customer accounts with order history and saved addresses

### 📱 E-commerce Functionality
- Product catalog with images, prices, and descriptions
- Category-based product filtering
- Real-time product availability
- Shopping cart management
- Order placement and tracking
- Address management for delivery
- Order history and details

### 🎨 Modern Design
- **Clean Interface**: Modern, flat design patterns
- **Responsive Layout**: Optimized for mobile shopping experience
- **Professional UI**: Consistent design language throughout
- **Bottom Navigation**: Easy access to main shopping areas

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Database**: InstantDB (real-time sync)
- **Storage**: Cloudflare R2 for media files
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Custom navigation system
- **State Management**: React Context + InstantDB
- **Testing**: Jest + React Native Testing Library
- **TypeScript**: Full type safety
- **Icons**: Expo Vector Icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for Android development)
- Expo CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Instant DB
EXPO_PUBLIC_INSTANT_APP_ID=your-instant-app-id

# Cloudflare R2 Configuration
EXPO_PUBLIC_R2_ACCOUNT_ID=your-account-id
EXPO_PUBLIC_R2_ACCESS_KEY_ID=your-access-key
EXPO_PUBLIC_R2_SECRET_ACCESS_KEY=your-secret-key
EXPO_PUBLIC_R2_BUCKET_NAME=your-bucket-name
EXPO_PUBLIC_R2_REGION=auto
EXPO_PUBLIC_R2_ENDPOINT=your-r2-endpoint
```

4. Start the development server:
```bash
npm start
```

5. Run on Android:
```bash
npm run android
```

### Development Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
src/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # Main app component
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   │   ├── Button.tsx    # Reusable button component
│   │   ├── Input.tsx     # Form input component
│   │   ├── error-boundary.tsx # Error handling
│   │   └── ...
│   ├── products.tsx      # Product management
│   ├── collections.tsx   # Collections management
│   ├── dashboard.tsx     # Dashboard screen
│   └── ...
├── lib/                  # Utilities and services
│   ├── instant.ts        # InstantDB configuration
│   ├── r2-service.ts     # Cloudflare R2 service
│   ├── logger.ts         # Logging utility
│   └── store-context.tsx # Store management context
├── screens/              # Full-screen components
│   ├── options.tsx       # Options list screen
│   ├── set-simple.tsx    # Option set management screen
│   └── ...
└── __tests__/           # Test files
```

### Prerequisites
- Node.js 18+
- Expo CLI
- InstantDB account and app ID

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd silver
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
EXPO_PUBLIC_INSTANT_APP_ID=your_instant_app_id_here
```

4. Start the development server:
```bash
npm start
```

5. Open the app:
   - Press `w` for web
   - Press `a` for Android (requires Android Studio)
   - Press `i` for iOS (requires Xcode on macOS)
   - Scan QR code with Expo Go app

## 📱 App Structure

### Customer Screens
- **products**: Product catalog with search and filtering
- **collections**: Browse products by collections/categories
- **cart**: Shopping cart with quantity management
- **checkout**: Purchase flow with address selection
- **profile**: User account management
- **address-management**: Delivery address management

### Navigation & Layout
- **nav**: Bottom navigation (Home, Collections, Cart, Profile)
- **category-products**: Category-specific product views

### UI Components
- **Button**: Multiple variants for actions
- **Card**: Consistent card layout
- **Input**: Form inputs for search and checkout
- **ProductGrid**: Product display components
- **R2Image**: Optimized image loading

## 🎯 E-commerce Focus

This app is designed as a customer-facing e-commerce storefront with:

### Customer Experience
- ✅ Intuitive shopping cart functionality
- ✅ Streamlined checkout process
- ✅ User account management
- ✅ Order history and tracking
- ✅ Address management for delivery
- ✅ Professional typography and spacing

### Shopping Features
- ✅ Product search and filtering
- ✅ Collection-based browsing
- ✅ Add to cart functionality
- ✅ Quantity selection
- ✅ Checkout with address selection
- ✅ Order confirmation and history
- ✅ User profile management

## 📊 Database Schema

The app uses InstantDB with the following schema:

```typescript
products: {
  name: string
  description?: string
  price: number
  category: string
  sku: string (unique)
  isActive: boolean
  stock: number
  imageUrl?: string
  createdAt: date
  updatedAt: date
}

collections: {
  name: string (unique)
  description?: string
  isActive: boolean
  sortOrder?: number
  createdAt: date
  updatedAt: date
}
```

## 🔄 Real-time Features

- Live product updates across all screens
- Real-time inventory tracking
- Instant collection changes
- Optimistic UI updates

## 📱 Mobile-First Design

- Touch-optimized interfaces
- Responsive layouts for different screen sizes
- Native mobile interactions
- Professional mobile POS experience

## 🧪 Testing

To test the implementation:

1. Start the app and navigate through all screens
2. Create products using the Shopify-style forms
3. Adjust inventory using the quantity controls
4. View dashboard metrics and charts
5. Test real-time updates by opening multiple instances

## 📄 License

This project is for educational and demonstration purposes.
