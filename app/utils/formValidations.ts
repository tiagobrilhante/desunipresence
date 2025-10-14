export const validateEmail = (email: string) => {
  const trimmedEmail = email.trim()
  if (!trimmedEmail) return []

  const errors = []

  const emailRegex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/
  const isValidEmailFormat = emailRegex.test(trimmedEmail)

  if (!isValidEmailFormat) errors.push('Formato de email inválido')

  return errors
}

export const validatePassword = (password: string) => {
  if (!password) return []

  const errors = []

  if (password.length <= 5) errors.push('A senha deve ter ao menos 6 caracteres')

  /*if (!password.includes('@'))
    errors.push('Password must include special characters')*/

  return errors
}

export const validateRequiredField = (value: string, fieldLabel: string) => {
  if (value.trim()) return []
  return [`${fieldLabel} é obrigatório`]
}

export const validateUsername = (username: string) => {
  const trimmed = username.trim()
  if (!trimmed) return ['Nome de usuário é obrigatório']
  const errors: string[] = []
  if (trimmed.length < 3) {
    errors.push('Nome de usuário deve ter ao menos 3 caracteres')
  }
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/
  if (!usernameRegex.test(trimmed)) {
    errors.push('Use apenas letras, números ou _. -')
  }
  return errors
}

export const validateConfirmPassword = (password: string, confirmPassword: string) => {
  const errors: string[] = []
  if (!confirmPassword.trim()) {
    errors.push('Confirme sua senha')
    return errors
  }

  if (password !== confirmPassword) {
    errors.push('As senhas não coincidem')
  }

  return errors
}
