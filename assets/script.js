(() => {
  // Mobile nav toggle
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const opened = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(opened));
      menu.textContent = opened ? '✕' : '☰';
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
        menu.textContent = '☰';
      });
    });
  }

  // Scroll reveal
  const revealItems = document.querySelectorAll('.reveal, .stagger > *');
  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    if (item.parentElement && item.parentElement.classList.contains('stagger')) {
      item.style.setProperty('--delay', `${Math.min(index * 80, 420)}ms`);
    }
  });

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  // Typing animation
  document.querySelectorAll('[data-typing]').forEach(el => {
    const phrase = el.getAttribute('data-typing') || '';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = phrase;
      return;
    }
    el.textContent = '';
    let i = 0;
    const type = () => {
      if (i < phrase.length) {
        el.textContent += phrase.charAt(i++);
        window.setTimeout(type, 34);
      }
    };
    window.setTimeout(type, 350);
  });

  // Active nav & copyright year
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  // Live SOC Clock in top telemetry bar
  const clockEl = document.getElementById('soc-clock');
  if (clockEl) {
    const updateClock = () => {
      const now = new Date();
      clockEl.textContent = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    };
    updateClock();
    window.setInterval(updateClock, 1000);
  }

  // Interactive Triage Feed Filter on SOC Dashboard (index.html)
  const triageBtns = document.querySelectorAll('[data-triage-filter]');
  if (triageBtns.length > 0) {
    triageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sev = btn.getAttribute('data-triage-filter') || 'all';
        triageBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('[data-triage-row]').forEach(row => {
          const rowSev = row.getAttribute('data-triage-row') || '';
          row.classList.toggle('is-hidden', sev !== 'all' && rowSev !== sev);
        });
      });
    });
  }

  // Domain filter buttons (skills.html & projects.html)
  const filterButtons = document.querySelectorAll('[data-filter-btn]');
  if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter-btn') || 'all';
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('[data-category]').forEach(item => {
          const categories = (item.getAttribute('data-category') || '').split(',').map(s => s.trim());
          item.classList.toggle('is-hidden', filter !== 'all' && !categories.includes(filter));
        });
      });
    });
  }

  // Clipboard copy buttons
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy');
      const directText = btn.getAttribute('data-copy-text');
      let textToCopy = directText || '';
      if (!textToCopy && targetId) {
        const el = document.getElementById(targetId);
        if (el) textToCopy = el.textContent || '';
      }
      if (!textToCopy) return;
      try {
        await navigator.clipboard.writeText(textToCopy.trim());
        const prev = btn.textContent;
        btn.textContent = 'Copied ✓';
        window.setTimeout(() => { btn.textContent = prev; }, 1600);
      } catch (_) {
        btn.textContent = 'Copy failed';
      }
    });
  });

  // Contact form handler
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const submitButton = document.getElementById('contact-submit');
    const status = document.getElementById('contact-status');
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const formData = new FormData(contactForm);
      if (String(formData.get('_honey') || '').trim()) return;

      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
      status.style.display = 'block';
      status.textContent = 'Sending your message securely…';

      const payload = {
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        message: String(formData.get('message') || '').trim()
      };

      let emailSent = false;
      let smsSent = false;
      try {
        const emailResponse = await fetch('https://formsubmit.co/ajax/deep.patel.cyber.21@gmail.com', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (emailResponse.ok) {
          const result = await emailResponse.json().catch(() => ({}));
          emailSent = result.success === 'true' || result.success === true || emailResponse.ok;
        }
      } catch (_) { emailSent = false; }

      try {
        const smsResponse = await fetch('/.netlify/functions/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (smsResponse.ok) {
          const result = await smsResponse.json().catch(() => ({}));
          smsSent = result.sent === true;
        }
      } catch (_) { smsSent = false; }

      if (emailSent && smsSent) {
        status.textContent = 'Message sent! Email and SMS notifications were delivered.';
        status.style.borderLeftColor = 'var(--green)';
        contactForm.reset();
      } else if (emailSent) {
        status.textContent = 'Your message was emailed successfully. SMS alerts are not configured yet or could not be sent.';
        status.style.borderLeftColor = 'var(--green)';
        contactForm.reset();
      } else if (smsSent) {
        status.textContent = 'Your SMS notification was sent, but the email could not be confirmed. Please try again later.';
      } else {
        status.textContent = 'Sorry, the message could not be sent. Please try again or contact me through LinkedIn.';
      }
      submitButton.disabled = false;
      submitButton.textContent = 'Send message ↗';
    });
  }
})();
