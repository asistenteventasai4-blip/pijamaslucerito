/* ==========================================================================
   Saramantha · comportamiento de la landing
   - Atribución (?ws= y UTMs) que viaja al catálogo y a WhatsApp
   - Consentimiento de cookies antes de cargar analítica y píxel
   - Medición de clics a catálogo y WhatsApp
   - Menú móvil, redes y año del footer
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
    function setupMobileNav() {
        var toggle = document.querySelector('.nav-toggle');
        var nav = document.getElementById('site-nav');
        if (!toggle || !nav) return;

        function setOpen(open) {
            nav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        }

        toggle.addEventListener('click', function () {
            setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });
        nav.addEventListener('click', function (event) {
            if (event.target.closest('a')) setOpen(false);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                setOpen(false);
                toggle.focus();
            }
        });
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
    setupMobileNav();
    setupSocial();
    setYear();
})();
