declare namespace Express {
  export interface Request {
    user: {
      id: string;
      email: string;
      profile: string;
      companyId: number;
      tenantId: string;
      roles: string[];
      supabaseUser?: any;
    };
    tenantId?: string;
    companyId?: number;
    plan?: {
      id: number;
      name: string;
      price: number;
      limits: {
        users: number;
        whatsapp_instances: number;
        flows: number;
        webhooks: number;
        history_days: number;
        conversations: number;
        ai_requests_included: number;
        support_sla: string;
      };
      overage: {
        conversation_price: number;
        ai_request_price: number | null;
      };
    };
    usageCounters?: {
      [key: string]: number;
    };
  }
}
