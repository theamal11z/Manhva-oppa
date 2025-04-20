# MangaVerse

MangaVerse is an AI-powered manga/manhwa recommendation platform built with React, TypeScript, and Supabase.

## Features

- 🔐 **User Authentication**: Secure login and signup with email verification
- 📚 **Content Discovery**: Browse, search, and filter manga by genres, tags, and more
- 📖 **Reading Experience**: User-friendly manga reader with zoom and navigation controls
- 📋 **Personal Libraries**: Track reading progress, favorites, and reading history
- 🤖 **Recommendation Engine**: AI-powered manga recommendations based on user preferences
- 👑 **Admin Panel**: Content management interface for administrators

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **State Management**: React Context API
- **Routing**: React Router v6
- **UI Components**: Custom components using Lucide icons

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mangaverse.git
   cd mangaverse
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Set up the Supabase database:
   - Use the SQL files in the `supabase/migrations` folder to create tables
   - Follow the instructions in `supabase/README.md`

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Database Schema

MangaVerse uses a comprehensive database schema with the following main tables:

- `manga_entries`: Stores manga information (title, description, etc.)
- `chapters`: Manga chapters
- `chapter_pages`: Individual pages of manga chapters
- `genres` & `tags`: For categorization
- `user_profiles`: User information
- `user_reading_lists`: Track what users are reading
- `user_favorites`: Users' favorite manga
- `reading_history`: For the recommendation engine

For the complete schema, see `supabase/migrations/00_initial_schema.sql`.

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/             # Page components
├── lib/               # Utility functions and hooks
│   ├── supabaseClient.ts  # Supabase client and helpers
│   └── AuthContext.tsx    # Authentication context
├── types/             # TypeScript type definitions
├── assets/            # Static assets
├── styles/            # Global styles
├── App.tsx            # Main application component
└── main.tsx           # Application entry point

supabase/
├── migrations/        # SQL migration files
└── README.md          # Database setup instructions
```

## Authentication Flow

1. **Signup**:
   - User registers with email and password
   - Verification email is sent
   - Upon verification, user profile is created

2. **Login**:
   - User logs in with email and password
   - Auth state is managed through AuthContext
   - Protected routes check for authenticated user

3. **Password Reset**:
   - User enters email address
   - Reset instructions are sent via email

## Admin Access

Admin users have access to a special dashboard for managing content. To make a user an admin:

1. Register a new user account
2. Insert a record into the `admins` table with the user's ID:
   ```sql
   INSERT INTO public.admins (user_id) 
   VALUES ('user-id-from-auth-users-table');
   ```

## Deployment

1. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

3. Make sure to set the environment variables on your hosting platform.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Supabase](https://supabase.io/) for the backend services
- [Lucide Icons](https://lucide.dev/) for the beautiful icons
- All the amazing manga artists and writers who inspire this project
