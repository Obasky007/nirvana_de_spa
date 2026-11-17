(function () {
    var nav = document.getElementById('nav');
    var navToggle = document.querySelector('.nav-toggle');
    var navMenu = document.getElementById('navMenu');
    var mobileMenuQuery = window.matchMedia('(max-width: 768px)');
    var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reducedMotion = reducedMotionQuery.matches;
    var hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    var heroVideo = document.querySelector('.hero-video');
    var galleryVideo = document.querySelector('.gallery-video');
    var heroHovered = false;
    var galleryHovered = false;
    var reveals = document.querySelectorAll('.reveal');
    var serviceCards = Array.from(document.querySelectorAll('.services .service-card'));
    var serviceStackMobileQuery = window.matchMedia('(max-width: 768px)');
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

    function playVideoOnHover(video) {
        if (!video || reducedMotionQuery.matches || !hoverQuery.matches) return;
        if (video === heroVideo) video.classList.remove('video-fallback');
        var playback = video.play();
        if (playback && typeof playback.catch === 'function') {
            playback.catch(function (error) {
                var stillHovered = video === heroVideo ? heroHovered : galleryHovered;
                if (!stillHovered && error && error.name === 'AbortError') return;
                if (video === heroVideo) video.classList.add('video-fallback');
                console.warn('Unable to play video on hover.', error);
            });
        }
    }

    function syncHeroVideo() {
        if (!heroVideo) return;
        if (!heroHovered || reducedMotionQuery.matches || !hoverQuery.matches || serviceStackMobileQuery.matches) {
            heroVideo.pause();
            return;
        }
        playVideoOnHover(heroVideo);
    }

    function syncGalleryVideo() {
        if (!galleryVideo) return;
        if (!galleryHovered || reducedMotionQuery.matches || !hoverQuery.matches) {
            galleryVideo.pause();
            return;
        }
        playVideoOnHover(galleryVideo);
    }

    function syncVideos() {
        syncHeroVideo();
        syncGalleryVideo();
    }

    if (heroVideo) {
        var hero = document.querySelector('.hero');
        heroVideo.addEventListener('playing', function () {
            heroVideo.classList.remove('video-fallback');
        });
        heroVideo.addEventListener('error', function () {
            heroVideo.classList.add('video-fallback');
        });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                heroVideo.pause();
                if (galleryVideo) galleryVideo.pause();
            } else {
                syncVideos();
            }
        });
        if (hero) {
            hero.addEventListener('pointerenter', function (event) {
                if (event.pointerType === 'touch' || !hoverQuery.matches) return;
                heroHovered = true;
                syncHeroVideo();
            });
            hero.addEventListener('pointerleave', function () {
                heroHovered = false;
                heroVideo.pause();
            });
        }
        if (typeof serviceStackMobileQuery.addEventListener === 'function') {
            serviceStackMobileQuery.addEventListener('change', syncHeroVideo);
        } else {
            serviceStackMobileQuery.addListener(syncHeroVideo);
        }
    }

    if (galleryVideo) {
        galleryVideo.addEventListener('pointerenter', function (event) {
            if (event.pointerType === 'touch' || !hoverQuery.matches) return;
            galleryHovered = true;
            syncGalleryVideo();
        });
        galleryVideo.addEventListener('pointerleave', function () {
            galleryHovered = false;
            galleryVideo.pause();
        });
    }

    function addMediaChangeListener(query, listener) {
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', listener);
        } else {
            query.addListener(listener);
        }
    }
    addMediaChangeListener(hoverQuery, syncVideos);
    addMediaChangeListener(reducedMotionQuery, syncVideos);

    function initializeBookingWizard() {
        var wizard = document.querySelector('[data-booking-wizard]');
        if (!wizard) return;

        var form = wizard.querySelector('[data-booking-form]');
        var steps = Array.from(wizard.querySelectorAll('[data-booking-step]'));
        var stepCount = steps.length;
        var currentStep = 0;
        var stepCountLabel = wizard.querySelector('[data-booking-count]');
        var progress = wizard.querySelector('[data-booking-progress]');
        var progressFill = progress ? progress.querySelector('span') : null;
        var backButton = wizard.querySelector('[data-booking-back]');
        var skipButton = wizard.querySelector('[data-booking-skip]');
        var nextButton = wizard.querySelector('[data-booking-next]');
        var submitButton = wizard.querySelector('[data-booking-submit]');
        var dateInput = wizard.querySelector('input[type="date"]');

        if (!form || !stepCount) return;

        if (dateInput) {
            var today = new Date();
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            dateInput.min = today.toISOString().slice(0, 10);
        }

        function showStep(focusHeading) {
            steps.forEach(function (step, index) {
                step.hidden = index !== currentStep;
            });

            var currentStepLabel = 'Step ' + (currentStep + 1) + ' of ' + stepCount;
            if (stepCountLabel) stepCountLabel.textContent = currentStepLabel;
            if (progress) {
                progress.setAttribute('aria-valuenow', String(currentStep + 1));
                progress.setAttribute('aria-valuetext', currentStepLabel);
            }
            if (progressFill) {
                progressFill.style.width = ((currentStep + 1) / stepCount * 100) + '%';
            }

            if (backButton) backButton.hidden = currentStep === 0;
            if (skipButton) skipButton.hidden = currentStep === stepCount - 1;
            if (nextButton) nextButton.hidden = currentStep === stepCount - 1;
            if (submitButton) submitButton.hidden = currentStep !== stepCount - 1;

            if (focusHeading) {
                var heading = steps[currentStep].querySelector('h3');
                if (heading) heading.focus();
            }
        }

        function moveForward(clearCurrentStep) {
            if (clearCurrentStep) {
                steps[currentStep].querySelectorAll('input, select, textarea').forEach(function (field) {
                    field.value = '';
                });
            }
            if (currentStep < stepCount - 1) {
                currentStep += 1;
                showStep(true);
            }
        }

        function goNext() {
            var field = steps[currentStep].querySelector('input, select, textarea');
            if (field && !field.checkValidity()) {
                field.reportValidity();
                return;
            }
            moveForward(false);
        }

        function formatTime(value) {
            var parts = value.split(':');
            if (parts.length !== 2) return value;
            var hour = Number(parts[0]);
            var minute = parts[1];
            var suffix = hour >= 12 ? 'PM' : 'AM';
            return (hour % 12 || 12) + ':' + minute + ' ' + suffix;
        }

        var serviceField = form.querySelector('select[name="service"]');
        document.querySelectorAll('a[href="#booking"]').forEach(function (link) {
            link.addEventListener('click', function () {
                var service = link.getAttribute('data-booking-service');
                if (serviceField && service && service !== '____') {
                    serviceField.value = service;
                }
                currentStep = 0;
                showStep(false);
            });
        });

        if (backButton) {
            backButton.addEventListener('click', function () {
                if (currentStep > 0) {
                    currentStep -= 1;
                    showStep(true);
                }
            });
        }

        if (skipButton) {
            skipButton.addEventListener('click', function () {
                moveForward(true);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', goNext);
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (currentStep < stepCount - 1) {
                goNext();
                return;
            }

            var values = new FormData(form);
            var service = String(values.get('service') || '').trim();
            var date = String(values.get('date') || '').trim();
            var time = String(values.get('time') || '').trim();
            var name = String(values.get('name') || '').trim();
            var note = String(values.get('note') || '').trim();
            var message = [
                'Hello Nirvana De Spa, I would like to request an appointment.',
                '',
                'Service: ' + (service || 'Not sure yet')
            ];

            if (date) message.push('Preferred date: ' + date);
            if (time) message.push('Preferred time: ' + formatTime(time));
            if (name) message.push('Name: ' + name);
            if (note) message.push('Note: ' + note);
            message.push('', 'Please let me know your availability and current pricing.');

            window.location.href = 'https://wa.me/2349069615677?text=' + encodeURIComponent(message.join('\n'));
        });

        showStep(false);
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

    initializeBookingWizard();
    syncHeroVideo();

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

        if (reducedMotion) {
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
            var maximumScaleReduction = serviceStackMobileQuery.matches ? 0.06 : 0.055;

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
