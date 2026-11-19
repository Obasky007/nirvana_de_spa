(function () {
    var nav = document.getElementById('nav');
    var navToggle = document.querySelector('.nav-toggle');
    var navMenu = document.getElementById('navMenu');
    var mobileMenuQuery = window.matchMedia('(max-width: 768px)');
    var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reducedMotion = reducedMotionQuery.matches;
    var ambientVideos = Array.from(document.querySelectorAll('[data-ambient-video]'));
    var reveals = document.querySelectorAll('.reveal');
    var serviceCards = Array.from(document.querySelectorAll('.services .service-card'));
    var serviceStackMobileQuery = window.matchMedia('(max-width: 768px)');
    var experienceImage = document.querySelector('.experience-media video');
    var fallbackImages = document.querySelectorAll('[data-placeholder-fallback]');
    var floatingWhatsApp = document.querySelector('.whatsapp-float');
    var siteFooter = document.querySelector('.site-footer');
    var scrollUpdatePending = false;

    serviceCards.forEach(function (card, index) {
        card.style.setProperty('--stack-index', String(index + 1));
    });

    function syncAmbientVideo(video) {
        var bounds = video.getBoundingClientRect();
        var isVisible = bounds.bottom > 0 && bounds.top < window.innerHeight
            && bounds.right > 0 && bounds.left < window.innerWidth;
        if (reducedMotion || document.hidden || !isVisible) {
            video.pause();
            return;
        }

        var playback = video.play();
        if (playback && typeof playback.catch === 'function') {
            playback.catch(function (error) {
                if (!error || error.name !== 'AbortError') {
                    console.warn('Unable to play Nirvana De Spa video.', error);
                }
            });
        }
    }

    var ambientVideoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                syncAmbientVideo(entry.target);
            } else {
                entry.target.pause();
            }
        });
    }) : null;

    ambientVideos.forEach(function (video) {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.addEventListener('error', function () {
            console.error('Unable to load Nirvana De Spa video:', video.currentSrc || video.src);
        });
        if (ambientVideoObserver) {
            ambientVideoObserver.observe(video);
        } else {
            syncAmbientVideo(video);
        }
    });

    document.addEventListener('visibilitychange', function () {
        ambientVideos.forEach(function (video) {
            if (document.hidden) {
                video.pause();
            } else {
                syncAmbientVideo(video);
            }
        });
    });
    if (typeof reducedMotionQuery.addEventListener === 'function') {
        reducedMotionQuery.addEventListener('change', function (event) {
            reducedMotion = event.matches;
            ambientVideos.forEach(syncAmbientVideo);
        });
    } else {
        reducedMotionQuery.addListener(function (event) {
            reducedMotion = event.matches;
            ambientVideos.forEach(syncAmbientVideo);
        });
    }

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

    function handleScroll() {
        if (nav) {
            nav.classList.toggle('scrolled', window.scrollY > 24);
        }

        if (!ambientVideoObserver) {
            ambientVideos.forEach(syncAmbientVideo);
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
