import { UserRole } from '../types';

export interface Permissions {
  canManageUsers: boolean;
  canEditProducts: boolean;
  canCreateSales: boolean;
  canReceiveGoods: boolean;
  canManageService: boolean;
  canPerformOpname: boolean;
  canManageDemo: boolean;
  canViewReports: boolean;
  canAccessSettings: boolean;
}

export function getPermissions(role: UserRole | undefined): Permissions {
  switch (role) {
    case 'owner':
    case 'admin':
      return {
        canManageUsers: true,
        canEditProducts: true,
        canCreateSales: true,
        canReceiveGoods: true,
        canManageService: true,
        canPerformOpname: true,
        canManageDemo: true,
        canViewReports: true,
        canAccessSettings: true,
      };

    case 'sales':
      return {
        canManageUsers: false,
        canEditProducts: false,
        canCreateSales: true,
        canReceiveGoods: false,
        canManageService: false,
        canPerformOpname: false,
        canManageDemo: true,
        canViewReports: true,
        canAccessSettings: false,
      };

    case 'technician':
      return {
        canManageUsers: false,
        canEditProducts: false,
        canCreateSales: false,
        canReceiveGoods: false,
        canManageService: true,
        canPerformOpname: false,
        canManageDemo: false,
        canViewReports: true,
        canAccessSettings: false,
      };

    case 'operator':
    case 'staff':
      return {
        canManageUsers: false,
        canEditProducts: true,
        canCreateSales: false,
        canReceiveGoods: true,
        canManageService: false,
        canPerformOpname: true,
        canManageDemo: true,
        canViewReports: true,
        canAccessSettings: false,
      };

    case 'system':
      return {
        canManageUsers: true,
        canEditProducts: true,
        canCreateSales: true,
        canReceiveGoods: true,
        canManageService: true,
        canPerformOpname: true,
        canManageDemo: true,
        canViewReports: true,
        canAccessSettings: true,
      };

    default:
      return {
        canManageUsers: false,
        canEditProducts: false,
        canCreateSales: false,
        canReceiveGoods: false,
        canManageService: false,
        canPerformOpname: false,
        canManageDemo: false,
        canViewReports: false,
        canAccessSettings: false,
      };
  }
}
