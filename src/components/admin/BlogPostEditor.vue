<template>
  <div class="blog-post-editor">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold">{{ isEditing ? 'Edit Blog Post' : 'Add New Blog Post' }}</h2>
      <button 
        @click="$emit('close')" 
        class="text-gray-500 hover:text-gray-700"
      >
        <span class="sr-only">Close</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <form @submit.prevent="saveBlogPost" class="space-y-6">
      <!-- Title -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
        <input 
          type="text" 
          id="title" 
          v-model="formData.title" 
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Enter blog post title"
        />
      </div>

      <!-- Slug -->
      <div>
        <label for="slug" class="block text-sm font-medium text-gray-700">
          Slug
          <span class="ml-1 text-gray-500 text-xs">(URL-friendly version of title)</span>
        </label>
        <div class="mt-1 flex rounded-md shadow-sm">
          <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
            /blog/
          </span>
          <input 
            type="text" 
            id="slug" 
            v-model="formData.slug" 
            required
            class="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="my-blog-post-title"
          />
        </div>
        <button 
          type="button" 
          @click="generateSlug" 
          class="mt-1 text-sm text-indigo-600 hover:text-indigo-500"
        >
          Generate from title
        </button>
      </div>

      <!-- Associated Manga (Optional) -->
      <div>
        <label for="manga" class="block text-sm font-medium text-gray-700">
          Associated Manga 
          <span class="ml-1 text-gray-500 text-xs">(Optional)</span>
        </label>
        <select 
          id="manga" 
          v-model="formData.manga_id" 
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">None (General Blog Post)</option>
          <option v-for="manga in mangaList" :key="manga.id" :value="manga.id">
            {{ manga.title }}
          </option>
        </select>
      </div>

      <!-- Featured Image URL -->
      <div>
        <label for="featured_image" class="block text-sm font-medium text-gray-700">
          Featured Image URL
          <span class="ml-1 text-gray-500 text-xs">(Optional)</span>
        </label>
        <input 
          type="url" 
          id="featured_image" 
          v-model="formData.featured_image" 
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="https://example.com/image.jpg"
        />
        <div v-if="formData.featured_image" class="mt-2">
          <img :src="formData.featured_image" alt="Featured image preview" class="h-32 w-auto object-cover rounded-md shadow-sm" />
        </div>
      </div>

      <!-- SEO Description -->
      <div>
        <label for="seo_description" class="block text-sm font-medium text-gray-700">
          SEO Description
          <span class="ml-1 text-gray-500 text-xs">(150-160 characters recommended)</span>
        </label>
        <textarea 
          id="seo_description" 
          v-model="formData.seo_description" 
          rows="2"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Brief description of the blog post for search engines and social sharing"
        ></textarea>
        <div class="mt-1 text-xs text-gray-500">
          {{ formData.seo_description.length }} / 160 characters
        </div>
      </div>

      <!-- SEO Keywords -->
      <div>
        <label for="seo_keywords" class="block text-sm font-medium text-gray-700">
          SEO Keywords
          <span class="ml-1 text-gray-500 text-xs">(Comma-separated)</span>
        </label>
        <input 
          type="text" 
          id="seo_keywords" 
          v-model="formData.seo_keywords" 
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="manga, manhwa, action, fantasy, etc."
        />
      </div>

      <!-- Content (Rich Text Editor) -->
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700">Content</label>
        <textarea 
          id="content" 
          v-model="formData.content" 
          rows="15"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Write your blog post content here. HTML formatting is supported."
        ></textarea>
        <div class="mt-1 text-xs text-gray-500">
          HTML formatting is supported.
        </div>
      </div>

      <!-- Publish Date -->
      <div>
        <label for="published_date" class="block text-sm font-medium text-gray-700">Publish Date</label>
        <input 
          type="datetime-local" 
          id="published_date" 
          v-model="formData.published_date" 
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-5">
        <button 
          type="button" 
          @click="$emit('close')" 
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient';

export default {
  name: 'BlogPostEditor',
  
  props: {
    blogPost: {
      type: Object,
      default: null
    }
  },
  
  emits: ['close', 'saved'],
  
  setup(props, { emit }) {
    const saving = ref(false);
    const mangaList = ref([]);
    
    // Determine if we're editing or creating
    const isEditing = computed(() => !!props.blogPost);
    
    // Form data with defaults
    const formData = reactive({
      title: '',
      slug: '',
      manga_id: '',
      featured_image: '',
      seo_description: '',
      seo_keywords: '',
      content: '',
      published_date: new Date().toISOString().slice(0, 16), // Format for datetime-local input
      views: 0
    });
    
    // If editing, populate form with existing data
    const initializeForm = () => {
      if (isEditing.value) {
        const post = props.blogPost;
        formData.title = post.title;
        formData.slug = post.slug;
        formData.manga_id = post.manga_id || '';
        formData.featured_image = post.featured_image || '';
        formData.seo_description = post.seo_description || '';
        formData.seo_keywords = post.seo_keywords || '';
        formData.content = post.content;
        
        // Format the date for the input
        if (post.published_date) {
          const date = new Date(post.published_date);
          formData.published_date = date.toISOString().slice(0, 16);
        }
        
        formData.views = post.views || 0;
      }
    };
    
    // Generate slug from title
    const generateSlug = () => {
      if (!formData.title) return;
      
      // Convert to lowercase, replace spaces with hyphens, remove special chars
      const slug = formData.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
        
      formData.slug = slug;
    };
    
    // Get list of manga for the select dropdown
    const fetchMangaList = async () => {
      try {
        const { data, error } = await supabase
          .from('manga_entries')
          .select('id, title')
          .order('title');
          
        if (error) throw error;
        mangaList.value = data || [];
      } catch (error) {
        console.error('Error fetching manga list:', error);
      }
    };
    
    // Save the blog post
    const saveBlogPost = async () => {
      try {
        saving.value = true;
        
        // Format the data for saving
        const postData = {
          title: formData.title,
          slug: formData.slug,
          manga_id: formData.manga_id || null,
          featured_image: formData.featured_image || null,
          seo_description: formData.seo_description,
          seo_keywords: formData.seo_keywords || null,
          content: formData.content,
          published_date: new Date(formData.published_date).toISOString(),
          views: formData.views
        };
        
        // For existing posts, include the updated_at timestamp
        if (isEditing.value) {
          postData.updated_at = new Date().toISOString();
        }
        
        let result;
        
        if (isEditing.value) {
          // Update existing post
          const { data, error } = await supabase
            .from('blog_posts')
            .update(postData)
            .eq('id', props.blogPost.id)
            .select()
            .single();
            
          if (error) throw error;
          result = data;
        } else {
          // Create new post
          const { data, error } = await supabase
            .from('blog_posts')
            .insert(postData)
            .select()
            .single();
            
          if (error) throw error;
          result = data;
        }
        
        emit('saved', result);
        emit('close');
      } catch (error) {
        console.error('Error saving blog post:', error);
        alert('An error occurred while saving the blog post. Please try again.');
      } finally {
        saving.value = false;
      }
    };
    
    // Initialize
    onMounted(() => {
      fetchMangaList();
      initializeForm();
    });
    
    return {
      formData,
      mangaList,
      isEditing,
      saving,
      generateSlug,
      saveBlogPost
    };
  }
}
</script>
