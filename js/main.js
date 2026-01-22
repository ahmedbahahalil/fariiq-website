/*
 * Fariiq Marketing Website JavaScript
 * Copyright (c) 2026 Fariiq. All rights reserved.
 */

(function() {
  'use strict';

  // ========================================
  // DOM Elements
  // ========================================
  const dom = {
    nav: document.querySelector('.nav'),
    mobileToggle: document.querySelector('.nav__mobile-toggle'),
    mobileMenu: document.querySelector('.nav__mobile-menu'),
    contactForm: document.getElementById('contact-form'),
  };

  // ========================================
  // Navigation
  // ========================================
  function initNavigation() {
    // Scroll effect
    window.addEventListener('scroll', () => {
      if (dom.nav) {
        if (window.scrollY > 50) {
          dom.nav.classList.add('scrolled');
        } else {
          dom.nav.classList.remove('scrolled');
        }
      }
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
      alert(t('form_required'));
      return;
    }

    if (!isValidEmail(email)) {
      alert(t('form_invalid_email'));
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

      alert(t('form_success'));
      form.reset();
    } catch (error) {
      console.error('Contact form error:', error);
      alert(t('form_error'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
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
