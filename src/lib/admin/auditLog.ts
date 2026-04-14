/**
 * Audit Logging Client
 * Tracks all admin actions for security and compliance
 */

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'login'
  | 'logout'
  | 'view'
  | 'export'
  | 'import';

export type ResourceType = 
  | 'issue'
  | 'event'
  | 'area'
  | 'state'
  | 'school'
  | 'blog_post'
  | 'page'
  | 'faq'
  | 'partner'
  | 'user'
  | 'menu_item'
  | 'settings';

interface AuditLogParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  changes?: Record<string, any>;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAuditAction({
  action,
  resourceType,
  resourceId,
  changes,
}: AuditLogParams): Promise<void> {
  try {
    await fetch('/api/admin/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        resourceType,
        resourceId,
        changes,
      }),
    });
  } catch (error) {
    // Don't throw - audit logging should not break the app
    console.error('Failed to log audit action:', error);
  }
}

/**
 * Helper functions for common audit actions
 */
export const auditLog = {
  create: (resourceType: ResourceType, resourceId: string, data?: Record<string, any>) =>
    logAuditAction({ action: 'create', resourceType, resourceId, changes: data }),

  update: (resourceType: ResourceType, resourceId: string, changes: Record<string, any>) =>
    logAuditAction({ action: 'update', resourceType, resourceId, changes }),

  delete: (resourceType: ResourceType, resourceId: string) =>
    logAuditAction({ action: 'delete', resourceType, resourceId }),

  publish: (resourceType: ResourceType, resourceId: string) =>
    logAuditAction({ action: 'publish', resourceType, resourceId }),

  unpublish: (resourceType: ResourceType, resourceId: string) =>
    logAuditAction({ action: 'unpublish', resourceType, resourceId }),

  view: (resourceType: ResourceType, resourceId?: string) =>
    logAuditAction({ action: 'view', resourceType, resourceId }),

  export: (resourceType: ResourceType) =>
    logAuditAction({ action: 'export', resourceType }),

  import: (resourceType: ResourceType, count?: number) =>
    logAuditAction({ action: 'import', resourceType, changes: { count } }),
};
