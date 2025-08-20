# 🍳 PantryPal — Your AI-Powered Kitchen Assistant

**PantryPal** is a cross-platform mobile app designed to streamline pantry management, meal planning, and recipe generation. By leveraging your existing ingredients, it helps reduce food waste, simplifies cooking, and enhances your kitchen experience.

## ✨ Features

### 🔐 Authentication
- Secure user login and account creation powered by Supabase Auth.

### 📦 Pantry Management
- **Track Inventory**: Add, edit, or remove items with details like quantity, unit, and expiration date.
- **Auto-Categorization**: Automatically groups items into categories (e.g., Produce, Dairy, Grains).
- **Nutritional Scanner**: Upload nutrition labels to auto-populate calories and macronutrients.

### 🍲 Recipe & Meal Planning
- **Smart Recipes**: Generate recipes tailored to your available ingredients.
- **Detailed Instructions**: Includes cook time, difficulty, ingredients, and step-by-step guidance.
- **Cookbook**: Save favorite recipes for quick access.

### 🛒 Smart Shopping List
- **Auto-Generated Lists**: Add missing recipe ingredients with one tap.
- **Organized by Category**: Grouped for efficient in-store navigation.
- **Cost Estimation**: Track item prices and estimate total spend.
- **Interactive**: Check off items as you shop.

## 🛠️ Tech Stack

| Technology            | Purpose                              |
|-----------------------|--------------------------------------|
| **React Native + Expo** | Cross-platform mobile development   |
| **TypeScript**         | Type-safe code                      |
| **React Native Paper** | Material Design UI components       |
| **Expo Router**        | File-based navigation               |
| **Supabase**           | Authentication, real-time DB, backend |
| **.env**               | Environment variable configuration   |

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Expo Go app (for mobile testing) or an Android/iOS emulator

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/MeghP89/PantryPal.git
   cd PantryPal
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the project root and add your Supabase credentials:
   ```bash
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   Replace `your-supabase-url` and `your-supabase-anon-key` with your Supabase project details from the Supabase dashboard.

4. **Start the App**
   ```bash
   npx expo start --clear
   ```
   - Scan the QR code with Expo Go or run on an emulator.
   - Follow the on-screen instructions to launch the app.

## 📝 Notes
- Ensure you have a Supabase project set up in the Supabase dashboard.
- For real-time features, configure Supabase real-time subscriptions for live inventory updates.
- Test nutritional scanning with diverse label formats for optimal accuracy.

## 🤝 Contributing
Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request. Ensure your code follows the project's TypeScript and React Native conventions.

## 📬 Support
For issues or feature requests, open a GitHub issue or reach out via the [PantryPal community](https://github.com/MeghP89/PantryPal/discussions).