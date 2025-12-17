"use client"

import { useEffect, useState } from "react"

interface RollingPriceProps {
  price: string
  isYearly: boolean
}

export function RollingPrice({ price, isYearly }: RollingPriceProps) {
  const [displayPrice, setDisplayPrice] = useState(price)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (price !== displayPrice) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setDisplayPrice(price)
        setIsAnimating(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [price, displayPrice])

  const priceLength = displayPrice.length

  return (
    <div className="text-start">
      <div className="text-3xl font-bold flex items-baseline gap-0.5">
        {displayPrice.split("").map((char, index) => (
          <span
            key={`${displayPrice}-${index}`}
            className={`inline-block transition-all duration-500 ease-in-out ${
              isAnimating ? "opacity-0 -translate-y-8" : "opacity-100 translate-y-0"
            }`}
            style={{
              transitionDelay: `${(priceLength - 1 - index) * 30}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  )
}
