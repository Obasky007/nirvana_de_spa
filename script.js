(function () {
    var nav = document.getElementById('nav');
    var navToggle = document.querySelector('.nav-toggle');
    var navMenu = document.getElementById('navMenu');
    var mobileMenuQuery = window.matchMedia('(max-width: 768px)');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reveals = document.querySelectorAll('.reveal');
    var experienceImage = document.querySelector('.experience-media img');
    var galleryTriggers = Array.from(document.querySelectorAll('.gallery-trigger'));
    var lightbox = document.querySelector('.lightbox');
    var lightboxImage = document.querySelector('.lightbox-image');
    var lightboxCaption = document.querySelector('.lightbox-caption');
    var lightboxClose = document.querySelector('.lightbox-close');
    var lightboxPrevious = document.querySelector('.lightbox-prev');
    var lightboxNext = document.querySelector('.lightbox-next');
    var currentImageIndex = 0;
    var lastGalleryTrigger = null;

    function handleScroll() {
        if (nav) {
            nav.classList.toggle('scrolled', window.scrollY > 24);
        }

        if (!reducedMotion && experienceImage) {
            var bounds = experienceImage.getBoundingClientRect();
            var offset = Math.max(-18, Math.min(18, (window.innerHeight / 2 - bounds.top - bounds.height / 2) * -0.035));
            experienceImage.style.setProperty('--experience-parallax', offset.toFixed(1) + 'px');
        }
    }

    function setMenuOpen(isOpen) {
        if (!navToggle || !navMenu) return;
        navMenu.classList.toggle('open', isOpen);
        navMenu.setAttribute('aria-hidden', String(!isOpen && mobileMenuQuery.matches));
        navToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('menu-open', isOpen);
    }

    function syncMenuViewport() {
        if (!navToggle || !navMenu) return;
        if (!mobileMenuQuery.matches) {
            setMenuOpen(false);
        } else if (navToggle.getAttribute('aria-expanded') !== 'true') {
            navMenu.setAttribute('aria-hidden', 'true');
        }
    }

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            setMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true');
        });

        navMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                setMenuOpen(false);
            });
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && navMenu.classList.contains('open')) {
                setMenuOpen(false);
                navToggle.focus();
            }
        });

        navMenu.setAttribute('aria-hidden', String(mobileMenuQuery.matches));
        window.addEventListener('resize', syncMenuViewport);
        if (typeof mobileMenuQuery.addEventListener === 'function') {
            mobileMenuQuery.addEventListener('change', syncMenuViewport);
        } else {
            mobileMenuQuery.addListener(syncMenuViewport);
        }
    }

    if ('IntersectionObserver' in window && !reducedMotion) {
        var observer = new IntersectionObserver(function (entries, activeObserver) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    activeObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        reveals.forEach(function (element) {
            observer.observe(element);
        });
    } else {
        reveals.forEach(function (element) {
            element.classList.add('active');
        });
    }

    function updateLightbox(index) {
        if (!galleryTriggers.length || !lightboxImage || !lightboxCaption) return;
        currentImageIndex = (index + galleryTriggers.length) % galleryTriggers.length;
        var trigger = galleryTriggers[currentImageIndex];
        var image = trigger.querySelector('img');
        var caption = trigger.closest('figure').querySelector('figcaption');

        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        lightboxCaption.textContent = caption ? caption.textContent : image.alt;
    }

    function restoreGalleryFocus() {
        if (lastGalleryTrigger) lastGalleryTrigger.focus();
        if (lightboxImage) lightboxImage.removeAttribute('src');
    }

    function closeLightbox() {
        if (!lightbox || !lightbox.open) return;
        lightbox.close();
        restoreGalleryFocus();
    }

    galleryTriggers.forEach(function (trigger, index) {
        trigger.addEventListener('click', function () {
            if (!lightbox || typeof lightbox.showModal !== 'function') return;
            lastGalleryTrigger = trigger;
            updateLightbox(index);
            lightbox.showModal();
            if (lightboxClose) lightboxClose.focus();
        });
    });

    if (lightbox && lightboxClose) {
        lightboxClose.addEventListener('click', function () {
            closeLightbox();
        });

        if (lightboxPrevious) {
            lightboxPrevious.addEventListener('click', function () {
                updateLightbox(currentImageIndex - 1);
            });
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', function () {
                updateLightbox(currentImageIndex + 1);
            });
        }

        lightbox.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeLightbox();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                updateLightbox(currentImageIndex - 1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                updateLightbox(currentImageIndex + 1);
            }
        });

        lightbox.addEventListener('cancel', function (event) {
            event.preventDefault();
            closeLightbox();
        });

        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox) closeLightbox();
        });

        lightbox.addEventListener('close', restoreGalleryFocus);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
})();
