// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Add scroll effect to header
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all feature cards, pricing cards, and steps
    document.querySelectorAll('.feature-card, .pricing-card, .step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // Handle CTA button clicks
    const ctaButtons = document.querySelectorAll('.btn-cta');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // You can add tracking or redirect logic here
            console.log('CTA button clicked:', this.textContent);
        });
    });

    // Add click tracking for pricing buttons
    const pricingButtons = document.querySelectorAll('.btn-pricing');
    pricingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const plan = this.closest('.pricing-card').querySelector('h3').textContent;
            console.log('Pricing button clicked for plan:', plan);
        });
    });
});