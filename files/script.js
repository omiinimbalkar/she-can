/* ── DARK MODE TOGGLE ── */
const toggle = document.getElementById('darkToggle');
const html   = document.documentElement;

// persist preference
if (localStorage.getItem('theme') === 'dark') {
  html.setAttribute('data-theme', 'dark');
  toggle.textContent = '☀️';
}

toggle.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  toggle.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

/* ── SCROLL REVEAL ── */
const revealEls = document.querySelectorAll('.about-inner, .impact-grid, .stat, .section-heading');
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── COUNTER ANIMATION ── */
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const duration = 1800;
  const step = timestamp => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statData = [
  { id: 's1', target: 12000, suffix: '+' },
  { id: 's2', target: 48,    suffix: '' },
  { id: 's3', target: 94,    suffix: '%' },
  { id: 's4', target: 11,    suffix: '' },
];

const counterObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    statData.forEach(({ id, target, suffix }) => {
      const el = document.getElementById(id);
      if (el) animateCounter(el, target, suffix);
    });
    counterObserver.disconnect();
  }
}, { threshold: 0.4 });

const impactSection = document.querySelector('.impact');
if (impactSection) counterObserver.observe(impactSection);

/* ── MODAL ── */
function openModal() {
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
