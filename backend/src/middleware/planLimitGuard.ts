import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

// Interfaces para os models
interface Company {
  id: number;
  planId: number;
}

interface Plan {
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
}

interface UsageCounter {
  id?: string;
  company_id: number;
  key: string;
  value: number;
  period_start: Date;
}

// Estender a interface Request para incluir propriedades necessárias
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      companyId?: number;
      plan?: Plan;
      usageCounters?: { [key: string]: number };
    }
  }
}

export const planLimitGuard = (limitKey: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.companyId || (req.tenantId ? parseInt(req.tenantId) : null);

      if (!companyId) {
        res.status(400).json({ error: "Missing company_id or tenant_id" });
        return;
      }

      // Imports dos models
      const { default: Company } = await import('../models/Company');
      const { default: Plan } = await import('../models/Plan');
      const { default: UsageCounter } = await import('../models/UsageCounter');

      // Obter company e plan
      const company = await Company.findByPk(companyId) as Company | null;
      if (!company) {
        res.status(404).json({ error: "Company not found" });
        return;
      }

      const plan = await Plan.findByPk(company.planId) as Plan | null;
      if (!plan) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }

      // Verificar se é IA e plan é Starter
      if (limitKey === 'ai_requests_included' && plan.name === 'Starter') {
        res.status(403).json({ 
          error: "AI not available on this plan", 
          upgrade_required: true 
        });
        return;
      }

      // Verificar se o limite existe no plano
      const limit = plan.limits[limitKey as keyof typeof plan.limits];
      if (typeof limit !== 'number') {
        res.status(400).json({ error: "Invalid limit key" });
        return;
      }

      // Data de início do período atual (início do dia)
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Consultar usage_counters para o company, chave e período atual
      let usageCounter = await UsageCounter.findOne({
        where: {
          company_id: companyId,
          key: limitKey,
          period_start: currentDate
        }
      }) as UsageCounter | null;

      // Se não existe contador para hoje, criar um novo
      if (!usageCounter) {
        usageCounter = await UsageCounter.create({
          company_id: companyId,
          key: limitKey,
          value: 0,
          period_start: currentDate
        }) as UsageCounter;
      }

      const currentUsage = usageCounter.value;
      
      // Verificar se excedeu limite
      if (currentUsage >= limit) {
        // Verificar se tem overage disponível
        const overagePrice = plan.overage[`${limitKey.replace('_included', '')}_price` as keyof typeof plan.overage];
        
        if (overagePrice === null || overagePrice === undefined) {
          // Sem overage disponível - bloquear
          res.status(403).json({ 
            error: "Plan limit exceeded", 
            upgrade_required: true 
          });
          return;
        }
        
        // Com overage - permitir e registrar cobrança
        // TODO: Implementar lógica de cobrança/billing aqui
        console.log(`Overage usage for ${limitKey}: ${overagePrice} per unit for company ${companyId}`);
      }

      // Incrementar o contador
      await UsageCounter.update(
        { value: currentUsage + 1 },
        {
          where: {
            company_id: companyId,
            key: limitKey,
            period_start: currentDate
          }
        }
      );

      // Adicionar informações ao request para uso posterior
      req.plan = plan;
      req.companyId = companyId;
      if (!req.usageCounters) req.usageCounters = {};
      req.usageCounters[limitKey] = currentUsage + 1;

      next();
    } catch (error) {
      console.error('Plan limit guard error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};