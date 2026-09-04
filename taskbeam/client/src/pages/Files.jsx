import { useState, useRef } from 'react'
import styles from './Files.module.css'
import { api } from '../services/api'

const FILE_ICONS = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
}

function getFileIcon(mimeType) {
  return FILE_ICONS[mimeType] || '📎'
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Files({ files, setFiles, activeProjectId }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  setUploading(true)
  setError('')
  try {
    const { uploadUrl, file: fileRecord } = await api.getUploadUrl({
      project_id: activeProjectId,
      name: file.name,
      mime_type: file.type,
      size: file.size,
    })
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) throw new Error('Upload to S3 failed')
    setFiles(prev => [fileRecord, ...prev])
  } catch (err) {
    console.error('Upload failed:', err)
    setError('Upload failed. Please try again.')
  } finally {
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
}

  async function handleDownload(file) {
    try {
      const { downloadUrl } = await api.getDownloadUrl(file.id)
      window.open(downloadUrl, '_blank')
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  async function handleToggleVisibility(file) {
    try {
      const updated = await api.toggleFileVisibility(file.id, !file.client_visible)
      setFiles(prev => prev.map(f => f.id === file.id ? updated : f))
    } catch (err) {
      console.error('Failed to update visibility:', err)
    }
  }

  async function handleDelete(file) {
    try {
      await api.deleteFile(file.id)
      setFiles(prev => prev.filter(f => f.id !== file.id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Files</h1>
          <span className={styles.sub}>{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.uploadArea}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
          />
          <button
            className={styles.btnPrimary}
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload file'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {files.length === 0 ? (
        <div className={styles.empty}>
          <p>No files yet. Upload invoices, blueprints, or photos to share with your client.</p>
        </div>
      ) : (
        <div className={styles.fileList}>
          {files.map(file => (
            <div key={file.id} className={styles.fileCard}>
              <div className={styles.fileIcon}>{getFileIcon(file.mime_type)}</div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileMeta}>
                  {formatSize(file.size)} · {new Date(file.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.fileActions}>
                <button
                  className={`${styles.visibilityBtn} ${file.client_visible ? styles.visibilityOn : ''}`}
                  onClick={() => handleToggleVisibility(file)}
                >
                  {file.client_visible ? 'Client: on' : 'Client: off'}
                </button>
                <button className={styles.btnAction} onClick={() => handleDownload(file)}>
                  Download
                </button>
                <button
                  className={`${styles.btnAction} ${styles.btnDanger}`}
                  onClick={() => handleDelete(file)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}