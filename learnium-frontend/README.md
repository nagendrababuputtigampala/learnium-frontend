# Learnium - Educational Platform for Kids (Grade 1-12)

A modern, kid-friendly learning platform similar to HackerRank, designed specifically for school students from Grade 1 to 12. Test your knowledge in Math, Physics, and other subjects while earning badges and tracking your progress!

## 🚀 Features

### Current Features (v0.1)
- ✅ **User Authentication**
  - Email/Password login and registration
  - Social authentication (Google & Facebook) - UI ready
  - Parent email option for younger students
  - Form validation and error handling
  
- ✅ **Kid-Friendly UI**
  - Colorful gradient design
  - Responsive layout (mobile & web ready)
  - Clear, easy-to-read interface
  - Fun icons and emojis

### Upcoming Features
- 📊 **Student Dashboard**
  - Knowledge level tracking
  - Badges and achievements
  - Progress percentile comparison with peers
  - Subject-wise performance metrics

- 📚 **Learning Modules**
  - Math challenges
  - Physics problems
  - Multiple subjects support
  - Grade-specific content (1-12)

- 🏆 **Gamification**
  - Earn badges for completing tasks
  - Achievement system
  - Leaderboards
  - Streaks and rewards

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite (Rolldown)
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState for now, will add context/redux later)

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd learnium-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## 🎨 Project Structure

```
learnium-frontend/
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── Button.tsx          # Reusable button component
│   │       ├── Input.tsx           # Input field with validation
│   │       ├── SocialButton.tsx    # Social login buttons
│   │       └── index.ts
│   ├── pages/
│   │   ├── Login.tsx               # Login page
│   │   ├── Signup.tsx              # Registration page
│   │   ├── Dashboard.tsx           # Dashboard (coming soon)
│   │   └── index.ts
│   ├── App.tsx                     # Main app with routing
│   ├── main.tsx                    # App entry point
│   └── index.css                   # Global styles with Tailwind
├── public/
├── tailwind.config.js              # Tailwind configuration
├── package.json
└── README.md
```

## 🎯 Available Routes

- `/` - Redirects to login
- `/login` - User login page
- `/signup` - User registration page
- `/dashboard` - Coming soon (user dashboard)

## 🎨 Design Philosophy

- **Kid-Friendly**: Bright colors, fun icons, and encouraging messages
- **Responsive**: Works seamlessly on both mobile and web
- **Accessible**: Clear labels, proper form validation, and helpful error messages
- **Engaging**: Gamification elements to keep students motivated

## 🔐 Authentication Flow

1. Users can sign up using:
   - Email and password
   - Google account (OAuth - to be implemented)
   - Facebook account (OAuth - to be implemented)

2. Registration includes:
   - Full name
   - Email address
   - Grade selection (1-12)
   - Password with confirmation
   - Optional parent email

3. Form validation ensures:
   - Valid email format
   - Password minimum length (6 characters)
   - Password confirmation match
   - Required fields completion

## 🚀 Development Roadmap

### Phase 1 (Current) - Authentication ✅
- [x] Login UI
- [x] Signup UI
- [x] Form validation
- [x] Responsive design
- [ ] Backend integration
- [ ] OAuth implementation

### Phase 2 - Dashboard & Profile
- [ ] User dashboard
- [ ] Profile management
- [ ] Progress tracking
- [ ] Badge system

### Phase 3 - Learning Modules
- [ ] Math challenges
- [ ] Physics problems
- [ ] Subject selection
- [ ] Grade-wise content

### Phase 4 - Gamification
- [ ] Achievement system
- [ ] Leaderboards
- [ ] Peer comparison
- [ ] Rewards system

## 🤝 Contributing

This is a learning project. Contributions, issues, and feature requests are welcome!

---

**Note**: This project is currently in early development. The backend API and OAuth integrations are planned for future releases.


```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
