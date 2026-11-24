(function () {
    "use strict";

    var body = document.body;

    /* ---------- Header: hide on scroll down, show on scroll up, progress line ---------- */
    var header = document.getElementById("siteHeader");
    var progress = document.getElementById("capProgress");
    var mobileBar = document.getElementById("mobileBar");
    var heroEl = document.getElementById("home");
    var lastY = window.scrollY;
    var ticking = false;
    function onScroll() {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        header.classList.toggle("scrolled", y > 10);
        header.classList.toggle("is-hidden", y > 400 && y > lastY + 4);
        if (y < lastY - 4 || y <= 400) header.classList.remove("is-hidden");
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
        mobileBar.classList.toggle("show", y > heroEl.offsetHeight * .6);
        lastY = y;
        ticking = false;
    }
    window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---------- Hero banner slides ---------- */
    var slides = document.querySelectorAll(".hero-slide");
    var dots = document.querySelectorAll(".hero-dots button");
    var slideIndex = 0;
    var slideTimer = null;
    var SLIDE_TIME = 6000;
    function goSlide(i) {
        slideIndex = (i + slides.length) % slides.length;
        slides.forEach(function (s, n) { s.classList.toggle("is-active", n === slideIndex); });
        dots.forEach(function (d, n) {
            d.classList.remove("is-active");
            if (n === slideIndex) { void d.offsetWidth; d.classList.add("is-active"); }
        });
        clearTimeout(slideTimer);
        slideTimer = setTimeout(function () { goSlide(slideIndex + 1); }, SLIDE_TIME);
    }
    // slides 2+ load only after the page has finished loading (keeps first paint fast)
    function hydrateSlides() {
        document.querySelectorAll(".hero-slide [data-srcset]").forEach(function (s) {
            s.srcset = s.getAttribute("data-srcset");
            s.removeAttribute("data-srcset");
        });
        document.querySelectorAll(".hero-slide img[data-src]").forEach(function (img) {
            img.src = img.getAttribute("data-src");
            img.removeAttribute("data-src");
        });
    }
    if (document.readyState === "complete") hydrateSlides();
    else window.addEventListener("load", hydrateSlides);

    if (slides.length > 1) {
        dots.forEach(function (d) {
            d.addEventListener("click", function () { goSlide(Number(d.getAttribute("data-slide"))); });
        });
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) clearTimeout(slideTimer);
            else goSlide(slideIndex);
        });
        slideTimer = setTimeout(function () { goSlide(1); }, SLIDE_TIME);
    }

    /* ---------- Active section highlight (menu + top nav) ---------- */
    var navLinks = document.querySelectorAll(".menu-links a");
    if ("IntersectionObserver" in window && navLinks.length) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (a) {
                    a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
                });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        var seen = {};
        navLinks.forEach(function (a) {
            var id = a.getAttribute("href");
            if (seen[id]) return;
            seen[id] = true;
            var sec = document.querySelector(id);
            if (sec) spy.observe(sec);
        });
    }

    /* ---------- Menu drawer ---------- */
    var menu = document.getElementById("mobileMenu");
    var toggle = document.getElementById("menuToggle");
    function setMenu(open) {
        menu.classList.toggle("open", open);
        menu.setAttribute("aria-hidden", String(!open));
        toggle.setAttribute("aria-expanded", String(open));
        body.classList.toggle("no-scroll", open);
    }
    toggle.addEventListener("click", function () { setMenu(true); });
    document.getElementById("menuClose").addEventListener("click", function () { setMenu(false); });
    menu.querySelectorAll("a, [data-menu-close]").forEach(function (el) {
        el.addEventListener("click", function () { setMenu(false); });
    });

    /* ---------- Enquiry modal ---------- */
    var modal = document.getElementById("enquiryModal");
    var modalTitle = document.getElementById("modalTitle");
    var lastFocus = null;

    function openModal(title) {
        lastFocus = document.activeElement;
        modalTitle.textContent = title || "Enquire Now";
        modal.hidden = false;
        body.classList.add("no-scroll");
        var first = document.getElementById("qSenderNamepopup");
        if (first) setTimeout(function () { first.focus(); }, 50);
    }
    function closeModal() {
        modal.hidden = true;
        body.classList.remove("no-scroll");
        if (lastFocus) lastFocus.focus();
    }
    document.querySelectorAll(".js-open-enquiry").forEach(function (btn) {
        btn.addEventListener("click", function () { openModal(btn.getAttribute("data-title")); });
    });
    modal.querySelectorAll("[data-close]").forEach(function (el) {
        el.addEventListener("click", closeModal);
    });

    // auto popup once per session after 12s
    setTimeout(function () {
        try {
            if (sessionStorage.getItem("projectPopup")) return;
            sessionStorage.setItem("projectPopup", "1");
        } catch (e) { /* storage blocked */ }
        if (modal.hidden && !menu.classList.contains("open")) openModal("Get Exclusive Offers");
    }, 12000);

    /* ---------- Amenities slider ---------- */
    document.querySelectorAll("[data-slider]").forEach(function (slider) {
        var key = slider.getAttribute("data-slider");
        var track = slider.querySelector(".slider-track");
        var nav = document.querySelector('[data-slider-nav="' + key + '"]') || slider;
        var step = function () {
            var card = track.firstElementChild;
            var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
            return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
        };
        nav.querySelectorAll(".slider-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var dir = Number(btn.getAttribute("data-dir"));
                var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
                if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
                else if (dir < 0 && track.scrollLeft <= 4) track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
                else track.scrollBy({ left: dir * step(), behavior: "smooth" });
            });
        });
    });

    /* ---------- Floor plan tabs ---------- */
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    function selectTab(tab) {
        tabs.forEach(function (t) {
            var on = t === tab;
            t.classList.toggle("is-active", on);
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
        });
    }
    tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { selectTab(tab); });
        tab.addEventListener("keydown", function (e) {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
            selectTab(next);
            next.focus();
        });
    });

    /* ---------- Gallery lightbox ---------- */
    var lb = document.getElementById("lightbox");
    var lbImg = lb.querySelector(".lightbox-img");
    var shots = Array.prototype.slice.call(document.querySelectorAll(".js-lightbox"));
    var current = 0;
    function show(i) {
        current = (i + shots.length) % shots.length;
        lbImg.src = shots[current].getAttribute("href");
        lbImg.alt = shots[current].querySelector("img").alt;
    }
    shots.forEach(function (a, i) {
        a.addEventListener("click", function (e) {
            e.preventDefault();
            show(i);
            lb.hidden = false;
            body.classList.add("no-scroll");
        });
    });
    function closeLb() { lb.hidden = true; body.classList.remove("no-scroll"); }
    lb.querySelector(".lightbox-close").addEventListener("click", closeLb);
    lb.querySelector(".prev").addEventListener("click", function () { show(current - 1); });
    lb.querySelector(".next").addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            if (!lb.hidden) closeLb();
            else if (!modal.hidden) closeModal();
            else if (menu.classList.contains("open")) setMenu(false);
        }
        if (!lb.hidden && e.key === "ArrowRight") show(current + 1);
        if (!lb.hidden && e.key === "ArrowLeft") show(current - 1);
    });

    /* ---------- Disclaimer read more ---------- */
    var more = document.getElementById("disclaimerMore");
    var readMore = document.getElementById("readMore");
    readMore.addEventListener("click", function () {
        var open = more.hidden;
        more.hidden = !open;
        readMore.textContent = open ? "Read less" : "Read more";
        readMore.setAttribute("aria-expanded", String(open));
    });

    /* ---------- Reveal on scroll ---------- */
    if ("IntersectionObserver" in window) {
        var revealEls = document.querySelectorAll(
            ".section-title, .overview-media, .highlights-media, .why-card, .price-card, .am-card, .plan-card, .locked.map, .gallery-grid li, .contact-shell, .faq-list details, .dev-card"
        );
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var t = entry.target;
                    t.classList.add("in");
                    io.unobserve(t);
                    setTimeout(function () { t.style.transitionDelay = ""; }, 1300);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px" });
        revealEls.forEach(function (el, i) {
            el.classList.add("reveal");
            // small stagger for grid siblings
            var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
            el.style.transitionDelay = Math.min(idx, 5) * 70 + "ms";
            io.observe(el);
        });
    }

    document.getElementById("year").textContent = new Date().getFullYear();
})();
