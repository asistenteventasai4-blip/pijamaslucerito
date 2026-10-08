/* ==========================================================================
   Pijamas Lucerito · comportamiento de la landing
   - Atribución (?ws= y UTMs) que viaja al catálogo y a WhatsApp
   - Consentimiento de cookies antes de cargar analítica y píxel
   - Medición de clics a catálogo y WhatsApp
   - Efectos de temporada (luces, nieve), parallax, redes y año del footer
   ========================================================================== */
(function () {
    'use strict';

    var CONFIG = window.SITE_CONFIG || {};
    var TRACKING = CONFIG.tracking || {};

    // localStorage / sessionStorage pueden fallar (modo privado, bloqueos)
    function storageGet(store, key) {
        try { return window[store].getItem(key); } catch (e) { return null; }
    }
    function storageSet(store, key, value) {
        try { window[store].setItem(key, value); } catch (e) { /* sin almacenamiento */ }
    }

    /* ------------------------------------------------------------------
       ATRIBUCIÓN
       Se guarda en sessionStorage para no perderla al navegar por anclas.
       ------------------------------------------------------------------ */
    var ATTR_KEY = 'sm_atribucion';
    var UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

    var attribution = (function () {
        var saved = {};
        try { saved = JSON.parse(storageGet('sessionStorage', ATTR_KEY) || '{}') || {}; } catch (e) { saved = {}; }

        var params = new URLSearchParams(window.location.search);
        ['ws'].concat(UTM_FIELDS).forEach(function (field) {
            var value = params.get(field);
            if (value) saved[field] = value.slice(0, 100);
        });
        storageSet('sessionStorage', ATTR_KEY, JSON.stringify(saved));
        return saved;
    })();

    function whatsappNumber() {
        var ws = (attribution.ws || '').toLowerCase();
        var vendedoras = CONFIG.vendedoras || {};
        return vendedoras[ws] || CONFIG.whatsapp || '573106120366';
    }

    function attributionSummary() {
        var parts = [];
        if (attribution.ws) parts.push('ws:' + attribution.ws);
        if (attribution.utm_campaign) parts.push('camp:' + attribution.utm_campaign);
        if (attribution.utm_source) parts.push('src:' + attribution.utm_source);
        if (attribution.utm_content) parts.push('ad:' + attribution.utm_content);
        return parts.join(' | ');
    }

    // Enlaces al catálogo: misma URL configurada + UTMs/vendedora de la visita
    function decorateCatalogLinks() {
        if (!CONFIG.catalogUrl) return;
        var url;
        try { url = new URL(CONFIG.catalogUrl); } catch (e) { return; }
        ['ws'].concat(UTM_FIELDS).forEach(function (field) {
            if (attribution[field]) url.searchParams.set(field, attribution[field]);
        });
        document.querySelectorAll('a[data-catalog]').forEach(function (link) {
            link.href = url.toString();
        });
    }

    // Enlaces de WhatsApp: número de la vendedora + mensaje con el origen
    function decorateWhatsAppLinks() {
        var ref = attributionSummary();
        document.querySelectorAll('a[data-wa]').forEach(function (link) {
            var text = link.getAttribute('data-wa') || 'Hola, quiero información';
            if (ref) text += '\n\n(Ref: ' + ref + ')';
            link.href = 'https://wa.me/' + whatsappNumber() + '?text=' + encodeURIComponent(text);
        });
    }

    /* ------------------------------------------------------------------
       CONSENTIMIENTO Y MEDICIÓN
       ------------------------------------------------------------------ */
    var CONSENT_KEY = 'sm_cookie_consent';
    var trackersLoaded = false;

    function hasTrackers() {
        return Boolean(TRACKING.metaPixelId || TRACKING.ga4Id || TRACKING.clarityId);
    }

    function loadScript(src) {
        var s = document.createElement('script');
        s.async = true;
        s.src = src;
        document.head.appendChild(s);
    }

    function loadTrackers() {
        if (trackersLoaded) return;
        trackersLoaded = true;

        if (TRACKING.metaPixelId) {
            /* Snippet oficial de Meta Pixel */
            !function (f, b, e, v, n, t, s) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                n.queue = []; t = b.createElement(e); t.async = !0;
                t.src = v; s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s);
            }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            window.fbq('init', TRACKING.metaPixelId);
            window.fbq('track', 'PageView');
        }

        if (TRACKING.ga4Id) {
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', TRACKING.ga4Id);
            loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(TRACKING.ga4Id));
        }

        if (TRACKING.clarityId) {
            window.clarity = window.clarity || function () {
                (window.clarity.q = window.clarity.q || []).push(arguments);
            };
            loadScript('https://www.clarity.ms/tag/' + encodeURIComponent(TRACKING.clarityId));
        }
    }

    // Un solo punto para reportar eventos a Meta y GA4
    function track(kind, label) {
        var data = { origen: label || '', vendedora: attribution.ws || 'default' };
        try {
            if (typeof window.fbq === 'function') {
                if (kind === 'whatsapp') window.fbq('track', 'Contact', data);
                else window.fbq('trackCustom', 'ClicCatalogo', data);
            }
        } catch (e) { /* sin píxel */ }
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', kind === 'whatsapp' ? 'contact_whatsapp' : 'click_catalogo', data);
            }
        } catch (e) { /* sin GA4 */ }
    }

    function setupConsent() {
        var banner = document.querySelector('.cookie-banner');
        var consent = storageGet('localStorage', CONSENT_KEY);

        if (consent === 'granted') loadTrackers();

        if (!banner || !hasTrackers()) {
            // Sin analítica configurada no hay cookies que gestionar
            document.querySelectorAll('[data-cookie-settings]').forEach(function (button) {
                button.closest('li').hidden = true;
            });
            return;
        }
        if (!consent) banner.hidden = false;

        banner.addEventListener('click', function (event) {
            var button = event.target.closest('[data-consent]');
            if (!button) return;
            var value = button.getAttribute('data-consent');
            storageSet('localStorage', CONSENT_KEY, value);
            banner.hidden = true;
            if (value === 'granted') {
                loadTrackers();
            } else if (trackersLoaded) {
                // Ya se cargaron scripts: recargar es la forma limpia de retirarlos
                window.location.reload();
            }
        });

        document.querySelectorAll('[data-cookie-settings]').forEach(function (button) {
            button.addEventListener('click', function () { banner.hidden = false; });
        });
    }

    function setupClickTracking() {
        document.addEventListener('click', function (event) {
            var el = event.target.closest('[data-track]');
            if (el) track(el.getAttribute('data-track'), el.getAttribute('data-track-label'));
        });
    }

    /* ------------------------------------------------------------------
       INTERFAZ
       ------------------------------------------------------------------ */
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isSeason = document.documentElement.classList.contains('navidad');

    /* ------------------------------------------------------------------
       PANTALLA DE CARGA
       Visible mínimo 0,9 s (para que no sea un parpadeo) y máximo 2,5 s
       (para no hacer esperar si una imagen tarda). Una vez por sesión.
       ------------------------------------------------------------------ */
    function setupSplash() {
        var splash = document.querySelector('[data-splash]');
        if (!splash || document.documentElement.classList.contains('splash-seen')) return;

        var MIN_MS = 900;
        var MAX_MS = 2500;
        var hidden = false;

        function hide() {
            if (hidden) return;
            hidden = true;
            splash.classList.add('is-hidden');
            storageSet('sessionStorage', 'sm_splash', '1');
            window.setTimeout(function () { splash.remove(); }, 600);
        }

        function hideAfterMinimum() {
            var elapsed = window.performance ? window.performance.now() : MIN_MS;
            window.setTimeout(hide, Math.max(0, MIN_MS - elapsed));
        }

        if (document.readyState === 'complete') hideAfterMinimum();
        else window.addEventListener('load', hideAfterMinimum);
        window.setTimeout(hide, MAX_MS);
        // Tocar la pantalla la cierra de inmediato
        splash.addEventListener('click', hide);
    }

    /* ------------------------------------------------------------------
       TEMPORADA NAVIDEÑA
       Todo se activa con <html class="navidad">. Fuera de temporada basta
       con quitar esa clase: no se crean luces ni nieve.
       ------------------------------------------------------------------ */
    function buildXmasLights() {
        if (!isSeason) return;
        var colors = ['gold', 'pink', 'green', 'white', 'cyan'];
        // Un bombillo cada ~70px, entre 8 y 26
        var count = Math.max(8, Math.min(26, Math.round(window.innerWidth / 70)));
        document.querySelectorAll('[data-xmas-lights]').forEach(function (list) {
            var html = '';
            for (var i = 0; i < count; i++) {
                html += '<li class="xmas-light xmas-light--' + colors[i % colors.length] + '"></li>';
            }
            list.innerHTML = html;
        });
    }

    // Nieve tipo "bokeh": copos suaves de distintos tamaños y profundidades
    function setupSnow() {
        var canvas = document.querySelector('[data-snow]');
        if (!canvas || !isSeason || reducedMotion || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var width = 0;
        var height = 0;
        var flakes = [];
        var running = true;

        // Un copo pre-dibujado con degradado; luego solo se escala (barato)
        var sprite = document.createElement('canvas');
        sprite.width = sprite.height = 64;
        var sctx = sprite.getContext('2d');
        var grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.35, 'rgba(255,255,255,.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 64, 64);

        function newFlake(randomY) {
            var depth = Math.random();               // 0 = lejos, 1 = cerca
            var bokeh = Math.random() < 0.12;        // algunos copos grandes y desenfocados
            return {
                x: Math.random() * width,
                y: randomY ? Math.random() * height : -20,
                size: bokeh ? 14 + Math.random() * 16 : 3 + depth * 7,
                speed: 0.3 + depth * 1.1,
                sway: 0.4 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2,
                alpha: bokeh ? 0.12 + Math.random() * 0.12 : 0.45 + depth * 0.45
            };
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var target = width < 768 ? 40 : 70;
            while (flakes.length < target) flakes.push(newFlake(true));
            flakes.length = target;
        }

        function frame(time) {
            if (!running) return;
            ctx.clearRect(0, 0, width, height);
            for (var i = 0; i < flakes.length; i++) {
                var f = flakes[i];
                f.y += f.speed;
                f.x += Math.sin(time / 1000 * f.sway + f.phase) * 0.4;
                if (f.y > height + 30) flakes[i] = f = newFlake(false);
                ctx.globalAlpha = f.alpha;
                ctx.drawImage(sprite, f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
            }
            window.requestAnimationFrame(frame);
        }

        resize();
        window.addEventListener('resize', resize, { passive: true });
        // No gastar batería con la pestaña oculta
        document.addEventListener('visibilitychange', function () {
            running = !document.hidden;
            if (running) window.requestAnimationFrame(frame);
        });
        window.requestAnimationFrame(frame);
    }

    /* ------------------------------------------------------------------
       PARALLAX: el fondo se desplaza más lento que la página
       ------------------------------------------------------------------ */
    function setupParallax() {
        var layers = document.querySelectorAll('[data-parallax]');
        if (!layers.length || reducedMotion) return;
        var ticking = false;

        function update() {
            ticking = false;
            var vh = window.innerHeight;
            layers.forEach(function (layer) {
                var rect = layer.parentElement.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > vh) return;
                // -1 cuando la sección entra por abajo, 1 cuando sale por arriba
                var progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
                var shift = progress * rect.height * 0.09; // el fondo sobra un 10% arriba y abajo
                layer.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
            });
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        }, { passive: true });
        update();
    }

    function setupSocial() {
        var social = CONFIG.social || {};
        var any = false;
        document.querySelectorAll('[data-social]').forEach(function (link) {
            var url = social[link.getAttribute('data-social')];
            if (!url) return;
            link.href = url;
            link.parentElement.hidden = false;
            any = true;
        });
        var section = document.getElementById('redes');
        if (section && any) section.hidden = false;
    }

    function setYear() {
        document.querySelectorAll('[data-year]').forEach(function (el) {
            el.textContent = String(new Date().getFullYear());
        });
    }

    decorateCatalogLinks();
    decorateWhatsAppLinks();
    setupConsent();
    setupClickTracking();
    setupSplash();
    buildXmasLights();
    setupSnow();
    setupParallax();
    setupSocial();
    setYear();
})();
