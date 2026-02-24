# Guia de Configuração: Sincronização em Nuvem (Supabase)

Para habilitar o acesso por vários dispositivos e a segurança avançada, siga estes passos:

## 1. Criar Projeto no Supabase
1.  Acesse [supabase.com](https://supabase.com/) e crie uma conta gratuita.
2.  Crie um novo projeto chamado `Daily Diary`.
3.  Anote as suas chaves em **Project Settings > API**:
    - `Project URL`
    - `anon public` (Public Key)

## 2. Configurar o Banco de Dados (SQL)
No painel do Supabase, vá em **SQL Editor** e cole este código. Ele cria as tabelas e as **Políticas de Segurança (RLS)** para que o site tenha permissão de ler e escrever:

```sql
-- 1. TABELA DE PERFIS
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  two_factor_enabled boolean default false
);

alter table profiles enable row level security;
create policy "Usuários podem ver o próprio perfil" on profiles for select using (auth.uid() = id);
create policy "Usuários podem atualizar o próprio perfil" on profiles for update using (auth.uid() = id);
create policy "Usuários podem inserir o próprio perfil" on profiles for insert with check (auth.uid() = id);

-- 2. TABELA DE CONFIGURAÇÕES
create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  font text,
  wallpaper text,
  unique (user_id)
);

alter table settings enable row level security;
create policy "Usuários gerenciam suas configurações" on settings for all using (auth.uid() = user_id);

-- 3. TABELA DE ENTRADAS (DIÁRIO)
create table entries (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  title text default '',
  content text,
  images jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table entries enable row level security;
create policy "Usuários gerenciam suas próprias entradas" on entries for all using (auth.uid() = user_id);
```

## 3. Configuração CRÍTICA de Autenticação
Por padrão, o Supabase exige que o usuário clique em um link no e-mail para ativar a conta. Para facilitar seu teste agora:
1.  Vá em **Authentication** > **Providers**.
2.  Clique em **Email**.
3.  **DESATIVE** a opção **"Confirm email"**.
4.  Clique em **Save**.

---

### Solução de Problemas (Troubleshooting)
- **"Invalid Login"**: Verifique se você desativou o "Confirm email" ou se clicou no link enviado.
- **"Email Invalido"**: Verifique se digitou o e-mail corretamente no formato `nome@exemplo.com`.
- **"Email rate limit exceeded"**: O Supabase limita quantos e-mails de teste você pode enviar por hora. Para resolver:
    1. Vá em **Authentication** > **Settings**.
    2. Procure a seção **Rate Limits**.
    3. Aumente o valor de **"Max Confirmations per hour"** ou use um e-mail diferente para testar.

---

### O que mudou no uso?
- **Sincronização**: Ao salvar no PC, o texto aparecerá no Celular (e vice-versa).
- **Segurança**: Dentro de **Configurações**, você agora pode ativar o **2FA** e clicar em **"Sair de todos os dispositivos"**.
- **Primeiro Acesso**: Como os dados são novos na nuvem, recomendo criar uma conta nova. Seus textos antigos (locais) ainda estarão salvos no navegador original.
