'use client'

import { useEffect, useRef } from 'react'

interface HashVisualizerProps {
  hash: string
  size?: number
  className?: string
}

/**
 * HashVisualizer - Generates unique visual fingerprints from cryptographic hashes
 *
 * This component turns a document's SHA-256 hash into a unique, recognizable
 * visual pattern. Each hash produces a deterministic pattern that helps users
 * visually identify documents at a glance while maintaining cryptographic integrity.
 *
 * Inspired by GitHub identicons and blockchain address visualizers.
 */
export function HashVisualizer({ hash, size = 64, className = '' }: HashVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !hash) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with high DPI support
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    // Generate deterministic pattern from hash
    const pattern = generatePatternFromHash(hash, size, ctx)
    drawPattern(ctx, pattern, size)
  }, [hash, size])

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg border border-gray-200 ${className}`}
      aria-label={`Visual fingerprint for hash ${hash.slice(0, 16)}...`}
    />
  )
}

/**
 * Generate a deterministic pattern from a hash string
 */
function generatePatternFromHash(hash: string, size: number, ctx: CanvasRenderingContext2D) {
  // Remove '0x' prefix if present
  const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash

  // Create a deterministic seed from the hash
  const seed = parseInt(cleanHash.slice(0, 8), 16)

  // Generate colors from different parts of the hash
  const hue1 = parseInt(cleanHash.slice(0, 4), 16) % 360
  const hue2 = parseInt(cleanHash.slice(4, 8), 16) % 360
  const saturation = 60 + (parseInt(cleanHash.slice(8, 10), 16) % 40)
  const lightness = 50 + (parseInt(cleanHash.slice(10, 12), 16) % 20)

  // Generate grid pattern (8x8)
  const gridSize = 8
  const cellSize = size / gridSize
  const grid: boolean[][] = []

  for (let y = 0; y < gridSize; y++) {
    grid[y] = []
    for (let x = 0; x < gridSize / 2; x++) {
      // Use hash bytes to determine if cell is filled
      const hashIndex = (y * (gridSize / 2) + x) % (cleanHash.length / 2)
      const hashByte = parseInt(cleanHash.slice(hashIndex * 2, hashIndex * 2 + 2), 16)
      const isFilled = hashByte > 127

      grid[y][x] = isFilled
      grid[y][gridSize - 1 - x] = isFilled // Mirror for symmetry
    }
  }

  return {
    grid,
    gridSize,
    cellSize,
    color1: `hsl(${hue1}, ${saturation}%, ${lightness}%)`,
    color2: `hsl(${hue2}, ${saturation}%, ${lightness}%)`,
    backgroundColor: '#ffffff'
  }
}

/**
 * Draw the pattern onto the canvas
 */
function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: any,
  size: number
) {
  const { grid, gridSize, cellSize, color1, color2, backgroundColor } = pattern

  // Clear and set background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, size, size)

  // Draw grid pattern
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x]) {
        // Alternate colors based on position for visual interest
        ctx.fillStyle = (x + y) % 2 === 0 ? color1 : color2

        // Draw cell with small gap for definition
        const gap = cellSize * 0.1
        ctx.fillRect(
          x * cellSize + gap,
          y * cellSize + gap,
          cellSize - gap * 2,
          cellSize - gap * 2
        )
      }
    }
  }
}

/**
 * HashVisualizerSmall - Compact version for lists
 */
export function HashVisualizerSmall({ hash, className = '' }: { hash: string; className?: string }) {
  return <HashVisualizer hash={hash} size={32} className={className} />
}

/**
 * HashVisualizerLarge - Large version for document details
 */
export function HashVisualizerLarge({ hash, className = '' }: { hash: string; className?: string }) {
  return <HashVisualizer hash={hash} size={128} className={className} />
}
