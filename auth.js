// ============================================
// VigoreFlow - auth.js
// Cliente Supabase + funcoes de autenticacao
// Usado por login.html e dashboard.html
// ============================================

const SUPABASE_URL = 'https://mttcmlzltpwdxentkajy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dGNtbHpsdHB3ZHhlbnRrYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzE1ODMsImV4cCI6MjA5ODY0NzU4M30.-VPSSOjIl4CYiCeksMuJD0qn5siJbURDy_go0VTqe84';

const { createClient } = supabase;
const sbAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cria conta nova (nome da clinica + email + senha)
async function vfSignUp(nomeClinica, email, password) {
  const { data, error } = await sbAuth.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) {
    await sbAuth.from('perfis').insert([{ id: data.user.id, nome_clinica: nomeClinica }]);
  }
  return data;
}

// Login
async function vfSignIn(email, password) {
  const { data, error } = await sbAuth.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Logout
async function vfSignOut() {
  await sbAuth.auth.signOut();
  window.location.href = 'login.html';
}

// Retorna sessao atual (ou null)
async function vfGetSession() {
  const { data } = await sbAuth.auth.getSession();
  return data.session;
}

// Protege uma pagina: redireciona para login se nao autenticado
async function vfRequireAuth() {
  const session = await vfGetSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
