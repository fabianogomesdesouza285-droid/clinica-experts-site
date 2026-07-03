// ============================================
// CLÍNICA EXPERTS – APP.JS
// Integração Supabase + Funcionalidades
// ============================================

// CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = 'https://mttcmlzltpwdxentkajy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dGNtbHpsdHB3ZHhlbnRrYWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzE1ODMsImV4cCI6MjA5ODY0NzU4M30.-VPSSOjIl4CYiCeksMuJD0qn5siJbURDy_go0VTqe84';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// NAVBAR – SCROLL EFFECT
// ============================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ============================================
// HAMBURGER MENU – MOBILE
// ============================================
const hamburger = document.getElementById('hamburger');
hamburger?.addEventListener('click', () => {
  const navLinks = document.querySelector('.nav-links');
  const navCta = document.querySelector('.nav-cta');
  navLinks?.classList.toggle('mobile-open');
  navCta?.classList.toggle('mobile-open');
});

// ============================================
// PRICING TOGGLE – MENSAL / ANUAL
// ============================================
const monthlyPrices = { basic: '199,90', essential: '299,00', advanced: '479,00' };
const annualPrices = { basic: '149,90', essential: '249,00', advanced: '399,00' };

function setPricing(mode) {
  const btnMonthly = document.getElementById('btn-monthly');
  const btnAnnual = document.getElementById('btn-annual');
  const hint = document.getElementById('toggle-hint');
  btnMonthly?.classList.toggle('active', mode === 'monthly');
  btnAnnual?.classList.toggle('active', mode === 'annual');
  const prices = mode === 'annual' ? annualPrices : monthlyPrices;
  ['basic', 'essential', 'advanced'].forEach(plan => {
    const priceEl = document.getElementById(plan + '-price');
    const periodEl = document.getElementById(plan + '-period');
    const annualEl = document.getElementById(plan + '-annual');
    if (priceEl) priceEl.textContent = prices[plan];
    if (periodEl) periodEl.style.display = mode === 'annual' ? 'none' : 'block';
    if (annualEl) annualEl.style.display = mode === 'annual' ? 'block' : 'none';
  });
  const labelEl = document.getElementById('basic-label');
  if (labelEl) labelEl.textContent = mode === 'annual' ? '12x de' : 'A partir de';
  if (hint) hint.textContent = mode === 'annual' ? 'Opte pelos planos anuais e pague menos.' : '';
}

setPricing('annual');

// ============================================
// FORMULÁRIO DE LEADS – SUPABASE
// ============================================
const leadForm = document.getElementById('leadForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccessEl = document.getElementById('formSuccess');
const formErrorEl = document.getElementById('formError');

leadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome')?.value.trim();
  const whatsapp = document.getElementById('whatsapp')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const clinica = document.getElementById('clinica')?.value.trim();
  const plano = document.getElementById('plano')?.value;
  if (!nome || !whatsapp || !email) return;
  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled = true;
  if (formSuccessEl) formSuccessEl.style.display = 'none';
  if (formErrorEl) formErrorEl.style.display = 'none';
  try {
    const { error } = await sb.from('leads').insert([{
      nome, whatsapp, email,
      clinica: clinica || null,
      plano_interesse: plano || null,
      created_at: new Date().toISOString()
    }]);
    if (error) throw error;
    if (formSuccessEl) formSuccessEl.style.display = 'block';
    leadForm.reset();
  } catch (err) {
    console.error('Erro Supabase:', err);
    if (formErrorEl) formErrorEl.style.display = 'block';
  } finally {
    submitBtn.textContent = 'Quero um especialista →';
    submitBtn.disabled = false;
  }
});

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================
// ANIMAÇÕES DE SCROLL (IntersectionObserver)
// ============================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ============================================
// MÁSCARA DE WHATSAPP
// ============================================
const whatsappInput = document.getElementById('whatsapp');
whatsappInput?.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length === 11) v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  else if (v.length >= 7) v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, '($1) $2-$3');
  else if (v.length >= 3) v = v.replace(/^(\d{2})(\d+)$/, '($1) $2');
  e.target.value = v;
});// ============================================
// CLÍNICA EXPERTS – APP.JS
// Integração Supabase + Funcionalidades
// ============================================

