<template>
  <div class="flex items-center">
    <label :for="id" class="flex items-center cursor-pointer">
      <div class="relative">
        <input 
          :id="id" 
          type="checkbox" 
          class="sr-only" 
          :checked="modelValue" 
          @change="$emit('update:modelValue', $event.target.checked); $emit('change')"
        />
        <div class="block manga-border w-14 h-7 rounded-full bg-gray-800"></div>
        <div 
          class="dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition transform"
          :class="{ 'translate-x-7 bg-red-500': modelValue }"
        ></div>
      </div>
      <div class="ml-3 text-gray-200">{{ label }}</div>
    </label>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    }
  },
  
  emits: ['update:modelValue', 'change'],
  
  setup() {
    const id = ref(`toggle-${Math.random().toString(36).substring(2, 9)}`);
    
    return { id };
  }
};
</script>
