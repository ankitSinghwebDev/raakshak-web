// Helper Functions

export const formatPhoneNumber = (number) => {
  const cleaned = number.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return cleaned
}

export const validateVehicleNumber = (number) => {
  const pattern = /^[A-Z]{2}\s?\d{2}\s?[A-Z]{2}\s?\d{4}$/i
  return pattern.test(number.toUpperCase())
}

export const validateMobileNumber = (number) => {
  const pattern = /^[6-9]\d{9}$/
  return pattern.test(number)
}

export const validateEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

export const generateUserId = () => {
  return `RKSK${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`
}

export const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(date).toLocaleDateString('en-IN', options)
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export const generateQRCodeUrl = (data, size = 200) => {
  const encodedData = encodeURIComponent(data)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`
}

export const getPublicSiteUrl = () => {
  const envUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export const buildPublicSiteUrl = (path = '/', params = {}) => {
  const baseUrl = getPublicSiteUrl()
  const url = new URL(path, `${baseUrl}/`)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

export const getFileExtension = (file) => {
  return file.name.split('.').pop()
}

export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
