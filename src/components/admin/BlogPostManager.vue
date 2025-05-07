<template>
  <div class="blog-manager manga-panel p-6">
    <h2 class="manga-title text-2xl mb-6">Blog Post Manager</h2>
    
    <!-- Auto-generation settings -->
    <div class="mb-8 border-b border-gray-700 pb-6">
      <h3 class="text-xl manga-title mb-4">Auto-Generation Settings</h3>
      
      <div class="flex items-center mb-4">
        <Toggle 
          v-model="autoGenerateEnabled" 
          @change="updateAutoGenerationSetting"
          label="Auto-generate blog posts for new manga entries" 
        />
      </div>
      
      <div class="text-sm text-gray-400 mb-4">
        When enabled, blog posts will be automatically generated using AI whenever a new manga entry is created.
      </div>
      
      <div class="flex items-center space-x-4">
        <button 
          @click="generateMissingBlogPosts" 
          class="manga-border px-4 py-2 bg-red-500 hover:bg-red-600 transition"
          :disabled="isGenerating"
        >
          <span v-if="isGenerating">Generating...</span>
          <span v-else>Generate Missing Blog Posts</span>
        </button>
        
        <div v-if="generationStatus" class="text-sm text-gray-400">
          {{ generationStatus }}
        </div>
      </div>
    </div>
    
    <!-- Blog posts list -->
    <div class="mb-6">
      <h3 class="text-xl manga-title mb-4">Existing Blog Posts</h3>
      
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <div class="text-sm text-gray-400 mr-4">
            {{ blogPosts.length }} blog posts found
          </div>
          
          <button 
            @click="createNewBlogPost"
            class="manga-border px-4 py-2 bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            Create New Blog Post
          </button>
        </div>
        
        <div class="flex items-center space-x-2">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search blog posts..." 
            class="manga-border bg-gray-800 px-3 py-1 text-sm"
          />
          
          <select 
            v-model="sortBy" 
            class="manga-border bg-gray-800 px-3 py-1 text-sm"
          >
            <option value="published_date">Sort by date</option>
            <option value="title">Sort by title</option>
            <option value="views">Sort by views</option>
          </select>
        </div>
      </div>
      
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
        <div class="mt-2 text-gray-400">Loading blog posts...</div>
      </div>
      
      <div v-else-if="filteredBlogPosts.length === 0" class="text-center py-8 text-gray-400">
        No blog posts found
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="post in filteredBlogPosts" 
          :key="post.id" 
          class="manga-panel p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div class="flex-grow">
            <h4 class="text-lg font-bold hover:text-red-500 transition">
              {{ post.title }}
            </h4>
            <div class="text-sm text-gray-400 flex items-center gap-2 flex-wrap mt-1">
              <span>{{ formatDate(post.published_date) }}</span>
              <span>•</span>
              <span>{{ post.views }} views</span>
              <span v-if="post.manga">•</span>
              <span v-if="post.manga" class="manga-border px-2 py-0.5 text-xs">
                {{ post.manga.title }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button 
              @click="previewBlogPost(post.slug)" 
              class="manga-border px-2 py-1 text-sm hover:bg-gray-700 transition"
            >
              Preview
            </button>
            
            <button 
              @click="editBlogPost(post.id)" 
              class="manga-border px-2 py-1 text-sm hover:bg-gray-700 transition"
            >
              Edit
            </button>
            
            <button 
              @click="regenerateBlogPost(post.id, post.manga_id)" 
              class="manga-border px-2 py-1 text-sm hover:bg-gray-700 transition"
            >
              Regenerate
            </button>
            
            <button 
              @click="confirmDeleteBlogPost(post.id)" 
              class="manga-border px-2 py-1 text-sm bg-red-500 hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      
      <!-- Pagination controls -->
      <div class="flex justify-center mt-6">
        <div class="flex items-center space-x-2">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1" 
            class="manga-border px-3 py-1 disabled:opacity-50"
            :class="{ 'hover:bg-gray-700 transition': currentPage > 1 }"
          >
            Previous
          </button>
          
          <span class="text-gray-400">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          
          <button 
            @click="nextPage" 
            :disabled="currentPage >= totalPages" 
            class="manga-border px-3 py-1 disabled:opacity-50"
            :class="{ 'hover:bg-gray-700 transition': currentPage < totalPages }"
          >
            Next
          </button>
        </div>
      </div>
    </div>
    
    <!-- Blog post editor modal -->
    <Modal v-if="showEditModal" @close="closeEditor" size="large">
      <BlogPostEditor 
        :blog-post="editingPost" 
        @close="closeEditor" 
        @saved="onBlogPostSaved"
      />
    </Modal>
    
    <!-- Confirmation modal -->
    <Modal v-if="showConfirmModal" @close="showConfirmModal = false">
      <template #header>
        <h3 class="manga-title text-xl">Confirm Action</h3>
      </template>
      
      <template #default>
        <p>{{ confirmMessage }}</p>
      </template>
      
      <template #footer>
        <div class="flex justify-end space-x-3">
          <button 
            @click="showConfirmModal = false" 
            class="manga-border px-4 py-2 hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          
          <button 
            @click="confirmAction" 
            class="manga-border px-4 py-2 bg-red-500 hover:bg-red-600 transition"
          >
            Confirm
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient';
import Modal from '../ui/Modal.vue';
import Toggle from '../ui/Toggle.vue';
import BlogPostEditor from './BlogPostEditor.vue';

// Import the blog service functions
import { getBlogPosts, createBlogPost, autoGenerateBlogPost } from '../../../astro-blog/src/lib/blogService';

export default {
  components: {
    Modal,
    Toggle,
    BlogPostEditor
  },
  
  setup() {
    // State
    const blogPosts = ref([]);
    const loading = ref(true);
    const autoGenerateEnabled = ref(false);
    const isGenerating = ref(false);
    const generationStatus = ref('');
    const searchQuery = ref('');
    const sortBy = ref('published_date');
    const currentPage = ref(1);
    const pageSize = 10;
    
    // Modal state
    const showEditModal = ref(false);
    const showConfirmModal = ref(false);
    const confirmMessage = ref('');
    const confirmCallback = ref(null);
    const editingPost = ref({
      title: '',
      slug: '',
      content: '',
      seo_description: '',
      seo_keywords: '',
      manga_id: null,
      featured_image: null
    });
    
    // Computed properties
    const filteredBlogPosts = computed(() => {
      let filtered = [...blogPosts.value];
      
      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(post => 
          post.title.toLowerCase().includes(query) || 
          (post.content && post.content.toLowerCase().includes(query)) ||
          (post.seo_keywords && post.seo_keywords.toLowerCase().includes(query))
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        if (sortBy.value === 'title') {
          return a.title.localeCompare(b.title);
        } else if (sortBy.value === 'views') {
          return b.views - a.views;
        } else {
          // Default: sort by date
          return new Date(b.published_date) - new Date(a.published_date);
        }
      });
      
      return filtered;
    });
    
    const paginatedBlogPosts = computed(() => {
      const start = (currentPage.value - 1) * pageSize;
      const end = start + pageSize;
      return filteredBlogPosts.value.slice(start, end);
    });
    
    const totalPages = computed(() => {
      return Math.ceil(filteredBlogPosts.value.length / pageSize);
    });
    
    // Load initial data
    onMounted(async () => {
      await fetchBlogPosts();
      await loadAutoGenerationSetting();
    });
    
    // Methods
    async function fetchBlogPosts() {
      loading.value = true;
      try {
        // Get all blog posts (don't use pagination here since we're filtering client-side)
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            *,
            manga:manga_entries(id, title)
          `)
          .order('published_date', { ascending: false });
        
        if (error) throw error;
        
        blogPosts.value = data || [];
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        loading.value = false;
      }
    }
    
    async function loadAutoGenerationSetting() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('settings')
          .eq('id', 'singleton')
          .single();
        
        if (error) throw error;
        
        autoGenerateEnabled.value = data?.settings?.autoGenerateBlogPosts || false;
      } catch (error) {
        console.error('Error loading auto-generation setting:', error);
      }
    }
    
    async function updateAutoGenerationSetting() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('settings')
          .eq('id', 'singleton')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        const currentSettings = data?.settings || {};
        const updatedSettings = {
          ...currentSettings,
          autoGenerateBlogPosts: autoGenerateEnabled.value
        };
        
        await supabase
          .from('site_settings')
          .upsert({
            id: 'singleton',
            settings: updatedSettings
          });
      } catch (error) {
        console.error('Error updating auto-generation setting:', error);
        // Revert UI state in case of error
        autoGenerateEnabled.value = !autoGenerateEnabled.value;
      }
    }
    
    async function generateMissingBlogPosts() {
      isGenerating.value = true;
      generationStatus.value = 'Fetching manga entries...';
      
      try {
        // Get all manga entries that don't have a blog post
        const { data: mangaEntries, error: mangaError } = await supabase
          .from('manga_entries')
          .select('id, title')
          .not('id', 'in', supabase.from('blog_posts').select('manga_id'));
        
        if (mangaError) throw mangaError;
        
        if (mangaEntries.length === 0) {
          generationStatus.value = 'No missing blog posts found.';
          return;
        }
        
        generationStatus.value = `Generating ${mangaEntries.length} blog posts...`;
        
        // Generate blog posts one by one
        let generatedCount = 0;
        let failedCount = 0;
        
        for (const manga of mangaEntries) {
          try {
            generationStatus.value = `Generating blog post for "${manga.title}" (${generatedCount + 1}/${mangaEntries.length})...`;
            await autoGenerateBlogPost(manga.id);
            generatedCount++;
          } catch (error) {
            console.error(`Failed to generate blog post for manga ${manga.id}:`, error);
            failedCount++;
          }
        }
        
        generationStatus.value = `Generated ${generatedCount} blog posts. ${failedCount > 0 ? `Failed: ${failedCount}` : ''}`;
        await fetchBlogPosts(); // Refresh the list
      } catch (error) {
        console.error('Error generating missing blog posts:', error);
        generationStatus.value = 'Error: Failed to generate blog posts.';
      } finally {
        isGenerating.value = false;
      }
    }
    
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    function previewBlogPost(slug) {
      // Open the blog post in a new tab
      window.open(`/blog/${slug}`, '_blank');
    }
    
    function createNewBlogPost() {
      // Initialize with empty data for new blog post
      editingPost.value = {
        title: '',
        slug: '',
        content: '',
        seo_description: '',
        seo_keywords: '',
        manga_id: null,
        featured_image: null,
        published_date: new Date().toISOString()
      };
      showEditModal.value = true;
    }

    function editBlogPost(postId) {
      const post = blogPosts.value.find(p => p.id === postId);
      if (post) {
        editingPost.value = { ...post };
        showEditModal.value = true;
      }
    }
    
    function closeEditor() {
      showEditModal.value = false;
    }
    
    async function onBlogPostSaved(savedPost) {
      await fetchBlogPosts(); // Refresh the list
    }
    
    async function regenerateBlogPost(postId, mangaId) {
      if (!mangaId) {
        alert('Cannot regenerate: no manga associated with this blog post.');
        return;
      }
      
      confirmMessage.value = 'Are you sure you want to regenerate this blog post? This will overwrite the current content.';
      confirmCallback.value = async () => {
        try {
          await supabase.from('blog_posts').delete().eq('id', postId);
          await autoGenerateBlogPost(mangaId);
          await fetchBlogPosts(); // Refresh the list
        } catch (error) {
          console.error('Error regenerating blog post:', error);
          alert('Failed to regenerate blog post. Please try again.');
        } finally {
          showConfirmModal.value = false;
        }
      };
      
      showConfirmModal.value = true;
    }
    
    function confirmDeleteBlogPost(postId) {
      confirmMessage.value = 'Are you sure you want to delete this blog post? This action cannot be undone.';
      confirmCallback.value = async () => {
        try {
          await supabase.from('blog_posts').delete().eq('id', postId);
          await fetchBlogPosts(); // Refresh the list
        } catch (error) {
          console.error('Error deleting blog post:', error);
          alert('Failed to delete blog post. Please try again.');
        } finally {
          showConfirmModal.value = false;
        }
      };
      
      showConfirmModal.value = true;
    }
    
    function confirmAction() {
      if (confirmCallback.value) {
        confirmCallback.value();
      }
    }
    
    function prevPage() {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    }
    
    function nextPage() {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    }
    
    return {
      blogPosts,
      loading,
      autoGenerateEnabled,
      isGenerating,
      generationStatus,
      searchQuery,
      sortBy,
      currentPage,
      totalPages,
      filteredBlogPosts: paginatedBlogPosts,
      showEditModal,
      showConfirmModal,
      confirmMessage,
      editingPost,
      fetchBlogPosts,
      updateAutoGenerationSetting,
      generateMissingBlogPosts,
      formatDate,
      previewBlogPost,
      createNewBlogPost,
      editBlogPost,
      closeEditor,
      onBlogPostSaved,
      regenerateBlogPost,
      confirmDeleteBlogPost,
      confirmAction,
      prevPage,
      nextPage
    };
  }
};
</script>

<style scoped>
/* Additional component-specific styles can go here */
</style>
