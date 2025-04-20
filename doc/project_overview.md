# MangaVerse: Project Overview

## Introduction

MangaVerse is an AI-powered manga/manhwa recommendation and reading platform designed to help users discover, track, and read their favorite content. The platform features a sleek manga-inspired design with a responsive layout, user authentication, content management for admins, and personalized recommendation capabilities.

## Tech Stack

### Frontend
- **React 18.3** with TypeScript
- **Vite** as the build tool and development server
- **React Router** for navigation and routing
- **TailwindCSS** for styling
- **UI Libraries**:
  - Lucide React (for icons)
  - React Dropzone (for file uploads)
  - React Use Gesture (for interactive features)
  - React Zoom Pan Pinch (for reading experience)

### Backend
- **Supabase** for:
  - Authentication and user management
  - PostgreSQL database
  - Storage for manga/manhwa cover images and pages
  - Serverless functions (planned for recommendation engine)

## Project Structure

```
project/
├── src/
│   ├── App.tsx             # Main application with routing
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions and shared logic
│   │   ├── AuthContext.tsx # Authentication context provider
│   │   ├── supabaseClient.ts # Supabase connection and helper functions
│   │   ├── types.ts        # TypeScript interfaces and types
│   │   └── ...
│   ├── pages/              # Application pages
│   │   ├── Admin.tsx       # Admin dashboard
│   │   ├── Home.tsx        # Home page
│   │   ├── MangaDetail.tsx # Manga details page
│   │   ├── Reader.tsx      # Manga reader page
│   │   ├── admin/          # Admin-specific pages
│   │   └── ...
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── supabase/               # Supabase configuration
└── doc/                    # Project documentation
```

## Key Features

### User Features
1. **Authentication**
   - User signup, login, and password reset
   - Email verification
   - Profile management

2. **Content Discovery**
   - Browse manga/manhwa catalog
   - Search by title, genre, or tags
   - Filter by status, type, and other attributes
   - Trending and new releases sections

3. **Reading Experience**
   - Chapter-by-chapter reading
   - Page navigation controls
   - Zoom, pan, and pinch functionality
   - Reading progress tracking

4. **User Library**
   - Personal reading list with status tracking
   - Favorites collection
   - Reading history
   - Custom lists (planned)

5. **Recommendations**
   - Personalized recommendations based on reading history
   - Similar title suggestions
   - Genre and tag-based recommendations

### Admin Features
1. **Content Management**
   - Add, edit, and delete manga/manhwa entries
   - Manage chapters and pages
   - Bulk operations

2. **User Management**
   - View and manage user accounts
   - Add admin users

3. **Metadata Management**
   - Genre and tag management
   - Author and publisher information

## Database Schema

The application uses the following primary database tables:

1. **manga_entries**: Stores manga/manhwa metadata
2. **genres**: List of available genres
3. **manga_genres**: Many-to-many relationship between manga and genres
4. **tags**: List of available tags
5. **manga_tags**: Many-to-many relationship between manga and tags
6. **user_reading_lists**: Tracks users' reading status and progress
7. **user_favorites**: Records users' favorite manga/manhwa
8. **user_preferences**: Stores user preferences for recommendations
9. **admins**: Tracks admin users with special privileges

## Authentication System

MangaVerse uses Supabase Authentication with the following features:
- Email/password authentication
- Row-level security (RLS) policies for data protection
- Admin role verification through a dedicated table

## Current Status and Development Roadmap

### Current Status
- Frontend UI is largely implemented
- Basic authentication system is in place
- Admin panel structure exists
- Database schema is defined
- Basic Supabase integration is working

### Next Steps
1. **Complete Admin Functionality**
   - Finish chapter and page upload system
   - Complete metadata management

2. **Enhance User Experience**
   - Implement reading history synchronization
   - Add more detailed manga information
   - Improve mobile responsiveness

3. **Build Recommendation Engine**
   - Implement basic similarity-based recommendations
   - Develop user preference learning
   - Create "Because you read X" feature

4. **Performance Optimization**
   - Image loading optimization
   - Caching strategies
   - Progressive loading for reader

## Getting Started for Developers

1. **Environment Setup**
   - Clone the repository
   - Install dependencies with `npm install`
   - Create a `.env` file with Supabase credentials

2. **Running the Development Server**
   - Use `npm run dev` to start the local development server
   - Access the application at `http://localhost:5173`

3. **Building for Production**
   - Run `npm run build` to create an optimized production build
   - Preview with `npm run preview`

## Additional Resources

- Supabase documentation: https://supabase.com/docs
- React documentation: https://reactjs.org/docs
- TailwindCSS documentation: https://tailwindcss.com/docs

---

This documentation provides an overview of the MangaVerse project. For more detailed information on specific components or development plans, refer to other documentation files in this directory.