// CONFIGURAÇÃO SUPABASE – substitua com suas credenciais
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// NAVBAR – SCROLL EFFECT
// ============================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ============================================
// HAMBURGER MENU – MOBILE
// ============================================
const hamburger = document.getElementById('hamburger');
hamburger?.addEventListener('click', () => {
  const navLinks = document.querySelector('.nav-links');
  const navCta = document.querySelector('.nav-cta');
  navLinks?.classList.toggle('mobile-open');
  navCta?.classList.toggle('mobile-open');
});

// ============================================
// PRICING TOGGLE – MENSAL / ANUAL
// ============================================
const monthlyPrices = { basic: '199,90', essential: '299,00', advanced: '479,00' };
const annualPrices  = { basic: '149,90', essential: '249,00', advanced: '399,00' };

function setPricing(mode) {
  const btnMonthly = document.getElementById('btn-monthly');
  const btnAnnual  = document.getElementById('btn-annual');
  const hint       = document.getElementById('toggle-hint');

  btnMonthly?.classList.toggle('active', mode === 'monthly');
  btnAnnual?.classList.toggle('active', mode === 'annual');

  const prices = mode === 'annual' ? annualPrices : monthlyPrices;

  ['basic', 'essential', 'advanced'].forEach(plan => {
    const priceEl  = document.getElementById(plan + '-price');
    const periodEl = document.getElementById(plan + '-period');
    const annualEl = document.getElementById(plan + '-annual');
    if (priceEl) priceEl.textContent = prices[plan];
    if (periodEl) periodEl.style.display = mode === 'annual' ? 'none' : 'block';
    if (annualEl) annualEl.style.display = mode === 'annual' ? 'block' : 'none';
  });

  const labelEl = document.getElementById('basic-label');
  if (labelEl) labelEl.textContent = mode === 'annual' ? '12x de' : 'A partir de';

  if (hint) hint.textContent = mode === 'annual' ? 'Opte pelos planos anuais e pague menos.' : '';
}

// Inicializar com anual ativo
setPricing('annual');

// ============================================
// FORMULÁRIO DE LEADS – SUPABASE
// ============================================
const leadForm  = document.getElementById('leadForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccessEl = document.getElementById('formSuccess');
const formErrorEl   = document.getElementById('formError');

leadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome     = document.getElementById('nome')?.value.trim();
  const whatsapp = document.getElementById('whatsapp')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const clinica  = document.getElementById('clinica')?.value.trim();
  const plano    = document.getElementById('plano')?.value;

  if (!nome || !whatsapp || !email) return;

  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled = true;
  if (formSuccessEl) formSuccessEl.style.display = 'none';
  if (formErrorEl)   formErrorEl.style.display   = 'none';

  try {
    const { error } = await sb.from('leads').insert([{
      nome,
      whatsapp,
      email,
      clinica: clinica || null,
      plano_interesse: plano || null,
      created_at: new Date().toISOString()
    }]);

    if (error) throw error;

    if (formSuccessEl) formSuccessEl.style.display = 'block';
    leadForm.reset();

  } catch (err) {
    console.error('Erro Supabase:', err);
    if (formErrorEl) formErrorEl.style.display = 'block';
  } finally {
    submitBtn.textContent = 'Quero um especialista →';
    submitBtn.disabled = false;
  }
});

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================
// ANIMAÇÕES DE SCROLL (IntersectionObserver)
// ============================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ============================================
// MÁSCARA DE WHATSAPP
// ============================================
const whatsappInput = document.getElementById('whatsapp');
whatsappInput?.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length === 11) v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  else if (v.length >= 7) v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, '($1) $2-$3');
  else if (v.length >= 3) v = v.replace(/^(\d{2})(\d+)$/, '($1) $2');
  e.target.value = v;
});
