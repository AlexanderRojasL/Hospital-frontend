document.addEventListener("DOMContentLoaded", async () => {
  const source = new EventSource(`${CONFIG.API_BASE_URL}/events`);

  source.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.tipo === 'CREADA' || data.tipo === 'ACTUALIZADA') {
      actualizarTabla(data.citas);
    }
  };

  // 🔁 Cargar citas existentes al inicio
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/cita`);
    if (!res.ok) throw new Error("No se pudieron obtener las citas");
    const citas = await res.json();
    actualizarTabla(citas);
  } catch (err) {
    console.error("❌ Error cargando citas iniciales:", err);
    alert("Error al cargar citas existentes");
  }

  function actualizarTabla(citas) {
    const tbody = document.querySelector("#tabla-citas tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    citas.forEach(cita => {
      const fila = document.createElement("tr");

      const estados = ['pendiente', 'confirmada', 'rechazada', 'cancelada'];
      const opciones = estados.map(estado => {
        const selected = estado === cita.estado ? 'selected' : '';
        return `<option value="${estado}" ${selected}>${capitalizar(estado)}</option>`;
      }).join("");

      fila.innerHTML = `
        <td>${cita.idCita}</td>
        <td>${cita.idPaciente}</td>
        <td>${cita.idMedico}</td>
        <td>
          <select data-id="${cita.idCita}">
            ${opciones}
          </select>
        </td>
        <td>${cita.fecha}</td>
        <td>${cita.hora}</td>
        <td><button class="guardar-btn" data-id="${cita.idCita}">Guardar y Notificar</button></td>
      `;

      tbody.appendChild(fila);
    });

    document.querySelectorAll(".guardar-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idCita = btn.dataset.id;
        const select = document.querySelector(`select[data-id="${idCita}"]`);
        const nuevoEstado = select.value;
        const fechaActualizacion = new Date().toISOString();

        try {
          const res = await fetch(`${CONFIG.API_BASE_URL}/api/cita/estado/${idCita}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado })
          });

          if (!res.ok) throw new Error("Error al actualizar cita");
          /*
          // Notificar al paciente (endpoint externo simulado)
          await fetch("https://httpbin.org/post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idCita,
              estado: nuevoEstado,
              fechaActualizacion
            })
          });

          console.log(`✅ Notificado paciente de cita ${idCita}`);*/
        } catch (err) {
          console.error("❌ Error al actualizar o notificar:", err);
          alert("Error al actualizar o notificar");
        }
      });
    });
  }

  function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
});
