import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export type UserRole = 'superadmin' | 'admin' | 'viewer';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 3,
  admin: 2,
  viewer: 1
};

/**
 * requireRole middleware factory.
 * Enforces that the authenticated user has a role equal to or higher than the required minRole.
 * Also verifies that the user is a human, since agents bypass this and are bound by agent permissions.
 * Wait, agents might hit system endpoints?
 * Actually, the roadmap says: "viewer can only access the Table Editor data view in read-only mode. Enforce these roles in the backend middleware chain by checking (req as any).userSession.role after authentication and before routing to any systemApi handler."
 */
export function requireRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    // We allow agent keys to bypass RBAC if they have 'full' or specific system permissions?
    // In CaraBase, agent keys usually target the /rest API or have specific system powers if defined.
    // For now, let's enforce role on humans. If it's an agent, they use 'agentPermissions'.
    // If the requirement is strictly for humans hitting the dashboard:
    if (authReq.keyType === 'agent') {
       // Allow agents to bypass human UI roles if their agent level is full
       if (authReq.agentPermissions?.level === 'full') {
         next();
         return;
       }
       // Otherwise reject agent keys on role-protected endpoints unless explicitly authorized elsewhere
       res.status(403).json({ success: false, error: `Forbidden: Agent key cannot satisfy human role requirement '${minRole}'` });
       return;
    }

    const userRole = authReq.role || 'viewer';
    console.log("REQUIRE_ROLE DEBUG:", { minRole, userRole, keyType: authReq.keyType, userUuid: authReq.userUuid });

    if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Forbidden: Requires '${minRole}' role (you are '${userRole}')`
      });
    }
  };
}
