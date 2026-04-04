import { db, ref, push } from '../config/firebase'

/**
 * Log an admin action to Firebase
 * @param {string} action - What happened (e.g., 'customer_suspended', 'partner_created')
 * @param {string} targetId - ID of the affected record
 * @param {string} targetName - Readable name (e.g., vehicle number, partner name)
 * @param {object} details - Extra context (optional)
 */
export const logAdminAction = async (action, targetId, targetName, details = {}) => {
  try {
    const admin = JSON.parse(sessionStorage.getItem('rakshak_admin') || '{}')
    await push(ref(db, 'auditLog'), {
      action,
      targetId: targetId || '',
      targetName: targetName || '',
      adminKey: admin.key || '',
      adminName: admin.name || 'Unknown',
      adminRole: admin.role || '',
      details,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Audit log failed:', err)
  }
}

// Action constants
export const ACTIONS = {
  CUSTOMER_SUSPENDED: 'customer_suspended',
  CUSTOMER_REACTIVATED: 'customer_reactivated',
  CUSTOMER_EDITED: 'customer_edited',
  PARTNER_CREATED: 'partner_created',
  PARTNER_DEACTIVATED: 'partner_deactivated',
  PARTNER_ACTIVATED: 'partner_activated',
  PARTNER_COMMISSION_PAID: 'partner_commission_paid',
  ADMIN_CREATED: 'admin_created',
  ADMIN_SUSPENDED: 'admin_suspended',
  ADMIN_REACTIVATED: 'admin_reactivated',
  ADMIN_DELETED: 'admin_deleted',
  ADMIN_ROLE_CHANGED: 'admin_role_changed',
  CONFIG_UPDATED: 'config_updated',
  SUPPORT_REPLY: 'support_reply',
  PASSWORD_RESET: 'password_reset',
  DATA_EXPORTED: 'data_exported',
}
