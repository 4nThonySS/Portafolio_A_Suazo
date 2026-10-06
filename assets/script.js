/* ===== NAVBAR: resalta el enlace de la sección que estás viendo ===== */
const links = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("main section[id]");

function setActive(id) {
  links.forEach((a) => {
    const isActive = a.getAttribute("href") === `#${id}`;
    a.classList.toggle("active", isActive);
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

// Una "línea" en el centro de la pantalla: la sección que la cruza es la activa
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  },
  { rootMargin: "-50% 0px -50% 0px" }
);

sections.forEach((s) => observer.observe(s));

/* ===== DESPLAZAMIENTO SUAVE AL HACER CLIC (no depende del navegador) ===== */
const DURACION = 700; // milisegundos

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function scrollSuave(destino) {
    const inicio = window.scrollY;
    const distancia = destino - inicio;
    const t0 = performance.now();

    function paso(ahora) {
        const progreso = Math.min((ahora - t0) / DURACION, 1);
        window.scrollTo(0, inicio + distancia * easeInOut(progreso));
        if (progreso < 1) requestAnimationFrame(paso);
    }

    requestAnimationFrame(paso);
}

// Todos los enlaces internos (navbar, logo, botones) que apunten a un "#id"
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
        const id = a.getAttribute("href").slice(1);
        const seccion = document.getElementById(id);
        if (!seccion) return;

        e.preventDefault();
        const altoNavbar = document.querySelector(".site-header").offsetHeight;
        scrollSuave(seccion.offsetTop - altoNavbar);
        history.pushState(null, "", `#${id}`);
    });
});

/* ===== ESTRELLAS: parpadeo + reacción al mouse ===== */
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
const RADIO_MOUSE = 140; // distancia a la que el mouse afecta a las estrellas
const mouse = { x: -9999, y: -9999 };
let stars = [];
let starsAlpha = 1; // baja a 0 al llegar a "Sobre mí"

function crearEstrellas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cantidad = Math.min(160, Math.floor((window.innerWidth * window.innerHeight) / 9000));
    stars = Array.from({ length: cantidad }, () => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        return {
            baseX: x,
            baseY: y,
            x,
            y,
            vx: 0,
            vy: 0,
            r: Math.random() * 1.4 + 0.4,
            speed: Math.random() * 0.003 + 0.0015, // velocidad de parpadeo
            phase: Math.random() * Math.PI * 2,
        };
    });
}

function dibujar(time) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (starsAlpha > 0.01) {
        for (const s of stars) {
            const dx = s.x - mouse.x;
            const dy = s.y - mouse.y;
            const dist = Math.hypot(dx, dy) || 1;
            const cerca = dist < RADIO_MOUSE ? 1 - dist / RADIO_MOUSE : 0;

            // El mouse empuja la estrella y un resorte la devuelve a su lugar
            if (cerca > 0) {
                s.vx += (dx / dist) * cerca * 0.8;
                s.vy += (dy / dist) * cerca * 0.8;
            }
            s.vx += (s.baseX - s.x) * 0.03;
            s.vy += (s.baseY - s.y) * 0.03;
            s.vx *= 0.88;
            s.vy *= 0.88;
            s.x += s.vx;
            s.y += s.vy;

            // Línea desde el mouse hacia las estrellas cercanas
            if (cerca > 0) {
                ctx.globalAlpha = cerca * 0.35 * starsAlpha;
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(mouse.x, mouse.y);
                ctx.lineTo(s.x, s.y);
                ctx.stroke();
            }

            // Parpadeo + brillo extra cuando el mouse está cerca
            const parpadeo = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
            ctx.globalAlpha = Math.min(1, parpadeo + cerca) * starsAlpha;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * (1 + cerca * 1.5), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    requestAnimationFrame(dibujar);
}

/* ===== FONDO: NEGRO -> GRIS AL BAJAR HASTA "SOBRE MÍ" ===== */
const NEGRO = [5, 5, 5];
const GRIS = [46, 46, 48]; // cambia este valor para otro gris
const seccionSobreMi = document.getElementById("sobre-mi");

function actualizarFondo() {
    const fin = seccionSobreMi.offsetTop - 80;
    const t = Math.min(Math.max(window.scrollY / fin, 0), 1);
    const [r, g, b] = NEGRO.map((c, i) => Math.round(c + (GRIS[i] - c) * t));
    document.documentElement.style.setProperty("--bg", `rgb(${r}, ${g}, ${b})`);
    starsAlpha = 1 - t;
}

/* ===== EVENTOS ===== */
window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
document.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
});
window.addEventListener("scroll", actualizarFondo, { passive: true });
window.addEventListener("resize", () => {
    crearEstrellas();
    actualizarFondo();
});

crearEstrellas();
actualizarFondo();
requestAnimationFrame(dibujar);

/* ===== NOMBRE QUE SE ESCRIBE ===== */
const nombre = document.getElementById("typed");
const textoCompleto = nombre.dataset.text;
const VELOCIDAD = 110; // milisegundos por letra

function escribirNombre() {
    nombre.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
        nombre.textContent = textoCompleto.slice(0, ++i);
        if (i === textoCompleto.length) clearInterval(timer);
    }, VELOCIDAD);
}

escribirNombre();