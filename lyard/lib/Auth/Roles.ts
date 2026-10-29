// lib/Auth/roles.ts
// One place that gathers every role definition so permission checks can look them up.
//
// NOTE: adjust these import paths if your role files live somewhere else.
import { ADMIN_ROLE } from '@/app/User/Admin/Adminstartor';
import { WHOLESALE_ROLE } from '@/app/User/WholesSale/Wholesales';
import { CUSTOMER_ROLE } from '@/app/User/Customer';
import { GUEST_ROLE } from '@/app/User/guest';
import { USER_ROLE } from '@/app/User/user';

import type { Permission, RoleDefinition } from './Permission';
import type { Role } from './store';

export const ROLES: Record<Role, RoleDefinition> = {
  guest: GUEST_ROLE,
  user: USER_ROLE,
  customer: CUSTOMER_ROLE,
  wholesale: WHOLESALE_ROLE,
  admin: ADMIN_ROLE,
};

export const getRoleDefinition = (role: Role | null | undefined): RoleDefinition =>
  ROLES[role ?? 'guest'] ?? GUEST_ROLE;

export const roleCan = (role: Role | null | undefined, permission: Permission): boolean =>
  getRoleDefinition(role).permissions.includes(permission);