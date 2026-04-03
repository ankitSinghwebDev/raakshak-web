import React, { useRef, useEffect, useState, useCallback } from 'react'
import { REVIEWS } from '../../utils/constants'
import './Reviews.css'

const StarRating = ({ rating }) => (
  <div className="review-stars">
    {Array.from({ length: rating }, (_, i) => (
      <span key={i}>⭐</span>
    ))}
  </div>
)

const Reviews = () => {
  const trackRef = useRef(null)
  const autoPlayRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollStart = useRef(0)

  // Auto-scroll with seamless loop
  const startAutoPlay = useCallback(() => {
    stopAutoPlay()
    autoPlayRef.current = setInterval(() => {
      const track = trackRef.current
      if (!track) return
      const halfScroll = track.scrollWidth / 2
      // When we've scrolled past the first set of cloned cards, jump back seamlessly
      if (track.scrollLeft >= halfScroll) {
        track.scrollLeft = track.scrollLeft - halfScroll
      }
      track.scrollBy({ left: 320, behavior: 'smooth' })
    }, 3500)
  }, [])

  const stopAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
  }

  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [startAutoPlay])

  // Arrow click
  const scroll = (direction) => {
    const track = trackRef.current
    if (!track) return
    const amount = direction === 'left' ? -300 : 300
    track.scrollBy({ left: amount, behavior: 'smooth' })
    stopAutoPlay()
    startAutoPlay()
  }

  // Touch/Mouse drag
  const handleDragStart = (e) => {
    isDragging.current = true
    startX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    scrollStart.current = trackRef.current.scrollLeft
    stopAutoPlay()
  }

  const handleDragMove = (e) => {
    if (!isDragging.current) return
    const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    const diff = startX.current - x
    trackRef.current.scrollLeft = scrollStart.current + diff
  }

  const handleDragEnd = () => {
    isDragging.current = false
    startAutoPlay()
  }

  return (
    <section className="reviews-section" id="reviews">
      <div className="section-container">
        <h2 className="section-title">
          What Our <span className="highlight">Guardians</span> Say
        </h2>
        <p className="section-subtitle">TRUSTED BY 2,400+ VEHICLE OWNERS ACROSS INDIA</p>

        <div className="reviews-carousel">
          {/* Left Arrow */}
          <button className="carousel-arrow carousel-arrow-left" onClick={() => scroll('left')}>
            ❮
          </button>

          {/* Track */}
          <div
            className="reviews-track"
            ref={trackRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {[...REVIEWS, ...REVIEWS].map((review, index) => (
              <div key={`${review.id}-${index}`} className="review-card">
                <StarRating rating={review.rating} />
                <p className="review-text">"{review.text}"</p>
                <div className="review-author">
                  <span className="review-name">{review.name}</span>
                  <span className="review-location">
                    {review.location} {review.verified && '✅ Verified'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button className="carousel-arrow carousel-arrow-right" onClick={() => scroll('right')}>
            ❯
          </button>
        </div>
      </div>
    </section>
  )
}

export default Reviews
