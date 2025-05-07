<template>
  <teleport to="body">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="modal-container">
      <div class="modal-content manga-panel" :class="sizeClass">
        <div class="modal-header border-b border-gray-700 pb-4 mb-4">
          <slot name="header">
            <h3 class="manga-title text-xl">Modal Title</h3>
          </slot>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer border-t border-gray-700 pt-4 mt-4">
          <slot name="footer">
            <button 
              @click="$emit('close')" 
              class="manga-border px-4 py-2 hover:bg-gray-700 transition"
            >
              Close
            </button>
          </slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { onMounted, onBeforeUnmount } from 'vue';

export default {
  name: 'Modal',
  props: {
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large', 'xl'].includes(value)
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // Handle ESC key to close modal
    function handleKeydown(e) {
      if (e.key === 'Escape') {
        emit('close');
      }
    }
    
    // Compute CSS classes based on size prop
    const sizeClass = computed(() => {
      return `modal-${props.size}`;
    });
    
    onMounted(() => {
      document.addEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
    
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = ''; // Restore scrolling
    });
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
  z-index: 100;
}

.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 101;
  padding: 1rem;
  overflow-y: auto;
}

.modal-content {
  background-color: #1f2937;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  transition: all 0.3s ease;
  padding: 1.5rem;
}

.modal-small {
  max-width: 24rem; /* 384px */
}

.modal-medium {
  max-width: 32rem; /* 512px */
}

.modal-large {
  max-width: 48rem; /* 768px */
}

.modal-xl {
  max-width: 64rem; /* 1024px */
}

@media (max-width: 640px) {
  .modal-content {
    max-width: 100% !important;
    padding: 1rem;
  }
}
</style>

.modal-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content {
  background: #1f2937;
  padding: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Custom scrollbar for the modal */
.modal-container::-webkit-scrollbar {
  width: 6px;
}

.modal-container::-webkit-scrollbar-track {
  background: #111827;
}

.modal-container::-webkit-scrollbar-thumb {
  background: #ef4444;
  border-radius: 3px;
}
</style>
