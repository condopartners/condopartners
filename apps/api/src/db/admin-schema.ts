import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Auditoria append-only das ações de super-admin.
 * Aprovada em docs/specs/super-admin-user-mgmt.md.
 * Proibido gravar senha, hash, token de reset ou secret em `metadata`.
 */
export const adminAuditEvent = pgTable("admin_audit_event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(),
  targetUserId: text("target_user_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
})
