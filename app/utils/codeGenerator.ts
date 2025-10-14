/**
 * Gera códigos aleatórios seguros para grupos ou outras entidades
 */

interface GenerateCodeOptions {
  length?: number
  includeTimestamp?: boolean
  prefix?: string
  charset?: 'alphanumeric' | 'uppercase' | 'numbers' | 'custom'
  customChars?: string
}

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const ALPHANUMERIC_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const UPPERCASE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS_CHARSET = '0123456789'

/**
 * Gera um código aleatório baseado nos parâmetros especificados
 * 
 * @param options - Opções de configuração
 * @param options.length - Comprimento do código (padrão: 8)
 * @param options.includeTimestamp - Se deve incluir timestamp unix (padrão: false)
 * @param options.prefix - Prefixo opcional para o código
 * @param options.charset - Conjunto de caracteres a usar (padrão: 'uppercase')
 * @param options.customChars - Caracteres personalizados (usado com charset 'custom')
 * @returns Código gerado
 * 
 * @example
 * // Código simples de 8 caracteres
 * generateCode() // "A7B9C2D4"
 * 
 * @example
 * // Código com 6 caracteres incluindo timestamp
 * generateCode({ length: 6, includeTimestamp: true }) // "A7B9-1734123456"
 * 
 * @example
 * // Código com prefixo personalizado
 * generateCode({ length: 4, prefix: 'GRP' }) // "GRP-A7B9"
 */
export function generateCode(options: GenerateCodeOptions = {}): string {
  const {
    length = 8,
    includeTimestamp = false,
    prefix = '',
    charset = 'uppercase',
    customChars = ''
  } = options

  // Define o conjunto de caracteres
  let chars: string
  switch (charset) {
    case 'alphanumeric':
      chars = ALPHANUMERIC_CHARSET
      break
    case 'uppercase':
      chars = UPPERCASE_CHARSET
      break
    case 'numbers':
      chars = NUMBERS_CHARSET
      break
    case 'custom':
      chars = customChars || DEFAULT_CHARSET
      break
    default:
      chars = DEFAULT_CHARSET
  }

  // Gera a parte aleatória
  let randomPart = ''
  for (let i = 0; i < length; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Constrói o código final
  let code = ''
  
  if (prefix) {
    code += prefix + '-'
  }
  
  code += randomPart
  
  if (includeTimestamp) {
    const timestamp = Math.floor(Date.now() / 1000) // Unix timestamp em segundos
    code += '-' + timestamp.toString()
  }

  return code
}

/**
 * Gera um código específico para grupos com configurações otimizadas
 * 
 * @param options - Opções de configuração (usa defaults otimizados para grupos)
 * @returns Código do grupo
 * 
 * @example
 * generateGroupCode() // "AB7C9D2E"
 * generateGroupCode({ includeTimestamp: true }) // "AB7C9D2E-1734123456"
 */
export function generateGroupCode(options: Omit<GenerateCodeOptions, 'charset' | 'prefix'> = {}): string {
  return generateCode({
    length: 8,
    charset: 'uppercase',
    ...options
  })
}

/**
 * Gera um código curto baseado principalmente em timestamp
 * Útil quando você quer códigos mais previsíveis temporalmente
 * 
 * @param extraLength - Caracteres aleatórios extras além do timestamp (padrão: 2)
 * @returns Código baseado em timestamp
 * 
 * @example
 * generateTimestampCode() // "1734123456AB"
 * generateTimestampCode(4) // "1734123456ABCD"
 */
export function generateTimestampCode(extraLength: number = 2): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const randomSuffix = generateCode({ length: extraLength, charset: 'uppercase' })
  return `${timestamp}${randomSuffix}`
}