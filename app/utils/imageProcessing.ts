interface ResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: string
}

const loadImageBitmap = async (file: File) => {
  if ('createImageBitmap' in window) {
    return await createImageBitmap(file)
  }

  return await new Promise<ImageBitmap>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Failed to create canvas context'))
          return
        }
        context.drawImage(image, 0, 0)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'))
            return
          }
          createImageBitmap(blob)
            .then(resolve)
            .catch(reject)
            .finally(() => {
              URL.revokeObjectURL(objectUrl)
            })
        })
      } catch (error) {
        URL.revokeObjectURL(objectUrl)
        reject(error as Error)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }
    image.src = objectUrl
  })
}

export const resizeImageFile = async (file: File, options: ResizeOptions = {}): Promise<Blob> => {
  const { maxWidth = 1280, maxHeight = 720, quality = 0.82, mimeType = 'image/webp' } = options

  const bitmap = await loadImageBitmap(file)

  const ratio = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const targetWidth = Math.round(bitmap.width * ratio)
  const targetHeight = Math.round(bitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Canvas context unavailable')
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (!value) {
          reject(new Error('Falha ao processar a imagem'))
          return
        }
        resolve(value)
      },
      mimeType,
      quality
    )
  })
}
