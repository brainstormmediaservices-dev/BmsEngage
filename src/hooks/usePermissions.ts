import { useAuth } from '../contexts/AuthContext';
import { checkPermission, ROLE_GROUPS, UserRole } from '../services/authService';

/**
 * Resolves the effective roles to use for permission checks.
 *
 * - Personal context  → user's own roles
 * - Agency context    → agencyRole from TeamInvite (set by owner at invite time)
 *                       'owner' maps to all executive roles (can do everything)
 */
const getEffectiveRoles = (user: ReturnType<typeof useAuth>['user']): UserRole[] => {
  if (!user) return [];

  if (user.activeContext === 'agency' && user.agencyRole) {
    // Agency owner can do everything — map to all executive roles
    if (user.agencyRole === 'owner') {
      return ROLE_GROUPS.executive as UserRole[];
    }
    // Member uses their assigned agencyRole
    return [user.agencyRole as UserRole];
  }

  // Personal context — use own roles
  return (user.roles ?? []) as UserRole[];
};

export const usePermissions = () => {
  const { user } = useAuth();
  const effectiveRoles = getEffectiveRoles(user);

  const can = (permission: string): boolean => checkPermission(effectiveRoles, permission);

  return {
    can,
    canUploadAsset:       can('upload_asset'),
    canViewAsset:         can('view_asset'),
    canComment:           can('comment'),
    canRequestCorrection: can('request_correction'),
    canApproveAsset:      can('approve_asset'),
    canUploadVersion:     can('upload_version'),
    canDeleteAsset:       can('delete_asset'),
    effectiveRoles,
    userId: user?.id,
  };
};
