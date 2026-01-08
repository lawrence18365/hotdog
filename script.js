// Always scroll to top on page load/refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// Preloader
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const counter = document.getElementById('counter');
  let count = 0;
  
  const interval = setInterval(() => {
    count += Math.random() * 15 + 5; // Random increment between 5-20
    if (count >= 100) {
      count = 100;
      clearInterval(interval);
      
      // Show logo and fade out after brief delay
      setTimeout(() => {
        preloader.classList.add('fade-out');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 500);
      }, 800);
    }
    counter.textContent = Math.floor(count);
  }, 120); // Update every 120ms for quick animation
});

// Mobile nav toggle - REMOVED

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Simple open hours indicator (approximate)
// Assumes typical day 11:00–19:00 local time; adjust as needed.
(function hoursIndicator() {
  try {
    const el = document.getElementById('open-status');
    const rows = document.querySelectorAll('.hours-table tbody tr');
    if (!el) return;
    const now = new Date();
    const day = now.getDay(); // 0 Sun – 6 Sat
    const hour = now.getHours();
    // Rough schedule: Mon–Sat 11–19, Sun 11–18 (if closed Sundays, this will say closed)
    const openHour = 11;
    const closeHour = (day === 0) ? 18 : 19;
    const isOpen = hour >= openHour && hour < closeHour && day !== 0; // default: closed Sundays
    const closeLabel = (closeHour % 12 || 12) + ':00 ' + (closeHour >= 12 ? 'PM' : 'AM');
    el.textContent = isOpen ? `Open now • Closes at ${closeLabel}` : 'Closed right now';
    el.classList.add(isOpen ? 'open' : 'closed');
    // highlight today
    if (rows && rows.length) {
      const idx = (day === 0) ? 6 : day - 1; // rows start Mon
      if (rows[idx]) rows[idx].classList.add('today');
    }
  } catch {}
})();

