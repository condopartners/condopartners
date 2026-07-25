import { db } from "../../db"
import { adminAuditEvent } from "../../db/schema"

type AuditInput = {
  actorUserId: string
  action:
    | "user.create"
    | "user.update"
    | "user.set_password"
    | "user.invalidate_password"
    | "user.send_password_reset"
    | "user.revoke_sessions"
  targetUserId?: string
  /** Nunca incluir senha, hash, token de reset ou secret (spec). */
  metadata?: Record<string, unknown>
}

export async function recordAuditEvent(input: AuditInput): Promise<void> {
  await db.insert(adminAuditEvent).values({
    actorUserId: input.actorUserId,
    action: input.action,
    targetUserId: input.targetUserId ?? null,
    metadata: input.metadata ?? null,
  })
}
