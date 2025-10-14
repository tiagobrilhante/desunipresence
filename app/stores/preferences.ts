type ThemeMode = 'light' | 'dark'

export const usePreferencesStore = defineStore(
  'preferences',
  () => {
    const theme = ref<ThemeMode>('dark')

    const setTheme = (mode: ThemeMode) => {
      theme.value = mode
    }

    const toggleTheme = () => {
      setTheme(theme.value === 'dark' ? 'light' : 'dark')
    }

    const initializeTheme = (mode?: ThemeMode) => {
      if (mode) {
        theme.value = mode
      }
    }

    return {
      theme,
      setTheme,
      toggleTheme,
      initializeTheme
    }
  },
  {
    persist: true
  }
)