// Rewards form with phone formatting and validation
(function rewardsForm() {
  const form = document.getElementById('rewards-form');
  if (!form) return;
  
  const mobile = document.getElementById('mobile');
  const errorMsg = document.getElementById('error-msg');
  const btnText = form.querySelector('.btn-text');
  const btnSpinner = form.querySelector('.btn-spinner');
  const submitBtn = form.querySelector('button[type="submit"]');
  const successState = document.getElementById('success-state');
  
  let rateLimitTime = 0;
  
  // Format phone number as user types
  mobile.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      if (value.length >= 6) {
        value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`;
      } else if (value.length >= 3) {
        value = `(${value.slice(0,3)}) ${value.slice(3)}`;
      }
      e.target.value = value;
    }
    
    // Clear errors when user starts typing
    if (errorMsg.textContent) {
      errorMsg.textContent = '';
      mobile.classList.remove('error');
    }
  });
  
  // Validate phone number
  function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && digits[0] !== '0' && digits[0] !== '1';
  }
  
  // Show error
  function showError(message) {
    errorMsg.textContent = message;
    mobile.classList.add('error');
    mobile.focus();
  }
  
  // Show loading state
  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (loading) {
      btnText.style.display = 'none';
      btnSpinner.style.display = 'block';
    } else {
      btnText.style.display = 'block';
      btnSpinner.style.display = 'none';
    }
  }
  
  // Show success state
  function showSuccess() {
    form.style.display = 'none';
    successState.style.display = 'block';
    
    // Handle "Open Messages" button
    document.getElementById('open-messages').addEventListener('click', () => {
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        window.open('sms:', '_self');
      } else if (navigator.userAgent.includes('Android')) {
        window.open('sms:', '_self');
      } else {
        window.open('sms:', '_self');
      }
    });
    
    // Handle "Add to Wallet" button
    document.getElementById('add-wallet').addEventListener('click', () => {
      // This would integrate with Apple Wallet/Google Pay passes
      alert('Wallet integration would be implemented here');
    });
  }
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check rate limiting
    if (Date.now() < rateLimitTime) {
      const minutes = Math.ceil((rateLimitTime - Date.now()) / 60000);
      showError(`Too many attempts. Try again in ${minutes} minutes.`);
      return;
    }
    
    const phoneValue = mobile.value.trim();
    
    if (!phoneValue) {
      showError('Enter a valid mobile number.');
      return;
    }
    
    if (!validatePhone(phoneValue)) {
      showError('Enter a valid mobile number.');
      return;
    }
    
    const e164Phone = '+1' + phoneValue.replace(/\D/g, '');
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock different responses
      const random = Math.random();
      if (random < 0.1) {
        // Already enrolled
        setLoading(false);
        const retryMsg = document.createElement('button');
        retryMsg.textContent = 'Send me the link again';
        retryMsg.className = 'btn btn-ghost';
        retryMsg.style.marginTop = '8px';
        retryMsg.onclick = () => {
          showError('');
          retryMsg.remove();
          form.dispatchEvent(new Event('submit'));
        };
        showError('This number is already enrolled.');
        errorMsg.appendChild(retryMsg);
      } else if (random < 0.15) {
        // Rate limit
        rateLimitTime = Date.now() + 10 * 60 * 1000; // 10 minutes
        setLoading(false);
        showError('Too many attempts. Try again in 10 minutes.');
      } else {
        // Success
        setLoading(false);
        
        // Store enrollment data
        try {
          localStorage.setItem('ff-rewards-phone', e164Phone);
          localStorage.setItem('ff-rewards-enrolled', Date.now());
        } catch {}
        
        // Fire analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'rewards_submit_success', {
            'custom_parameter': 'rewards_form'
          });
        }
        
        showSuccess();
      }
    } catch (error) {
      setLoading(false);
      showError('Something went wrong. Please try again.');
      
      // Fire analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'rewards_error_type', {
          'error_type': 'api_failure'
        });
      }
    }
  });
  
  // Fire view analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'rewards_viewed', {
      'custom_parameter': 'rewards_form'
    });
  }
})();

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // set active state for menu subnav
      if (a.closest('.menu-subnav')) {
        document.querySelectorAll('.menu-subnav a').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
      }
    }
  });
});

// Reviews carousel (auto + dots)
(function reviewsCarousel(){
  const c = document.querySelector('.carousel');
  if (!c) return;
  const slides = c.querySelector('.slides');
  const items = Array.from(c.querySelectorAll('.slide'));
  const dots = c.querySelector('.dots');
  const prev = c.querySelector('.car-btn.prev');
  const nextBtn = c.querySelector('.car-btn.next');
  let index = 0, timer;
  function renderDots(){
    dots.innerHTML = '';
    items.forEach((_, i)=>{
      const b = document.createElement('button');
      if (i===0) b.classList.add('active');
      b.addEventListener('click', ()=>go(i));
      dots.appendChild(b);
    });
  }
  function go(i){
    index = (i+items.length)%items.length;
    slides.scrollTo({left: slides.clientWidth*index, behavior: 'smooth'});
    dots.querySelectorAll('button').forEach((d,di)=>d.classList.toggle('active', di===index));
    restart();
  }
  function next(){ go(index+1); }
  function prevFn(){ go(index-1); }
  function restart(){ clearInterval(timer); if (c.dataset.autoplay === 'true') timer = setInterval(next, 5000); }
  renderDots();
  restart();
  window.addEventListener('resize', ()=>go(index));
  if (prev) prev.addEventListener('click', prevFn);
  if (nextBtn) nextBtn.addEventListener('click', next);
})();

// Intersection reveals
(function reveals(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting) e.target.classList.add('in');
    });
  }, { threshold: 0.1 });
  
  // Select specific existing components AND any manually tagged .reveal elements
  const targets = document.querySelectorAll('.card, .about, .reviews, .gallery, .location, .faq, .loyalty, .highlights .card, .reveal');
  
  targets.forEach(el=>{
    el.classList.add('reveal'); // Ensure class exists (idempotent)
    obs.observe(el);
  });
})();

// FAQ: one open at a time (flat accordion)
(function faqOneOpen(){
  const list = document.querySelector('.faq-list');
  if (!list) return;
  list.addEventListener('toggle', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLDetailsElement)) return;
    if (t.open) {
      list.querySelectorAll('details[open]').forEach(d => { if (d !== t) d.removeAttribute('open'); });
    }
  }, true);
})();

// Mobile sticky order bar (appears after 300px scroll; always on for very short viewports)
(function mobileOrderBar(){
  const bar = document.querySelector('.mobile-order-bar');
  if (!bar) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function inView(el){
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }
  function shouldShow(){
    if (window.innerWidth > 768) return false; // mobile only
    if (window.scrollY < 300) return false;
    // hide if hero or closing CTA primary is visible, or footer is visible
    const heroCta = document.querySelector('.hero .btn-primary');
    const band = document.querySelector('.cta-band');
    const footer = document.querySelector('.site-footer');
    if (inView(heroCta) || inView(band) || inView(footer)) return false;
    // avoid on order domains/pages
    const href = String(location.href).toLowerCase();
    if (href.includes('/order') || href.includes('/checkout')) return false;
    return true;
  }
  function update(){ bar.classList.toggle('show', shouldShow()); }
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();

// Footer "Open today" helper based on hours table
(function footerOpenToday(){
  const el = document.getElementById('foot-open');
  const rows = document.querySelectorAll('.hours-table tbody tr');
  if (!el || !rows.length) return;
  try {
    const now = new Date();
    const day = now.getDay(); // 0 Sun – 6 Sat
    const openHour = 11, closeHour = (day === 0) ? 19 : 19; // default: 11–19, Sun closed
    const isSunday = day === 0;
    if (isSunday) { el.textContent = 'Open today: Closed'; return; }
    const closeLabel = (closeHour % 12 || 12) + ':00 PM';
    el.textContent = `Open today: 11:00 AM–${closeLabel}`;
  } catch {}
})();

// Floating buttons
(function floaters(){
  const topBtn = document.querySelector('.back-to-top');
  if (!topBtn) return;
  window.addEventListener('scroll', ()=>{
    topBtn.classList.toggle('show', window.scrollY > 400);
  });
  topBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
})();

// MENU PAGE: live search filter
(function menuSearch(){
  const search = document.getElementById('menu-search');
  if (!search) return;
  const items = Array.from(document.querySelectorAll('.menu-list li'));
  search.addEventListener('input', ()=>{
    const q = search.value.trim().toLowerCase();
    items.forEach(li=>{
      const text = li.textContent.toLowerCase();
      li.style.display = text.includes(q) ? '' : 'none';
    });
  });
})();
