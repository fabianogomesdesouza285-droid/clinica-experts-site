// ============================================
// VigoreFlow - login.js
// Logica da pagina de login/cadastro
// ============================================

const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const formLogin = document.getElementById('formLogin');
const formSignup = document.getElementById('formSignup');

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  formLogin.style.display = 'flex';
  formSignup.style.display = 'none';
});

tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  formSignup.style.display = 'flex';
  formLogin.style.display = 'none';
});

// Se ja estiver logado, vai direto pro dashboard
vfGetSession().then((session) => {
  if (session) window.location.href = 'dashboard.html';
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  errorEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try {
    await vfSignIn(email, password);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorEl.textContent = 'E-mail ou senha invalidos.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const clinica = document.getElementById('signupClinica').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errorEl = document.getElementById('signupError');
  const successEl = document.getElementById('signupSuccess');
  const btn = document.getElementById('signupBtn');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Criando conta...';
  try {
    await vfSignUp(clinica, email, password);
    successEl.style.display = 'block';
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
  } catch (err) {
    errorEl.textContent = err.message || 'Nao foi possivel criar sua conta.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Criar conta gratis';
  }
});
