export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return re.test(password)
}

export function isValidPhone(phone: string): boolean {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '')

  // Aceita 10 ou 11 dígitos (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
  return cleaned.length === 10 || cleaned.length === 11
}

export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 6) return 'weak'

  let strength = 0

  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++

  if (strength <= 2) return 'weak'
  if (strength <= 3) return 'medium'
  return 'strong'
}
