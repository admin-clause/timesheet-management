import { useEffect, useState } from 'react'

const CACHE_KEY = 'taskNameCache'

export function useTaskNameCache() {
  const [taskNames, setTaskNames] = useState<string[]>([])

  useEffect(() => {
    try {
      // 1. Try to load names from localStorage on initial mount.
      const cachedNames = localStorage.getItem(CACHE_KEY)
      if (cachedNames) {
        setTaskNames(JSON.parse(cachedNames))
      }
    } catch (error) {
      console.error('Failed to load task names from localStorage:', error)
    }

    // 2. Fetch the latest list from the API to keep the cache fresh.
    fetch('/api/tasks')
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        return []
      })
      .then(latestNames => {
        // 3. Update state and localStorage with the fresh list.
        setTaskNames(latestNames)
        localStorage.setItem(CACHE_KEY, JSON.stringify(latestNames))
      })
      .catch(error => {
        console.error('Failed to fetch latest task names:', error)
      })
  }, [])

  return taskNames
}
