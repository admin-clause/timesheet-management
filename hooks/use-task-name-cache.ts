import { useEffect, useState } from 'react'

const CACHE_KEY_PREFIX = 'taskNameCache'

export function useTaskNameCache(userId?: number) {
  const [taskNames, setTaskNames] = useState<string[]>([])

  useEffect(() => {
    const cacheKey = userId ? `${CACHE_KEY_PREFIX}-${userId}` : CACHE_KEY_PREFIX

    // 1. Try to load names from localStorage on initial mount.
    try {
      const cachedNames = localStorage.getItem(cacheKey)
      if (cachedNames) {
        setTaskNames(JSON.parse(cachedNames))
      }
    } catch (error) {
      console.error('Failed to load task names from localStorage:', error)
    }

    // 2. Fetch the latest list from the API to keep the cache fresh.
    const params = new URLSearchParams()
    if (typeof userId === 'number') {
      params.append('userId', userId.toString())
    }
    const url = `/api/tasks?${params.toString()}`

    fetch(url)
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        return []
      })
      .then(latestNames => {
        // 3. Update state and localStorage with the fresh list.
        setTaskNames(latestNames)
        localStorage.setItem(cacheKey, JSON.stringify(latestNames))
      })
      .catch(error => {
        console.error('Failed to fetch latest task names:', error)
      })
  }, [userId]) // Rerun effect if userId changes

  return taskNames
}
