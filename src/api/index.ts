// Stub exports to prevent import errors while migrating to Supabase
export const setBaseUrl = () => {}
export const setAuthTokenGetter = () => {}

export type AuthTokenGetter = () => string | Promise<string>

// Re-export schemas if they exist
try {
  export * from "./generated/api.schemas"
} catch (e) {
  // Schemas don't exist yet
}

export {}
