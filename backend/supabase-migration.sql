-- Supabase Migration Script for Atendechat Multi-tenant Setup
-- This script creates the necessary tables and RLS policies for multi-tenant architecture

-- 1. Create profiles table to extend auth.users
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    profile TEXT DEFAULT 'user' CHECK (profile IN ('user', 'agent', 'admin', 'super_admin')),
    company_id INTEGER,
    tenant_id TEXT NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create companies table
CREATE TABLE public.companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tenant_id TEXT NOT NULL UNIQUE,
    plan_id INTEGER,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create plans table
CREATE TABLE public.plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2),
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Add foreign key constraint
ALTER TABLE public.companies 
ADD CONSTRAINT fk_companies_plan 
FOREIGN KEY (plan_id) REFERENCES public.plans(id);

ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- 5. Create indexes for performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_companies_tenant_id ON public.companies(tenant_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in same company" ON public.profiles
    FOR SELECT USING (
        company_id = (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage profiles in same company" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND company_id = profiles.company_id
            AND (profile = 'admin' OR profile = 'super_admin' OR 'admin' = ANY(roles))
        )
    );

-- 8. Create RLS Policies for companies
CREATE POLICY "Users can view own company" ON public.companies
    FOR SELECT USING (
        id = (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all companies" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (profile = 'super_admin' OR 'super_admin' = ANY(roles))
        )
    );

-- 9. Create RLS Policies for plans
CREATE POLICY "Users can view plans" ON public.plans
    FOR SELECT USING (true);

CREATE POLICY "Super admins can manage plans" ON public.plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (profile = 'super_admin' OR 'super_admin' = ANY(roles))
        )
    );

-- 10. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, tenant_id, company_id, profile, roles)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'tenant_id', 'default'),
        COALESCE((NEW.raw_user_meta_data->>'company_id')::INTEGER, 1),
        COALESCE(NEW.raw_user_meta_data->>'profile', 'user'),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles')),
            ARRAY['user']
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Create function to sync user metadata updates
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles SET
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', OLD.email),
        profile = COALESCE(NEW.raw_user_meta_data->>'profile', profile),
        company_id = COALESCE((NEW.raw_user_meta_data->>'company_id')::INTEGER, company_id),
        tenant_id = COALESCE(NEW.raw_user_meta_data->>'tenant_id', tenant_id),
        roles = COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles')),
            roles
        ),
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create trigger for user metadata sync
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_metadata();

-- 14. Insert default plan and company
INSERT INTO public.plans (id, name, price, features, limits) VALUES 
(1, 'Free', 0.00, '{"basic_features": true}', '{"users": 5, "whatsapp_connections": 1}'),
(2, 'Pro', 29.99, '{"advanced_features": true}', '{"users": 50, "whatsapp_connections": 5}'),
(3, 'Enterprise', 99.99, '{"enterprise_features": true}', '{"users": -1, "whatsapp_connections": -1}');

INSERT INTO public.companies (id, name, tenant_id, plan_id) VALUES 
(1, 'Default Company', 'default', 1);

-- 15. Create helper functions for getting user context
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT tenant_id FROM public.profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.companies TO anon, authenticated;
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;