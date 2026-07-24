/**
 * Shared types and constants used by both API and web.
 * Domain types land here once a feature spec is approved.
 */

export const APP_NAME = "CondoPartners" as const

export type HealthStatus = "ok" | "degraded" | "down"

export type DatabaseHealth = "ok" | "unreachable"

export interface HealthResponse {
  status: HealthStatus
  service: typeof APP_NAME
  timestamp: string
  database: DatabaseHealth
}
