import MangaManager from '../components/admin/MangaManager.vue'
import UserManager from '../components/admin/UserManager.vue'
import ChapterManager from '../components/admin/ChapterManager.vue'
import Dashboard from '../components/admin/Dashboard.vue'
import Settings from '../components/admin/Settings.vue'
import BlogPostManager from '../components/admin/BlogPostManager.vue'

// Admin panel routes
export const adminRoutes = [
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: Dashboard,
    meta: { requiresAdmin: true, icon: 'dashboard', title: 'Dashboard' }
  },
  {
    path: '/admin/manga',
    name: 'MangaManager',
    component: MangaManager,
    meta: { requiresAdmin: true, icon: 'library_books', title: 'Manga Manager' }
  },
  {
    path: '/admin/chapters',
    name: 'ChapterManager',
    component: ChapterManager,
    meta: { requiresAdmin: true, icon: 'menu_book', title: 'Chapter Manager' }
  },
  {
    path: '/admin/users',
    name: 'UserManager',
    component: UserManager,
    meta: { requiresAdmin: true, icon: 'people', title: 'User Manager' }
  },
  {
    path: '/admin/blog',
    name: 'BlogManager',
    component: BlogPostManager,
    meta: { requiresAdmin: true, icon: 'article', title: 'Blog Manager' }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: Settings,
    meta: { requiresAdmin: true, icon: 'settings', title: 'Settings' }
  }
]
