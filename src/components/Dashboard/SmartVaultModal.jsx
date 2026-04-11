import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, ref, get, set, update, storage, auth, functions, httpsCallable, signInWithCustomToken } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import PasswordInput from '../ui/PasswordInput'
import Spinner from '../ui/Spinner'
import { createVaultSecrets, decryptVaultFile, encryptVaultFile, unlockVaultKey } from '../../utils/vaultCrypto'
import { ocrImageForExpiry, OCR_ELIGIBLE_DOCS } from '../../utils/vaultOcr'
import './SmartVaultModal.css'

const DOCUMENT_TYPES = [
  { key: 'rc', title: 'Registration Certificate (RC)', icon: '📄' },
  { key: 'dl', title: 'Driving License (DL)', icon: '🪪' },
  { key: 'insurance', title: 'Insurance Policy', icon: '📋' },
  { key: 'puc', title: 'PUC Certificate', icon: '🌿' },
]

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 8 * 1024 * 1024

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const formatUploadTime = (timestamp) => {
  if (!timestamp) return 'Uploaded just now'
  return `Uploaded ${new Date(timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`
}

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

const canPreviewFile = (contentType) => contentType === 'application/pdf' || String(contentType || '').startsWith('image/')

const formatExpiryDate = (iso) => {
  if (!iso) return null
  const date = new Date(iso)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getExpiryStatus = (iso) => {
  if (!iso) return null
  const expiry = new Date(iso)
  if (isNaN(expiry.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: 'Expired', className: 'sv-expiry-expired', days }
  if (days <= 30) return { label: `Expires in ${days}d`, className: 'sv-expiry-soon', days }
  if (days <= 90) return { label: `Expires in ${days}d`, className: 'sv-expiry-warning', days }
  return { label: `Valid ${formatExpiryDate(iso)}`, className: 'sv-expiry-ok', days }
}

const SmartVaultModal = ({ open, onClose }) => {
  const { currentUser } = useAppContext()
  const [screen, setScreen] = useState('auth')
  const [hasPin, setHasPin] = useState(null)
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [vaultMeta, setVaultMeta] = useState({ documents: {} })
  const [vaultKey, setVaultKey] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState('')
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, elapsed: 0, phase: '' })
  const [openingDoc, setOpeningDoc] = useState('')
  const [openElapsed, setOpenElapsed] = useState(0)
  const [preview, setPreview] = useState(null)
  const fileInputsRef = useRef({})

  const documents = useMemo(() => vaultMeta.documents || {}, [vaultMeta.documents])

  const signInForVault = useCallback(async (customerKey, vaultPin) => {
    const mintVaultToken = httpsCallable(functions, 'mintVaultToken')
    const { data } = await mintVaultToken({ customerKey, pin: vaultPin })
    const cred = await signInWithCustomToken(auth, data.token)
    return cred.user
  }, [])

  const ensureVaultAuth = useCallback(async () => {
    if (auth.currentUser && auth.currentUser.uid === currentUser?.key) {
      return auth.currentUser
    }
    throw new Error('Vault session expired. Please re-enter your PIN.')
  }, [currentUser?.key])

  useEffect(() => {
    if (!open || !currentUser?.key) return

    const loadVaultMeta = async () => {
      setHasPin(null)
      try {
        const vaultRef = ref(db, `customers/${currentUser.key}/vault`)
        const snap = await get(vaultRef)
        const nextVault = snap.exists() ? snap.val() : { documents: {} }
        setVaultMeta({ ...nextVault, documents: nextVault.documents || {} })
        if (nextVault.pinHash || nextVault.pin) {
          setHasPin(true)
          setScreen('auth')
        } else {
          setHasPin(false)
          setScreen('setup')
        }
      } catch (vaultError) {
        console.error('Vault load error:', vaultError)
        setVaultMeta({ documents: {} })
        setHasPin(false)
        setScreen('setup')
      }
    }

    loadVaultMeta()
    setMobile('')
    setPin('')
    setConfirmPin('')
    setError('')
    setVaultKey(null)
  }, [open, currentUser?.key])

  const closePreview = useCallback(() => {
    setPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  const handleClose = useCallback(() => {
    closePreview()
    setScreen('auth')
    setMobile('')
    setPin('')
    setConfirmPin('')
    setError('')
    setVaultKey(null)
    setUploadingDoc('')
    setOpeningDoc('')
    onClose()
  }, [onClose, closePreview])

  const persistVaultMeta = useCallback(async (patch) => {
    const nextVaultMeta = {
      ...vaultMeta,
      ...patch,
      documents: patch.documents || vaultMeta.documents || {},
      updatedAt: new Date().toISOString(),
    }
    await update(ref(db, `customers/${currentUser.key}/vault`), nextVaultMeta)
    setVaultMeta(nextVaultMeta)
    return nextVaultMeta
  }, [currentUser?.key, vaultMeta])

  const handleSetupPin = async (e) => {
    e.preventDefault()
    setError('')

    if (pin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }
    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    setLoading(true)
    try {
      const { pinHash, pinSalt, key } = await createVaultSecrets(pin)
      const nextVault = {
        pinHash,
        pinSalt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: vaultMeta.documents || {},
      }
      await set(ref(db, `customers/${currentUser.key}/vault`), nextVault)
      await signInForVault(currentUser.key, pin)
      setVaultMeta(nextVault)
      setVaultKey(key)
      setHasPin(true)
      setScreen('vault')
      setPin('')
      setConfirmPin('')
      setMobile('')
      toast.success('Smart Vault secured successfully!')
    } catch (setupError) {
      console.error('Vault setup error:', setupError)
      setError('Failed to create PIN. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')

    if (mobile !== currentUser.mobile) {
      setError('Mobile number does not match')
      return
    }
    if (pin.length !== 4) {
      setError('Enter your 4-digit PIN')
      return
    }

    setLoading(true)
    try {
      const vaultRef = ref(db, `customers/${currentUser.key}/vault`)
      const snap = await get(vaultRef)
      const nextVault = snap.exists() ? snap.val() : null

      if (!nextVault) {
        setError('Vault not found. Please create a PIN first.')
        return
      }

      let nextKey = null
      let normalizedVault = { ...nextVault, documents: nextVault.documents || {} }

      if (nextVault.pinHash && nextVault.pinSalt) {
        nextKey = await unlockVaultKey(pin, nextVault.pinSalt, nextVault.pinHash)
      } else if (nextVault.pin === pin) {
        const migratedSecrets = await createVaultSecrets(pin)
        normalizedVault = {
          ...normalizedVault,
          pinHash: migratedSecrets.pinHash,
          pinSalt: migratedSecrets.pinSalt,
          updatedAt: new Date().toISOString(),
        }
        delete normalizedVault.pin
        await set(vaultRef, normalizedVault)
        nextKey = migratedSecrets.key
      }

      if (!nextKey) {
        setError('Incorrect PIN. Try again.')
        return
      }

      await signInForVault(currentUser.key, pin)
      setVaultMeta(normalizedVault)
      setVaultKey(nextKey)
      setScreen('vault')
      setPin('')
      setMobile('')
      toast.success('Vault unlocked')
    } catch (authError) {
      console.error('Vault auth error:', authError)
      const fnMessage = authError?.code === 'functions/resource-exhausted'
        ? authError.message
        : authError?.code === 'functions/permission-denied'
          ? authError.message
          : null
      setError(fnMessage || 'Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const triggerFileSelect = (docKey) => {
    if (!vaultKey || uploadingDoc) return
    fileInputsRef.current[docKey]?.click()
  }

  const triggerCameraCapture = (docKey) => {
    if (!vaultKey || uploadingDoc) return
    fileInputsRef.current[`${docKey}-camera`]?.click()
  }

  const handleUploadDocument = async (docKey, file) => {
    if (!file || !currentUser?.key || !vaultKey) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PDF, JPG, PNG, and WEBP files are allowed.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Maximum file size is 8 MB.')
      return
    }

    setUploadingDoc(docKey)
    setUploadProgress({ percent: 0, elapsed: 0, phase: 'Preparing…' })
    const startTime = Date.now()
    const elapsedInterval = setInterval(() => {
      setUploadProgress((prev) => ({ ...prev, elapsed: Date.now() - startTime }))
    }, 100)

    let extractedExpiry = null
    try {
      await ensureVaultAuth()

      // Run OCR on images for eligible doc types (DL, PUC, Insurance)
      if (OCR_ELIGIBLE_DOCS.has(docKey) && file.type.startsWith('image/')) {
        setUploadProgress((prev) => ({ ...prev, phase: 'Scanning for expiry…', percent: 0 }))
        try {
          const ocrResult = await ocrImageForExpiry(file, (p) => {
            setUploadProgress((prev) => ({ ...prev, percent: p }))
          }, docKey)
          extractedExpiry = ocrResult?.expiryDate || null
        } catch (ocrErr) {
          console.warn('OCR failed:', ocrErr)
        }
      }

      setUploadProgress((prev) => ({ ...prev, phase: 'Encrypting…', percent: 0 }))
      const encryptedFile = await encryptVaultFile(file, vaultKey)
      const safeName = sanitizeFileName(file.name)
      const storagePath = `vault/${currentUser.key}/${docKey}/${Date.now()}-${safeName}.enc`
      const docStorageRef = storageRef(storage, storagePath)

      setUploadProgress((prev) => ({ ...prev, phase: 'Uploading…', percent: 0 }))
      await new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(docStorageRef, encryptedFile.encryptedBytes, {
          contentType: 'application/octet-stream',
          customMetadata: {
            docType: docKey,
            encrypted: 'true',
            ownerKey: currentUser.key,
            originalName: safeName,
          },
        })
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            setUploadProgress((prev) => ({ ...prev, percent }))
          },
          reject,
          resolve
        )
      })

      const previousDoc = documents[docKey]
      if (previousDoc?.storagePath) {
        deleteObject(storageRef(storage, previousDoc.storagePath)).catch(() => {})
      }

      const nextDocuments = {
        ...documents,
        [docKey]: {
          fileName: file.name,
          storagePath,
          contentType: file.type,
          size: file.size,
          iv: encryptedFile.iv,
          uploadedAt: new Date().toISOString(),
          expiryDate: extractedExpiry || null,
        },
      }

      await persistVaultMeta({ documents: nextDocuments })
      toast.success(
        extractedExpiry
          ? `Uploaded. Expiry detected: ${extractedExpiry}`
          : 'Document encrypted and uploaded.'
      )
    } catch (uploadError) {
      console.error('Vault upload error:', uploadError)
      const msg = uploadError?.code === 'storage/unauthorized'
        ? 'Vault session expired. Close the modal and re-enter your PIN.'
        : uploadError?.message || 'Upload failed. Please try again.'
      toast.error(msg)
    } finally {
      clearInterval(elapsedInterval)
      setUploadingDoc('')
      setUploadProgress({ percent: 0, elapsed: 0, phase: '' })
    }
  }

  const handleOpenDocument = async (docKey, mode = 'view') => {
    const doc = documents[docKey]
    if (!doc || !vaultKey) return

    setOpeningDoc(docKey)
    setOpenElapsed(0)
    const openStart = Date.now()
    const openInterval = setInterval(() => {
      setOpenElapsed(Date.now() - openStart)
    }, 100)

    try {
      await ensureVaultAuth()
      const downloadUrl = await getDownloadURL(storageRef(storage, doc.storagePath))
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
      const encryptedBytes = await response.arrayBuffer()
      const decryptedBuffer = await decryptVaultFile(encryptedBytes, doc.iv, vaultKey)
      const blob = new Blob([decryptedBuffer], {
        type: doc.contentType || 'application/octet-stream',
      })
      const objectUrl = URL.createObjectURL(blob)

      if (mode === 'download' || !canPreviewFile(doc.contentType)) {
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = doc.fileName || `${docKey}.bin`
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
      } else {
        setPreview({
          url: objectUrl,
          contentType: doc.contentType,
          fileName: doc.fileName || docKey,
        })
      }
    } catch (openError) {
      console.error('Vault fetch error:', openError)
      const msg = openError?.code === 'storage/unauthorized'
        ? 'Vault session expired. Close the modal and re-enter your PIN.'
        : openError?.message || 'Unable to decrypt this document.'
      toast.error(msg)
    } finally {
      clearInterval(openInterval)
      setOpeningDoc('')
      setOpenElapsed(0)
    }
  }

  if (!open) return null

  if (hasPin === null) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content sv-modal" onClick={(e) => e.stopPropagation()}>
          <Spinner text="Loading Smart Vault" />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content sv-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>

        {screen === 'setup' && (
          <div className="sv-screen">
            <div className="sv-header">
              <div className="sv-icon">🔐</div>
              <h2>Create Vault PIN</h2>
              <p>Your files will be encrypted in this browser before upload.</p>
            </div>
            <form onSubmit={handleSetupPin}>
              <div className="sv-field">
                <label>Create 4-digit PIN</label>
                <PasswordInput
                  placeholder="● ● ● ●"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-pin-input"
                />
              </div>
              <div className="sv-field">
                <label>Confirm PIN</label>
                <PasswordInput
                  placeholder="● ● ● ●"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-pin-input"
                />
              </div>
              {error && <p className="sv-error">{error}</p>}
              <button type="submit" className="sv-submit" disabled={loading}>
                {loading ? 'Securing...' : 'Create Secure Vault'}
              </button>
            </form>
          </div>
        )}

        {screen === 'auth' && (
          <div className="sv-screen">
            <div className="sv-header">
              <div className="sv-icon">🔒</div>
              <h2>Unlock Smart Vault</h2>
              <p>Use your registered mobile number and vault PIN to decrypt documents.</p>
            </div>
            <form onSubmit={handleAuth}>
              <div className="sv-field">
                <label>Registered Mobile</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-input"
                />
              </div>
              <div className="sv-field">
                <label>4-digit PIN</label>
                <PasswordInput
                  placeholder="● ● ● ●"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-pin-input"
                />
              </div>
              {error && <p className="sv-error">{error}</p>}
              <button type="submit" className="sv-submit" disabled={loading}>
                {loading ? 'Unlocking...' : 'Unlock Vault'}
              </button>
            </form>
          </div>
        )}

        {screen === 'vault' && (
          <div className="sv-screen">
            <div className="sv-header">
              <div className="sv-icon">🛡️</div>
              <h2>Smart Vault</h2>
              <p>Your encrypted document storage</p>
            </div>

            <div className="sv-security-note">
              Files are encrypted in your browser with your vault PIN before upload. Rakshak stores encrypted files and metadata only.
            </div>

            <div className="sv-vault-grid">
              {DOCUMENT_TYPES.map((docType) => {
                const currentDoc = documents[docType.key]
                const isUploading = uploadingDoc === docType.key
                const isOpening = openingDoc === docType.key
                const expiryStatus = currentDoc?.expiryDate ? getExpiryStatus(currentDoc.expiryDate) : null

                return (
                  <div key={docType.key} className="sv-doc-card">
                    <div className="sv-doc-head">
                      <div className="sv-doc-icon">{docType.icon}</div>
                      <div className="sv-doc-info">
                        <div className="sv-doc-title-row">
                          <h4>{docType.title}</h4>
                          {expiryStatus && (
                            <span className={`sv-expiry-badge ${expiryStatus.className}`}>
                              {expiryStatus.label}
                            </span>
                          )}
                        </div>
                        <p className={`sv-doc-status ${currentDoc ? 'sv-doc-status-live' : ''}`}>
                          {currentDoc ? `${formatFileSize(currentDoc.size)} • ${formatUploadTime(currentDoc.uploadedAt)}` : 'Not uploaded'}
                        </p>
                        <span className="sv-doc-file">
                          {currentDoc ? currentDoc.fileName : 'PDF, JPG, PNG, WEBP up to 8 MB'}
                        </span>
                      </div>
                    </div>

                    <input
                      ref={(node) => { fileInputsRef.current[docType.key] = node }}
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="sv-hidden-input"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0]
                        handleUploadDocument(docType.key, selectedFile)
                        e.target.value = ''
                      }}
                    />
                    <input
                      ref={(node) => { fileInputsRef.current[`${docType.key}-camera`] = node }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sv-hidden-input"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0]
                        handleUploadDocument(docType.key, selectedFile)
                        e.target.value = ''
                      }}
                    />

                    <div className="sv-doc-actions">
                      <button
                        className="sv-doc-btn sv-doc-btn-primary"
                        onClick={() => triggerFileSelect(docType.key)}
                        disabled={isUploading || Boolean(uploadingDoc)}
                      >
                        {isUploading ? '...' : currentDoc ? 'Replace' : 'Upload'}
                      </button>

                      <button
                        className="sv-doc-btn sv-doc-btn-icon sv-doc-btn-camera"
                        onClick={() => triggerCameraCapture(docType.key)}
                        disabled={isUploading || Boolean(uploadingDoc)}
                        aria-label="Take photo"
                        title="Take photo"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </button>

                      {currentDoc && (
                        <>
                          <button
                            className="sv-doc-btn sv-doc-btn-secondary"
                            onClick={() => handleOpenDocument(docType.key, 'view')}
                            disabled={isOpening}
                          >
                            {isOpening ? '...' : canPreviewFile(currentDoc.contentType) ? 'View' : 'Open'}
                          </button>
                          <button
                            className="sv-doc-btn sv-doc-btn-icon"
                            onClick={() => handleOpenDocument(docType.key, 'download')}
                            disabled={isOpening}
                            aria-label="Download"
                          >
                            ⬇
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="sv-vault-footer">
              <span>🔐</span> Documents are encrypted before upload and decrypted only after vault unlock.
            </div>
          </div>
        )}
      </div>

      {(uploadingDoc || openingDoc) && (
        <div className="sv-loader-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="sv-loader-card">
            <div className="sv-loader-ring" />
            <p className="sv-loader-title">
              {uploadingDoc ? (uploadProgress.phase || 'Uploading…') : 'Fetching & decrypting…'}
            </p>
            {uploadingDoc && (
              <>
                <div className="sv-loader-bar">
                  <div className="sv-loader-bar-fill" style={{ width: `${uploadProgress.percent}%` }} />
                </div>
                <p className="sv-loader-meta">
                  {uploadProgress.percent}% • {(uploadProgress.elapsed / 1000).toFixed(1)}s
                </p>
              </>
            )}
            {openingDoc && (
              <p className="sv-loader-meta">{(openElapsed / 1000).toFixed(1)}s</p>
            )}
          </div>
        </div>
      )}

      {preview && (
        <div className="sv-preview-overlay" onClick={(e) => { e.stopPropagation(); closePreview() }}>
          <div className="sv-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="sv-preview-header">
              <span className="sv-preview-title">{preview.fileName}</span>
              <button className="sv-preview-close" onClick={closePreview} aria-label="Close preview">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13" />
                  <line x1="13" y1="1" x2="1" y2="13" />
                </svg>
              </button>
            </div>
            <div className="sv-preview-body">
              {preview.contentType === 'application/pdf' ? (
                <iframe
                  src={preview.url}
                  title={preview.fileName}
                  className="sv-preview-iframe"
                />
              ) : (
                <img
                  src={preview.url}
                  alt={preview.fileName}
                  className="sv-preview-image"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartVaultModal
