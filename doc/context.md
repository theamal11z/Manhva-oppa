

---

### 📘 context.md

#### 🧩 Project Overview
This project is an **AI-powered manga/manhwa recommendation website** where users can create an account, log in, and maintain a list of titles they’ve read. The core feature of the site is to provide **personalized recommendations** based on reading history using AI and a custom-curated database.

The frontend is already built with a manga-inspired theme and responsive layout. This file outlines the backend logic, AI system goals, and database architecture needed for the AI agent to build effectively.

---

#### 🎯 Primary Goals for the AI Agent
1. **Setup Supabase Backend**
   - Create a schema for manga/manhwa storage.
   - Store user data, lists, and favorites.
   - Manage Supabase Storage for cover images.
  
2. **Support Admin Panel Functionality**
   - As the admin, I will add manga/manhwa manually.
   - Provide endpoints or tools to input:
     - Title
     - Description
     - Tags/Genres
     - Status (Ongoing/Completed)
     - Type (Manga/Manhwa)
     - Cover Image

3. **AI Recommendation Logic (Phase 2)**
   - Use users’ reading lists and preferences to recommend similar titles.
   - Match based on:
     - Genre
     - Tags
     - Mood/Theme
     - Art style (optional)
   - Use basic similarity scoring or embeddings (future upgrade: NLP-powered recommendation engine).

---

#### 🧱 Tech Stack
- **Frontend**: Already built (React/Vite based)
- **Backend**: Supabase (PostgreSQL + Supabase Storage)
- **AI (Planned)**: Embedding-based similarity search or classification models

---

#### 🧑‍💼 Admin Role (You)
- Add and manage manga/manhwa entries.
- Upload cover images to Supabase Storage.
- Moderate user content if necessary.

---

