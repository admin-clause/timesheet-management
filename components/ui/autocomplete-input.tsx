'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from './input'

type AutocompleteInputProps = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  suggestions: string[]
}

const MAX_SUGGESTIONS = 10

export function AutocompleteInput({ value, onChange, suggestions }: AutocompleteInputProps) {
  const [filtered, setFiltered] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null) // Ref for the input
  const [style, setStyle] = useState<React.CSSProperties>({}) // State for position

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setStyle({
        left: `${rect.left}px`,
        top: `${rect.bottom}px`,
        width: `${rect.width}px`,
      })
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value
    if (userInput) {
      const filteredSuggestions = suggestions.filter(s =>
        s.toLowerCase().includes(userInput.toLowerCase())
      )
      setFiltered(filteredSuggestions.slice(0, MAX_SUGGESTIONS))
      setIsOpen(true)
      updatePosition()
    } else {
      setFiltered([])
      setIsOpen(false)
    }
    setActiveIndex(-1)
    onChange(e)
  }

  const handleFocus = () => {
    if (value && filtered.length > 0) {
      setIsOpen(true)
      updatePosition()
    }
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

    const handleResizeOrScroll = () => {
      if (isOpen) {
        updatePosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleResizeOrScroll)
    window.addEventListener('scroll', handleResizeOrScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResizeOrScroll)
      window.removeEventListener('scroll', handleResizeOrScroll, true)
    }
  }, [isOpen, updatePosition])

  return (
    <div className="relative" ref={containerRef}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        autoComplete="off"
        onKeyDown={handleKeyDown}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          style={style}
          className="fixed z-50 bg-background border border-input rounded-md mt-1 max-h-60 overflow-y-auto"
        >
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
