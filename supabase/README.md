# MangaVerse Database Setup

This directory contains SQL migration files for setting up the Supabase database for the MangaVerse application.

## Migration Files

1. `00_initial_schema.sql` - Creates the initial database schema with all required tables
2. `01_security_policies.sql` - Configures Row Level Security (RLS) policies for all tables
3. `02_functions_triggers.sql` - Sets up database functions and triggers for maintaining data integrity
4. `03_seed_data.sql` - Provides sample data for development

## How to Apply Migrations

### Method 1: Using Supabase CLI

1. Install the Supabase CLI: [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
2. Link your project: `supabase link --project-ref <your-project-ref>`
3. Apply migrations: `supabase db push`

### Method 2: Using Supabase Web UI

1. Log in to your Supabase project
2. Go to the SQL Editor
3. Copy and paste each migration file's contents in order (00, 01, 02, 03)
4. Execute each SQL script

## Database Schema Overview

### Main Tables

- `user_profiles` - User profile information
- `admins` - Administrators with special privileges
- `manga_entries` - Main table for manga titles
- `chapters` - Manga chapters
- `chapter_pages` - Individual pages of a manga chapter

### Categorization Tables

- `genres` - Manga genres (Action, Romance, etc.)
- `tags` - Manga tags (Time Travel, Magic, etc.)
- `manga_genres` - Many-to-many relationship between manga and genres
- `manga_tags` - Many-to-many relationship between manga and tags

### User Interaction Tables

- `user_reading_lists` - Tracks what manga users are reading and their progress
- `user_favorites` - Users' favorite manga
- `reading_history` - Records chapter reading history for recommendations
- `user_preferences` - User preferences for the recommendation engine
- `reviews` - User reviews and ratings of manga
- `comments` - User comments on manga and chapters

## Security Model

The database uses Row Level Security (RLS) to ensure:

1. Public data (manga, genres, etc.) is readable by anyone
2. User-specific data is only accessible by the owning user
3. Admin-only operations are restricted to users in the admins table

## Environment Variable Setup

Make sure your Supabase environment variables are set in your `.env` file:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
