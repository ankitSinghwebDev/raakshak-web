import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { ref as storageRef, uploadBytes, getBytes, deleteObject } from 'firebase/storage'
import { db, ref, get, set, update, storage, auth, functions, httpsCallable, signInWithCustomToken } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import PasswordInput from '../ui/PasswordInput'
import Spinner from '../ui/Spinner'
import { createVaultSecrets, decryptVaultFile, encryptVaultFile, unlockVaultKey } from '../../utils/vaultCrypto'
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
  const [openingDoc, setOpeningDoc] = useState('')
  const fileInputsRef = useRef({})

  const documents = useMemo(() => vaultMeta.documents || {}, [vaultMeta.documents])

  const signInForVault = useCallback(async (customerKey, vaultPin) => {
    const mintVaultToken = httpsCallable(functions, 'mintVaultToken')
    const { data } = await mintVaultToken({ customerKey, pin: vaultPin })
    await signInWithCustomToken(auth, data.token)
  }, [])

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

  const handleClose = useCallback(() => {
    setScreen('auth')
    setMobile('')
    setPin('')
    setConfirmPin('')
    setError('')
    setVaultKey(null)
    setUploadingDoc('')
    setOpeningDoc('')
    onClose()
  }, [onClose])

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
    try {
      const encryptedFile = await encryptVaultFile(file, vaultKey)
      const safeName = sanitizeFileName(file.name)
      const storagePath = `vault/${currentUser.key}/${docKey}/${Date.now()}-${safeName}.enc`
      const docStorageRef = storageRef(storage, storagePath)

      await uploadBytes(docStorageRef, encryptedFile.encryptedBytes, {
        contentType: 'application/octet-stream',
        customMetadata: {
          docType: docKey,
          encrypted: 'true',
          ownerKey: currentUser.key,
          originalName: safeName,
        },
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
        },
      }

      await persistVaultMeta({ documents: nextDocuments })
      toast.success('Document encrypted and uploaded.')
    } catch (uploadError) {
      console.error('Vault upload error:', uploadError)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploadingDoc('')
    }
  }

  const handleOpenDocument = async (docKey, mode = 'view') => {
    const doc = documents[docKey]
    if (!doc || !vaultKey) return

    setOpeningDoc(docKey)
    try {
      const encryptedBytes = await getBytes(storageRef(storage, doc.storagePath))
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
      } else {
        window.open(objectUrl, '_blank', 'noopener,noreferrer')
      }

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    } catch (openError) {
      console.error('Vault fetch error:', openError)
      toast.error('Unable to decrypt this document.')
    } finally {
      setOpeningDoc('')
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

                return (
                  <div key={docType.key} className="sv-doc-card">
                    <div className="sv-doc-icon">{docType.icon}</div>
                    <div className="sv-doc-info">
                      <h4>{docType.title}</h4>
                      <p className={`sv-doc-status ${currentDoc ? 'sv-doc-status-live' : ''}`}>
                        {currentDoc ? `${formatFileSize(currentDoc.size)} • ${formatUploadTime(currentDoc.uploadedAt)}` : 'Not uploaded'}
                      </p>
                      <span className="sv-doc-file">
                        {currentDoc ? currentDoc.fileName : 'PDF, JPG, PNG, WEBP up to 8 MB'}
                      </span>
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

                    <div className="sv-doc-actions">
                      <button
                        className="sv-doc-btn sv-doc-btn-primary"
                        onClick={() => triggerFileSelect(docType.key)}
                        disabled={isUploading || Boolean(uploadingDoc)}
                      >
                        {isUploading ? '...' : currentDoc ? 'Replace' : 'Upload'}
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
                            className="sv-doc-btn sv-doc-btn-secondary"
                            onClick={() => handleOpenDocument(docType.key, 'download')}
                            disabled={isOpening}
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
    </div>
  )
}

export default SmartVaultModal
