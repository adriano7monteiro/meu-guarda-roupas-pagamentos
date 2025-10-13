// Mobile Menu Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Animate hamburger icon
        const spans = navToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translateY(8px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header shadow on scroll
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate elements on scroll
const animateOnScroll = document.querySelectorAll('.feature-card, .step, .pricing-card, .testimonial-card');
animateOnScroll.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Update current year in footer
const currentYear = new Date().getFullYear();
const footerYear = document.querySelector('.footer-bottom p');
if (footerYear) {
    footerYear.textContent = `© ${currentYear} Meu Look IA. Todos os direitos reservados.`;
}

// Pricing card click handlers
const pricingButtons = document.querySelectorAll('.pricing-card .btn');
pricingButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const planName = button.closest('.pricing-card').querySelector('.pricing-plan').textContent;
        alert(`Você selecionou o plano: ${planName}\n\nEm breve você será redirecionado para o app!`);
        // TODO: Redirect to app signup with plan parameter
        // window.location.href = 'https://seu-app.com/signup?plan=' + planName.toLowerCase();
    });
});

// CTA button click handler
const ctaButtons = document.querySelectorAll('.hero-cta .btn-primary, .cta .btn-primary');
ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // If it's not an anchor to pricing, handle the click
        if (!button.getAttribute('href').includes('#pricing')) {
            e.preventDefault();
            alert('Redirecionando para o app...\n\nEm breve você estará criando seus looks com IA!');
            // TODO: Redirect to app
            // window.location.href = 'https://seu-app.com/signup';
        }
    });
});

// Stats counter animation
const stats = document.querySelectorAll('.stat-number');
const animateStats = () => {
    stats.forEach(stat => {
        const target = stat.textContent;
        const isNumber = !isNaN(target.replace(/[K+★]/g, ''));
        
        if (isNumber) {
            const number = parseInt(target.replace(/[K+★]/g, ''));
            const suffix = target.includes('K') ? 'K+' : target.includes('★') ? '★' : '';
            let current = 0;
            const increment = number / 50;
            
            const updateCounter = () => {
                current += increment;
                if (current < number) {
                    stat.textContent = Math.floor(current) + suffix;
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = number + suffix;
                }
            };
            
            updateCounter();
        }
    });
};

// Trigger stats animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

console.log('🚀 Meu Look IA - Landing Page carregada com sucesso!');