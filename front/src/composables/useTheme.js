import { ref } from 'vue'

const isDarkMode = ref(false)

export function useTheme() {
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setTheme(true)
    } else if (savedTheme === 'light') {
      setTheme(false)
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark)
    }
  }

  const setTheme = (dark) => {
    isDarkMode.value = dark
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
    }
  }

  const toggleTheme = () => {
    setTheme(!isDarkMode.value)
  }

  return {
    isDarkMode,
    toggleTheme,
    initTheme,
    setTheme
  }
}
