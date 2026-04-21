
let currentYear = new Date().getFullYear();
let selectedKey = null;

function generateCalendar() {
  document.getElementById("yearTitle").innerText = currentYear;

  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const months = [
    "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
  ];

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

  months.forEach((month, index) => {

    const monthDiv = document.createElement("div");
    monthDiv.className = "month";

    const title = document.createElement("h3");
    title.innerText = month;

    const daysDiv = document.createElement("div");
    daysDiv.className = "days";

    /* =========================
       1. CABECERA DÍAS SEMANA
       ========================= */
    weekDays.forEach(d => {
      const wd = document.createElement("div");
      wd.className = "weekday";
      wd.innerText = d;
      daysDiv.appendChild(wd);
    });

    /* =========================
       2. CÁLCULO DÍA INICIO
       ========================= */
    const firstDay = new Date(currentYear, index, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(currentYear, index + 1, 0).getDate();

    /* =========================
       3. HUECOS INICIALES
       ========================= */
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement("div");
      empty.className = "empty";
      daysDiv.appendChild(empty);
    }

    /* =========================
       4. DÍAS DEL MES
       ========================= */
    for (let d = 1; d <= daysInMonth; d++) {

      const day = document.createElement("div");
      day.className = "day";
      day.innerText = d;

      const key = `${currentYear}-${index}-${d}`;
      const saved = localStorage.getItem(key);

      if (saved) {
        day.classList.add(saved);
      }

      day.onclick = () => openModal(key, d, month);

      daysDiv.appendChild(day);
    }

    /* =========================
       5. AÑADIR MES AL CALENDARIO
       ========================= */
    monthDiv.appendChild(title);
    monthDiv.appendChild(daysDiv);
    calendar.appendChild(monthDiv);
  });
  updateStats();
}

function openModal(key, day, month) {
  selectedKey = key;

  document.getElementById("modal").style.display = "block";
  document.getElementById("modalDate").innerText = `${day} ${month} ${currentYear}`;

  const saved = localStorage.getItem(key);
  document.getElementById("taskType").value = saved || "";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function saveTask() {
  const value = document.getElementById("taskType").value;

  if (value) {
    localStorage.setItem(selectedKey, value);
  }

  generateCalendar();
  updateStats();
  closeModal();
}

function deleteTask() {
  localStorage.removeItem(selectedKey);
  generateCalendar();
  updateStats();
  closeModal();
}

function changeYear(offset) {
  currentYear += offset;
  generateCalendar();
  updateStats();
}

function exportPDF() {
  window.print();
}

generateCalendar();

function updateStats() {
  const types = {
    embotellar: 0,
    etiquetar: 0,
    barricas: 0,
    otros: 0,
    vendimia: 0,
    limpieza: 0,
    vacaciones: 0,
    trasiegos: 0,
    especial: 0
  };

  for (let key in localStorage) {
    if (!key.startsWith(currentYear + "-")) continue;

    const value = localStorage.getItem(key);
    if (types.hasOwnProperty(value)) {
      types[value]++;
    }
  }

  document.getElementById("count-embotellar").innerText = types.embotellar;
  document.getElementById("count-etiquetar").innerText = types.etiquetar;
  document.getElementById("count-barricas").innerText = types.barricas;
  document.getElementById("count-otros").innerText = types.otros;
  document.getElementById("count-vendimia").innerText = types.vendimia;
  document.getElementById("count-limpieza").innerText = types.limpieza;
  document.getElementById("count-vacaciones").innerText = types.vacaciones;
  document.getElementById("count-trasiegos").innerText = types.trasiegos;
  document.getElementById("count-especial").innerText = types.especial;
}