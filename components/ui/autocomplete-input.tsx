import { useEffect, useRef, useState } from 'react'
import { Input } from './input'

type AutocompleteInputProps = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  suggestions: string[]
}

export function AutocompleteInput({ value, onChange, suggestions }: AutocompleteInputProps) {
  const [filtered, setFiltered] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value
    if (userInput) {
      const filteredSuggestions = suggestions.filter(s =>
        s.toLowerCase().includes(userInput.toLowerCase())
      )
      setFiltered(filteredSuggestions)
      setIsOpen(true)
    } else {
      setFiltered([])
      setIsOpen(false)
    }
    setActiveIndex(-1) // Reset active index on change
    onChange(e)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>)
    setFiltered([])
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filtered.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1))
        break
      case 'Enter':
        if (activeIndex > -1) {
          e.preventDefault()
          handleSuggestionClick(filtered[activeIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && filtered.length > 0 && setIsOpen(true)}
        autoComplete="off"
        onKeyDown={handleKeyDown}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 w-full bg-background border border-input rounded-md mt-1 max-h-60 overflow-y-auto">
          {filtered.map((suggestion, index) => (
            <li
              key={suggestion}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              className={`p-2 text-sm hover:bg-accent cursor-pointer ${
                index === activeIndex ? 'bg-accent' : ''
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
