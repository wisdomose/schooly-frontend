# 🎓 Arthur Jarvis University Portal

A modern, feature-rich Learning Management System (LMS) built with Next.js, featuring a stunning glassmorphism design and comprehensive educational tools.

![Arthur Jarvis University Portal](https://img.shields.io/badge/Arthur%20Jarvis-University%20Portal-8b5cf6?style=for-the-badge&logo=graduation-cap&logoColor=white)

## ✨ Features

### 🎯 Core Functionality
- **User Authentication & Authorization** - Secure login system with role-based access
- **Course Management** - Create, edit, and manage courses with rich content
- **Quiz System** - Interactive quizzes with multiple question types and real-time results
- **Assignment Management** - File uploads, submissions, and grading system
- **Question Bank** - Comprehensive question management for courses
- **Real-time Notifications** - Live updates for important events
- **Messaging System** - Real-time communication between users

### 🎨 Design & UX
- **Glassmorphism UI** - Modern, translucent design with backdrop blur effects
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme** - Automatic theme switching with system preferences
- **Premium Animations** - Smooth transitions and micro-interactions
- **Accessible Components** - WCAG compliant interface elements

### 👥 User Roles
- **Students** - Access courses, take quizzes, submit assignments, track progress
- **Instructors** - Create content, manage courses, grade assignments, view analytics
- **Administrators** - Full system management and user administration

## 🚀 Tech Stack

### Frontend
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Modern component library
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Zod](https://zod.dev/)** - Schema validation
- **[Socket.IO Client](https://socket.io/)** - Real-time communication
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Lucide React](https://lucide.dev/)** - Beautiful icons

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[PostCSS](https://postcss.org/)** - CSS processing

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Backend API server running

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Available Scripts

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type checking
pnpm type-check
```

### Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (protected)/        # Protected routes (authenticated users)
│   │   ├── login/              # Authentication pages
│   │   ├── globals.css         # Global styles and theme
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Shadcn/ui components
│   │   └── auth-provider.tsx   # Authentication context
│   ├── services/               # API services and data fetching
│   │   ├── course/             # Course-related services
│   │   ├── quiz/               # Quiz management
│   │   ├── assignment/         # Assignment handling
│   │   └── notification/       # Real-time notifications
│   ├── state/                  # Global state management
│   ├── lib/                    # Utility functions
│   └── data/                   # Static data and configurations
├── public/                     # Static assets
├── package.json                # Dependencies and scripts
└── tailwind.config.js          # Tailwind configuration
```

### Key Features Implementation

#### 🎨 Glassmorphism Design System
The project features a custom glassmorphism design system with:
- Translucent backgrounds with backdrop blur
- Subtle borders and shadows
- Smooth animations and transitions
- Consistent color palette with CSS custom properties

#### 📊 Real-time Features
- Live notifications using Socket.IO
- Real-time messaging system
- Auto-save functionality for forms
- Live quiz taking with progress tracking

#### 🔐 Authentication Flow
- JWT-based authentication
- Role-based route protection
- Automatic token refresh
- Secure logout handling

## 🎯 Usage

### For Students
1. **Login** with your student credentials
2. **Browse Courses** - View enrolled courses and available content
3. **Take Quizzes** - Interactive quizzes with real-time feedback
4. **Submit Assignments** - Upload files and track submission status
5. **View Progress** - Monitor your academic progress and grades

### For Instructors
1. **Create Courses** - Build comprehensive course content
2. **Manage Quizzes** - Create questions and track student performance
3. **Grade Assignments** - Review submissions and provide feedback
4. **View Analytics** - Monitor student engagement and performance

### For Administrators
1. **User Management** - Manage student and instructor accounts
2. **System Configuration** - Configure global settings
3. **Content Moderation** - Oversee all platform content

## 🎨 Customization

### Theme Customization
The glassmorphism theme can be customized in `src/app/globals.css`:

```css
:root {
  /* Glassmorphism Theme Colors */
  --glass-background: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-hover: rgba(255, 255, 255, 0.15);
  
  /* Premium Gradients */
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
}
```

### Component Styling
All components use Tailwind CSS with custom glass utilities:
- `.glass-card` - Glassmorphism card container
- `.glass-button` - Interactive button with glass effect
- `.glass-input` - Form inputs with glass styling

## 🚀 Deployment

### Build for Production
```bash
pnpm build
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Deploy to Other Platforms
The built application in `.next/` can be deployed to any Node.js hosting platform.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style Guidelines
- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful commit messages
- Add proper TypeScript types
- Test components thoroughly