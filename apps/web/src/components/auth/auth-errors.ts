/** Alinhado ao default Better Auth `minPasswordLength`. */
export const MIN_PASSWORD_LENGTH = 8

export type FieldErrors = {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export type MappedAuthError = {
  fieldErrors: FieldErrors
  formError: string | null
}

const SIGN_UP_GENERIC = "Não foi possível criar a conta. Verifique os dados e tente de novo."

export function mapSignUpError(input: {
  code?: string | null
  message?: string | null
  maxLength?: number
}): MappedAuthError {
  const code = (input.code ?? "").toUpperCase()
  const message = (input.message ?? "").toLowerCase()

  if (code === "PASSWORD_TOO_SHORT" || message.includes("password is too short")) {
    return {
      fieldErrors: {
        password: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      },
      formError: null,
    }
  }

  if (code === "PASSWORD_TOO_LONG" || message.includes("password is too long")) {
    const max = input.maxLength ?? 128
    return {
      fieldErrors: {
        password: `A senha é longa demais. Use no máximo ${max} caracteres.`,
      },
      formError: null,
    }
  }

  if (code === "INVALID_PASSWORD" || message.includes("invalid password")) {
    return {
      fieldErrors: {
        password: "Esta senha não atende aos requisitos. Escolha outra.",
      },
      formError: null,
    }
  }

  if (code === "INVALID_EMAIL" || message.includes("invalid email")) {
    return {
      fieldErrors: { email: "Informe um e-mail válido." },
      formError: null,
    }
  }

  if (
    code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
    code === "USER_ALREADY_EXISTS" ||
    message.includes("already exists")
  ) {
    return {
      fieldErrors: {},
      formError: "Este e-mail já está em uso. Entre ou use outro e-mail.",
    }
  }

  return { fieldErrors: {}, formError: SIGN_UP_GENERIC }
}

export function mapResetPasswordError(input: {
  code?: string | null
  message?: string | null
}): MappedAuthError {
  const code = (input.code ?? "").toUpperCase()
  const message = (input.message ?? "").toLowerCase()

  if (code === "PASSWORD_TOO_SHORT" || message.includes("password is too short")) {
    return {
      fieldErrors: {
        password: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      },
      formError: null,
    }
  }

  if (code === "PASSWORD_TOO_LONG" || message.includes("password is too long")) {
    return {
      fieldErrors: {
        password: "A senha é longa demais. Use no máximo 128 caracteres.",
      },
      formError: null,
    }
  }

  if (code === "TOKEN_EXPIRED" || message.includes("expired")) {
    return {
      fieldErrors: {},
      formError: "Este link expirou. Solicite um novo e-mail para redefinir a senha.",
    }
  }

  if (code === "INVALID_TOKEN" || message.includes("invalid token")) {
    return {
      fieldErrors: {},
      formError: "Este link é inválido. Solicite um novo e-mail para redefinir a senha.",
    }
  }

  return {
    fieldErrors: {},
    formError: "Não foi possível redefinir a senha. Tente de novo.",
  }
}

export function mapSignInError(input: { code?: string | null; message?: string | null }): string {
  const code = (input.code ?? "").toUpperCase()
  const haystack = `${code} ${input.message ?? ""}`.toLowerCase()

  if (haystack.includes("email_not_verified") || haystack.includes("email not verified")) {
    return "Conta ainda não ativada. Verifique seu e-mail ou reenvie o link."
  }

  if (code === "INVALID_EMAIL_OR_PASSWORD" || haystack.includes("invalid email or password")) {
    return "E-mail ou senha incorretos."
  }

  return "Não foi possível autenticar. Verifique os dados e tente de novo."
}
