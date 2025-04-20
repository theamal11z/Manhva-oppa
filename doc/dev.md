# Development Plan: AI-Powered Manga/Manhwa Recommendation Platform

## 📋 Project Summary
A manga/manhwa recommendation platform using Supabase backend with AI-powered recommendation features. Users can track their reading history and receive personalized recommendations based on their preferences and reading patterns.

## 🗓️ Development Phases

### Phase 1: Backend Setup & Core Functionality
- **Duration**: 2-3 weeks
- **Focus**: Supabase configuration, database schema, basic API endpoints

### Phase 2: Admin Panel Implementation
- **Duration**: 1-2 weeks
- **Focus**: Content management system for manga/manhwa entries

### Phase 3: Recommendation Engine
- **Duration**: 2-4 weeks
- **Focus**: Implementing similarity-based recommendations

### Phase 4: Testing & Refinement
- **Duration**: 1-2 weeks
- **Focus**: Bug fixes, performance optimization, user testing

## 🗄️ Database Schema

### Tables

#### `manga_entries`
```sql
create table manga_entries (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  alternative_titles text[],
  description text,
  status text check (status in ('ongoing', 'completed', 'hiatus', 'cancelled')),
  type text check (type in ('manga', 'manhwa', 'manhua', 'webtoon')),
  release_year int,
  cover_image_url text,
  author text,
  artist text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

#### `genres`
```sql
create table genres (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);
```

#### `manga_genres`
```sql
create table manga_genres (
  manga_id uuid references manga_entries(id) on delete cascade,
  genre_id uuid references genres(id) on delete cascade,
  primary key (manga_id, genre_id)
);
```

#### `tags`
```sql
create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);
```

#### `manga_tags`
```sql
create table manga_tags (
  manga_id uuid references manga_entries(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (manga_id, tag_id)
);
```

#### `user_reading_lists`
```sql
create table user_reading_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  manga_id uuid references manga_entries(id) on delete cascade,
  status text check (status in ('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read')),
  rating smallint check (rating >= 1 and rating <= 10),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, manga_id)
);
```

#### `user_favorites`
```sql
create table user_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  manga_id uuid references manga_entries(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, manga_id)
);
```

#### `user_preferences`
```sql
create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_genres uuid[] references genres(id),
  favorite_tags uuid[] references tags(id),
  exclude_genres uuid[] references genres(id),
  exclude_tags uuid[] references tags(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## 🔌 API Endpoints

### Manga/Manhwa Management
- `GET /api/manga` - List all manga entries with filtering options
- `GET /api/manga/:id` - Get single manga details
- `POST /api/manga` (Admin) - Create new manga entry
- `PATCH /api/manga/:id` (Admin) - Update manga entry
- `DELETE /api/manga/:id` (Admin) - Delete manga entry
- `GET /api/genres` - List all genres
- `GET /api/tags` - List all tags

### User Features
- `GET /api/user/reading-list` - Get current user's reading list
- `POST /api/user/reading-list` - Add manga to reading list
- `PATCH /api/user/reading-list/:manga_id` - Update reading status/rating
- `DELETE /api/user/reading-list/:manga_id` - Remove from reading list
- `POST /api/user/favorites/:manga_id` - Add to favorites
- `DELETE /api/user/favorites/:manga_id` - Remove from favorites

### Recommendation Engine
- `GET /api/recommendations` - Get personalized recommendations
- `GET /api/recommendations/similar/:manga_id` - Get similar titles to specific manga

## 🔐 Authentication & Authorization

### User Roles
- **Anonymous**: Browse catalog, view manga details
- **User**: Maintain reading list, get recommendations
- **Admin**: Full content management capabilities

### Security Rules
```sql
-- Example RLS (Row Level Security) policy for reading manga
create policy "Anyone can view manga"
  on manga_entries for select
  to anon, authenticated
  using (true);

-- Only admins can insert/update manga
create policy "Only admins can insert manga"
  on manga_entries for insert
  to authenticated
  using (auth.uid() in (select id from admins));
```

## 🧠 Recommendation Engine Design

### Phase 1: Basic Similarity Matching
- Calculate similarity based on shared genres and tags
- Weight by user ratings
- Provide "Because you read X" recommendations

### Phase 2: Enhanced Algorithm
- Incorporate reading patterns (completion rate, reading speed)
- Consider community popularity within similar user groups
- Optional: Add content-based features from descriptions

### Implementation Approach
1. Generate embedding vectors for manga based on genre/tag combinations
2. Store these vectors in the database or vector storage
3. Compute similarity scores using cosine similarity
4. Cache recommendation results periodically

## 📝 Development Tasks

### Backend Setup
- [ ] Initialize Supabase project
- [ ] Create database tables with proper relationships
- [ ] Configure storage buckets for cover images
- [ ] Set up authentication and authorization rules
- [ ] Create admin role and permissions

### Admin Panel
- [ ] Design and implement manga entry form
- [ ] Build image upload functionality
- [ ] Create genre and tag management interface
- [ ] Implement batch operations for content management

### User Features
- [ ] Connect frontend authentication with Supabase
- [ ] Implement reading list CRUD operations
- [ ] Build user preference management
- [ ] Create favorites functionality

### Recommendation Engine
- [ ] Build basic genre/tag-based recommendation algorithm
- [ ] Implement "similar titles" functionality
- [ ] Create personalized recommendation endpoint
- [ ] Add caching layer for recommendation results

## 🧪 Testing Strategy
- Unit tests for utility functions and recommendation algorithm
- Integration tests for API endpoints
- User acceptance testing for recommendations quality
- Performance testing for recommendation engine

## 🚀 Deployment Considerations
- Set up proper security rules for production
- Configure storage policies
- Implement backup strategy
- Monitoring and logging for recommendation engine performance 