(function () {
    var nav = document.getElementById('nav');
    var navToggle = document.querySelector('.nav-toggle');
    var navMenu = document.getElementById('navMenu');
    var mobileMenuQuery = window.matchMedia('(max-width: 768px)');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var heroVideo = document.querySelector('.hero-video');
    var heroVideoMobileQuery = window.matchMedia('(max-width: 768px)');
    var reveals = document.querySelectorAll('.reveal');
    var serviceCards = Array.from(document.querySelectorAll('.services .service-card'));
    var serviceStackMobileQuery = window.matchMedia('(max-width: 768px)');
    var serviceStackFallbackQuery = window.matchMedia('(max-width: 768px) and (max-height: 560px)');
    var experienceImage = document.querySelector('.experience-media img');
    var galleryTriggers = Array.from(document.querySelectorAll('.gallery-trigger'));
    var lightbox = document.querySelector('.lightbox');
    var lightboxImage = document.querySelector('.lightbox-image');
    var lightboxCaption = document.querySelector('.lightbox-caption');
    var lightboxClose = document.querySelector('.lightbox-close');
    var lightboxPrevious = document.querySelector('.lightbox-prev');
    var lightboxNext = document.querySelector('.lightbox-next');
    var lightboxStatus = document.querySelector('.lightbox-status');
    var fallbackImages = document.querySelectorAll('[data-placeholder-fallback]');
    var floatingWhatsApp = document.querySelector('.whatsapp-float');
    var siteFooter = document.querySelector('.site-footer');
    var currentImageIndex = 0;
    var lastGalleryTrigger = null;
    var scrollUpdatePending = false;

    serviceCards.forEach(function (card, index) {
        card.style.setProperty('--stack-index', String(index + 1));
    });

    function syncHeroVideo() {
        if (!heroVideo) return;
        if (reducedMotion || heroVideoMobileQuery.matches) {
            heroVideo.pause();
            return;
        }

        var playback = heroVideo.play();
        if (playback && typeof playback.catch === 'function') {
            playback.catch(function () {
                heroVideo.classList.add('video-fallback');
            });
        }
    }

    function configureBookingLinks() {
        document.querySelectorAll('a[href^="https://wa.me/2349069615677"]').forEach(function (link) {
            var service = link.getAttribute('data-booking-service') || '____';
            var message = 'Hello Nirvana De Spa, I would like to book an appointment. My preferred service is ' +
                service + ', and my preferred date/time is ____.';
            link.href = 'https://wa.me/2349069615677?text=' + encodeURIComponent(message);
        });
    }

    function useImagePlaceholder(image) {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = 'true';
        image.removeAttribute('srcset');
        image.removeAttribute('sizes');
        image.src = 'assets/nirvana-photo-placeholder.svg';
        image.alt = 'Nirvana De Spa branded placeholder; client photography is not yet available.';
    }

    fallbackImages.forEach(function (image) {
        image.addEventListener('error', function () {
            useImagePlaceholder(image);
        }, { once: true });

        if (image.complete && image.naturalWidth === 0) {
            useImagePlaceholder(image);
        }
    });

    configureBookingLinks();
    syncHeroVideo();
    if (typeof heroVideoMobileQuery.addEventListener === 'function') {
        heroVideoMobileQuery.addEventListener('change', syncHeroVideo);
    } else {
        heroVideoMobileQuery.addListener(syncHeroVideo);
    }

    function handleScroll() {
        if (nav) {
            nav.classList.toggle('scrolled', window.scrollY > 24);
        }

        updateServiceStack();

        if (!reducedMotion && experienceImage) {
            var bounds = experienceImage.getBoundingClientRect();
            var offset = Math.max(-18, Math.min(18, (window.innerHeight / 2 - bounds.top - bounds.height / 2) * -0.035));
            experienceImage.style.setProperty('--experience-parallax', offset.toFixed(1) + 'px');
        }
    }

    function updateServiceStack() {
        var updates = [];

        if (reducedMotion || serviceStackFallbackQuery.matches) {
            serviceCards.forEach(function (card) {
                card.style.removeProperty('--stack-scale');
            });
            return;
        }

        serviceCards.forEach(function (card, index) {
            if (!serviceCards[index + 1]) return;

            var nextCard = serviceCards[index + 1];
            var cardHeight = card.offsetHeight;
            var stickyTop = parseFloat(window.getComputedStyle(card).top) || 0;
            var nextTop = nextCard.getBoundingClientRect().top;
            var progress = Math.max(0, Math.min(1, (stickyTop + cardHeight - nextTop) / cardHeight));
            var maximumScaleReduction = serviceStackMobileQuery.matches ? 0.035 : 0.055;

            updates.push({
                card: card,
                scale: (1 - progress * maximumScaleReduction).toFixed(3)
            });
        });

        updates.forEach(function (update) {
            var card = update.card;
            card.style.setProperty('--stack-scale', update.scale);
        });
    }

    function scheduleScrollUpdate() {
        if (scrollUpdatePending) return;
        scrollUpdatePending = true;
        window.requestAnimationFrame(function () {
            scrollUpdatePending = false;
            handleScroll();
        });
    }

    function setMenuOpen(isOpen) {
        if (!navToggle || !navMenu) return;
        navMenu.classList.toggle('open', isOpen);
        navMenu.setAttribute('aria-hidden', String(!isOpen && mobileMenuQuery.matches));
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
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
            var isOpen = navToggle.getAttribute('aria-expanded') !== 'true';
            setMenuOpen(isOpen);
            if (isOpen) {
                var firstMenuLink = navMenu.querySelector('a');
                if (firstMenuLink) firstMenuLink.focus();
            }
        });

        navMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (mobileMenuQuery.matches) {
                    setMenuOpen(false);
                    navToggle.focus();
                }
            });
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Tab' && navMenu.classList.contains('open')) {
                var menuFocusables = [navToggle].concat(Array.from(navMenu.querySelectorAll('a[href]')));
                var firstMenuItem = menuFocusables[0];
                var lastMenuItem = menuFocusables[menuFocusables.length - 1];

                if (event.shiftKey && document.activeElement === firstMenuItem) {
                    event.preventDefault();
                    lastMenuItem.focus();
                } else if (!event.shiftKey && document.activeElement === lastMenuItem) {
                    event.preventDefault();
                    firstMenuItem.focus();
                }
            }

            if (event.key === 'Escape' && navMenu.classList.contains('open')) {
                setMenuOpen(false);
                navToggle.focus();
            }
        });

        navMenu.setAttribute('aria-hidden', String(mobileMenuQuery.matches));
        navToggle.setAttribute('aria-label', 'Open navigation menu');
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
        var captionText = caption ? caption.textContent : image.alt;

        lightboxImage.src = image.src;
        delete lightboxImage.dataset.fallbackApplied;
        lightboxImage.alt = image.alt;
        lightboxCaption.textContent = captionText;
        if (lightboxStatus) {
            lightboxStatus.textContent = 'Image ' + (currentImageIndex + 1) + ' of ' + galleryTriggers.length + ': ' + captionText;
        }
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
            var image = trigger.querySelector('img');
            if (image && image.complete && image.naturalWidth === 0) {
                useImagePlaceholder(image);
            }
            updateLightbox(index);
            lightbox.showModal();
            if (lightboxClose) lightboxClose.focus();
        });
    });

    if (lightbox && lightboxClose) {
        if (lightboxImage) {
            lightboxImage.addEventListener('error', function () {
                if (lightboxImage.dataset.fallbackApplied) {
                    closeLightbox();
                    return;
                }
                lightboxImage.dataset.fallbackApplied = 'true';
                lightboxImage.src = 'assets/nirvana-photo-placeholder.svg';
                lightboxImage.alt = 'Nirvana De Spa branded placeholder; client photography is not yet available.';
            });
        }

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

    if (floatingWhatsApp && siteFooter && 'IntersectionObserver' in window) {
        var footerObserver = new IntersectionObserver(function (entries) {
            floatingWhatsApp.classList.toggle('over-footer', entries[0].isIntersecting);
        }, {
            threshold: 0.08
        });
        footerObserver.observe(siteFooter);
    }

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate);
    handleScroll();
})();
