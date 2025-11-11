import { QueryInterface, Sequelize } from "sequelize";

export class TenantContext {
  private static currentTenantId: string | null = null;
  private static currentCompanyId: number | null = null;

  static setContext(tenantId: string, companyId: number) {
    this.currentTenantId = tenantId;
    this.currentCompanyId = companyId;
  }

  static getTenantId(): string | null {
    return this.currentTenantId;
  }

  static getCompanyId(): number | null {
    return this.currentCompanyId;
  }

  static clearContext() {
    this.currentTenantId = null;
    this.currentCompanyId = null;
  }
}

// Database hook to automatically add tenant filtering
export const setupTenantHooks = (sequelize: Sequelize) => {
  // Hook for all SELECT queries
  sequelize.addHook('beforeFind', (options: any) => {
    const companyId = TenantContext.getCompanyId();
    const tenantId = TenantContext.getTenantId();
    
    if (companyId && !options.where?.companyId) {
      options.where = options.where || {};
      options.where.companyId = companyId;
    }
  });

  // Hook for all CREATE queries
  sequelize.addHook('beforeCreate', (instance: any) => {
    const companyId = TenantContext.getCompanyId();
    const tenantId = TenantContext.getTenantId();
    
    if (companyId && !instance.companyId) {
      instance.companyId = companyId;
    }
    
    if (tenantId && !instance.tenantId) {
      instance.tenantId = tenantId;
    }
  });

  // Hook for all UPDATE queries
  sequelize.addHook('beforeUpdate', (instance: any) => {
    const companyId = TenantContext.getCompanyId();
    
    if (companyId && !instance.companyId) {
      instance.companyId = companyId;
    }
  });

  // Hook for all bulk operations
  sequelize.addHook('beforeBulkCreate', (instances: any[], options: any) => {
    const companyId = TenantContext.getCompanyId();
    const tenantId = TenantContext.getTenantId();
    
    instances.forEach(instance => {
      if (companyId && !instance.companyId) {
        instance.companyId = companyId;
      }
      if (tenantId && !instance.tenantId) {
        instance.tenantId = tenantId;
      }
    });
  });

  // Hook for bulk update operations
  sequelize.addHook('beforeBulkUpdate', (options: any) => {
    const companyId = TenantContext.getCompanyId();
    
    if (companyId && !options.where?.companyId) {
      options.where = options.where || {};
      options.where.companyId = companyId;
    }
  });

  // Hook for bulk delete operations
  sequelize.addHook('beforeBulkDestroy', (options: any) => {
    const companyId = TenantContext.getCompanyId();
    
    if (companyId && !options.where?.companyId) {
      options.where = options.where || {};
      options.where.companyId = companyId;
    }
  });
};