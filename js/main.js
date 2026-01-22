/*
 * Fariiq Marketing Website JavaScript
 * Copyright (c) 2026 Fariiq. All rights reserved.
 */

(function() {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const CONFIG = {
    // Update this to your actual API URL
    apiBaseUrl: '/api/v1',
    // Flutter app URL
    appUrl: 'https://app.fariiq.com',
  };

  // ========================================
  // DOM Elements
  // ========================================
  const dom = {
    nav: document.querySelector('.nav'),
    mobileToggle: document.querySelector('.nav__mobile-toggle'),
    mobileMenu: document.querySelector('.nav__mobile-menu'),
    loginBtn: document.querySelector('[data-action="login"]'),
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    loginAlert: document.querySelector('.modal__alert'),
    modalClose: document.querySelector('.modal__close'),
    contactForm: document.getElementById('contact-form'),
  };

  // ========================================
  // Navigation
  // ========================================
  function initNavigation() {
    // Scroll effect
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      if (dom.nav) {
        if (window.scrollY > 50) {
          dom.nav.classList.add('scrolled');
        } else {
          dom.nav.classList.remove('scrolled');
        }
      }
      lastScrollY = window.scrollY;
    }, { passive: true });

    // Mobile menu toggle
    if (dom.mobileToggle && dom.mobileMenu) {
      dom.mobileToggle.addEventListener('click', () => {
        dom.mobileToggle.classList.toggle('active');
        dom.mobileMenu.classList.toggle('active');
        document.body.style.overflow = dom.mobileMenu.classList.contains('active') ? 'hidden' : '';
      });

      // Close mobile menu when clicking a link
      dom.mobileMenu.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
          dom.mobileToggle.classList.remove('active');
          dom.mobileMenu.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ========================================
  // Login Modal
  // ========================================
  function initLoginModal() {
    if (!dom.loginBtn || !dom.loginModal) return;

    // Open modal
    dom.loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    // Close modal
    if (dom.modalClose) {
      dom.modalClose.addEventListener('click', closeModal);
    }

    // Close on overlay click
    dom.loginModal.addEventListener('click', (e) => {
      if (e.target === dom.loginModal) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.loginModal.classList.contains('active')) {
        closeModal();
      }
    });

    // Handle form submission
    if (dom.loginForm) {
      dom.loginForm.addEventListener('submit', handleLogin);
    }
  }

  function openModal() {
    dom.loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input
    const firstInput = dom.loginForm.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  function closeModal() {
    dom.loginModal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form and alerts
    if (dom.loginForm) {
      dom.loginForm.reset();
    }
    hideAlert();
  }

  async function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;

    // Basic validation
    if (!email || !password) {
      showAlert('Please enter both email and password.', 'error');
      return;
    }

    // Email format validation
    if (!isValidEmail(email)) {
      showAlert('Please enter a valid email address.', 'error');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span> Logging in...';
    hideAlert();

    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Login successful! Redirecting...', 'success');

        // Store token if provided
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }

        // Redirect to app after a short delay
        setTimeout(() => {
          window.location.href = CONFIG.appUrl;
        }, 1000);
      } else {
        showAlert(data.message || 'Invalid email or password.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Unable to connect to the server. Please try again later.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  function showAlert(message, type) {
    if (!dom.loginAlert) return;

    dom.loginAlert.textContent = message;
    dom.loginAlert.className = 'modal__alert';
    dom.loginAlert.classList.add(`modal__alert--${type}`);
  }

  function hideAlert() {
    if (dom.loginAlert) {
      dom.loginAlert.className = 'modal__alert';
      dom.loginAlert.textContent = '';
    }
  }

  // ========================================
  // Contact Form
  // ========================================
  function initContactForm() {
    if (!dom.contactForm) return;

    dom.contactForm.addEventListener('submit', handleContactSubmit);
  }

  async function handleContactSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const message = formData.get('message').trim();

    // Validation
    if (!name || !email || !message) {
      alert(getTranslation('formRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      alert(getTranslation('invalidEmail'));
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    try {
      // For now, just simulate a submission
      // Replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert(getTranslation('messageSent'));
      form.reset();
    } catch (error) {
      console.error('Contact form error:', error);
      alert(getTranslation('messageError'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  // ========================================
  // Translations
  // ========================================
  const translations = {
    en: {
      formRequired: 'Please fill in all required fields.',
      invalidEmail: 'Please enter a valid email address.',
      messageSent: 'Thank you! Your message has been sent. We\'ll get back to you soon.',
      messageError: 'Sorry, there was an error sending your message. Please try again.',
    },
    ar: {
      formRequired: 'يرجى ملء جميع الحقول المطلوبة.',
      invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صالح.',
      messageSent: 'شكراً لك! تم إرسال رسالتك. سنتواصل معك قريباً.',
      messageError: 'عذراً، حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.',
    }
  };

  function getTranslation(key) {
    const lang = document.documentElement.lang || 'en';
    return translations[lang]?.[key] || translations.en[key] || key;
  }

  // ========================================
  // Utilities
  // ========================================
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ========================================
  // Intersection Observer for Animations
  // ========================================
  function initAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements that should animate on scroll
    document.querySelectorAll('.feature-card, .pricing-card, .about__stat').forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  // ========================================
  // Initialize
  // ========================================
  function init() {
    initNavigation();
    initLoginModal();
    initContactForm();
    initAnimations();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
