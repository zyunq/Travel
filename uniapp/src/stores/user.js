import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { BASE_URL } from '@/config'

export const useUserStore = defineStore('user', () => {