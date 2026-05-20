/* Shared English navbar, single source of truth.
   Each page includes <div id="nav-root" data-active="..." data-ar="..."></div>
   and <script src="nav.js" defer></script>. This script injects the navbar
   HTML into #nav-root, sets the .active class, wires the AR link, and binds
   the hamburger / mobile-menu behavior.

   HTML is embedded as a string (not fetched) so the nav works under any
   protocol including file://. Hrefs and the logo image are anchored to this
   script's directory so the nav works from any page depth (top-level,
   solutions/, academy/, product/). Update NAV_HTML below to change markup. */

(function () {
    var NAV_HTML = '' +
'<nav class="navbar" id="navbar">' +
'    <div class="container nav-container">' +
'        <a href="{{HOME_HREF}}" class="nav-logo">' +
'            <img src="{{LOGO_SRC}}" alt="NLC – National Lighting Company" id="navLogo" referrerpolicy="no-referrer">' +
'        </a>' +
'        <ul class="nav-menu">' +
'            <li><a href="{{HOME_HREF}}" class="nav-link" data-key="index">Home</a></li>' +
'            <li><a href="{{ANCHOR}}#about" class="nav-link" data-key="about">About</a></li>' +
'            <li><a href="{{ANCHOR}}#solutions" class="nav-link" data-key="solutions">Solutions</a></li>' +
'            <li><a href="{{ANCHOR}}#projects" class="nav-link" data-key="projects">Projects</a></li>' +
'            <li><a href="{{ANCHOR}}#products" class="nav-link" data-key="products">Products</a></li>' +
'            <li><a href="{{ANCHOR}}#clients" class="nav-link" data-key="clients">Clients</a></li>' +
'            <li><a href="{{ANCHOR}}#academy" class="nav-link" data-key="academy">Academy</a></li>' +
'            <li><a href="{{ANCHOR}}#news" class="nav-link" data-key="news">News</a></li>' +
'        </ul>' +
'        <a href="{{ANCHOR}}#contact" class="btn btn-primary nav-cta" id="navCta">' +
'            Contact Us <i class="fas fa-arrow-right"></i>' +
'        </a>' +
'        <a href="{{AR_HREF}}" class="lang-switch"><i class="fas fa-globe"></i> عربي</a>' +
'        <button class="hamburger" id="hamburger" aria-label="Toggle menu"><span></span><span></span><span></span></button>' +
'    </div>' +
'</nav>' +
'<div class="mob-menu" id="mobMenu">' +
'    <button class="mob-close" id="mobClose" aria-label="Close menu"><i class="fas fa-times"></i></button>' +
'    <a href="{{HOME_HREF}}" class="mob-link" data-key="index">Home</a>' +
'    <a href="{{ANCHOR}}#about" class="mob-link" data-key="about">About</a>' +
'    <a href="{{ANCHOR}}#solutions" class="mob-link" data-key="solutions">Solutions</a>' +
'    <a href="{{ANCHOR}}#projects" class="mob-link" data-key="projects">Projects</a>' +
'    <a href="{{ANCHOR}}#products" class="mob-link" data-key="products">Products</a>' +
'    <a href="{{ANCHOR}}#clients" class="mob-link" data-key="clients">Clients</a>' +
'    <a href="{{ANCHOR}}#academy" class="mob-link" data-key="academy">Academy</a>' +
'    <a href="{{ANCHOR}}#news" class="mob-link" data-key="news">News</a>' +
'    <a href="{{ANCHOR}}#contact" class="btn btn-primary" style="margin-top:24px">Contact Us <i class="fas fa-arrow-right"></i></a>' +
'    <a href="{{AR_HREF}}" class="mob-link mob-lang"><i class="fas fa-globe"></i> عربي</a>' +
'</div>';

    function getScriptDir() {
        var s = document.currentScript;
        if (!s) {
            var all = document.scripts;
            for (var i = 0; i < all.length; i++) {
                if (all[i].src && /\/nav\.js(\?.*)?$/.test(all[i].src)) { s = all[i]; break; }
            }
        }
        return s && s.src ? s.src.replace(/[^\/]+(\?.*)?$/, '') : '';
    }
    var BASE = getScriptDir();
    var LOGO_SRC = BASE + 'images/logo/logo-blue.svg';

    function boot() {
        var root = document.getElementById('nav-root');
        if (!root) return;
        var activeKey = root.getAttribute('data-active') || '';
        var arHref = root.getAttribute('data-ar') || 'ar/index.html';

        // Detect landing page so navbar uses bare anchors (#about, #clients, etc.)
        // identical to the canonical landing pattern. Fallback to full path on other pages.
        var path = location.pathname || '';
        var isLanding = /\/$|\/index\.html$/.test(path) && !/\/ar\//.test(path);
        var ANCHOR = isLanding ? '' : (BASE + 'index.html');
        var HOME_HREF = isLanding ? '#home' : (BASE + 'index.html');

        root.innerHTML = NAV_HTML
            .split('{{AR_HREF}}').join(arHref)
            .split('{{LOGO_SRC}}').join(LOGO_SRC)
            .split('{{HOME_HREF}}').join(HOME_HREF)
            .split('{{ANCHOR}}').join(ANCHOR)
            .split('{{BASE}}').join(BASE);

        if (activeKey) {
            var active = root.querySelectorAll('[data-key="' + activeKey + '"]');
            for (var i = 0; i < active.length; i++) active[i].classList.add('active');
        }

        var hamburger = document.getElementById('hamburger');
        var mobMenu = document.getElementById('mobMenu');
        var mobClose = document.getElementById('mobClose');

        function toggle(open) {
            if (!mobMenu || !hamburger) return;
            mobMenu.classList.toggle('open', open);
            hamburger.classList.toggle('open', open);
            document.body.style.overflow = open ? 'hidden' : '';
        }

        if (hamburger) hamburger.addEventListener('click', function () {
            toggle(!mobMenu.classList.contains('open'));
        });
        if (mobClose) mobClose.addEventListener('click', function () { toggle(false); });
        var mobLinks = root.querySelectorAll('.mob-link');
        for (var j = 0; j < mobLinks.length; j++) {
            mobLinks[j].addEventListener('click', function () { toggle(false); });
        }

        // Scroll-driven .scrolled class (matches landing-page behavior)
        var navbar = document.getElementById('navbar');
        if (navbar) {
            window.addEventListener('scroll', function () {
                navbar.classList.toggle('scrolled', window.scrollY > 80);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
