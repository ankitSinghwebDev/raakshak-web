import { useEffect } from 'react'

let lockCount = 0

const useBodyLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      lockCount++
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`

      return () => {
        lockCount--
        if (lockCount <= 0) {
          lockCount = 0
          document.body.style.overflow = ''
          document.body.style.paddingRight = ''
        }
      }
    }
  }, [isLocked])
}

export default useBodyLock
