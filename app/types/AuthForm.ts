export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm extends LoginForm {
  username: string
  firstName: string
  lastName: string
  bio?: string | null
  avatarUrl?: string | null
}
