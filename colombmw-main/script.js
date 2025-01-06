// Mostrar y ocultar formularios
function mostrarRegistro() {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("registro").classList.remove("hidden");
}

function mostrarLogin() {
    document.getElementById("registro").classList.add("hidden");
    document.getElementById("login").classList.remove("hidden");
}

// Función para registrar un usuario
function registrar() {
    const numero = document.getElementById("numeroRegistro").value;
    const password = document.getElementById("passwordRegistro").value;
    const codigoInvitacion = document.getElementById("codigoInvitacion").value;
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    if (!numero || !password) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    if (usuarios.some((u) => u.numero === numero)) {
        alert("Este número ya está registrado.");
        return;
    }

    usuarios.push({ numero, password, saldo: 5500, inversiones: [] });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    alert("Registro exitoso. Por favor, inicia sesión.");
    mostrarLogin();
}

// Función para iniciar sesión
function iniciarSesion() {
    const numero = document.getElementById("numeroLogin").value;
    const password = document.getElementById("passwordLogin").value;
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    // Verificar si el usuario es el administrador
    if (numero === "3115463689" && password === "tatan10k") {
        localStorage.setItem("numeroActivo", numero);
        mostrarAdminPanel();
        return;
    }

    // Buscar el usuario en la base de datos local
    const usuario = usuarios.find((u) => u.numero === numero && u.password === password);

    if (usuario) {
        localStorage.setItem("numeroActivo", numero);
        mostrarPrincipal(usuario.saldo);
    } else {
        alert("Número o contraseña incorrectos.");
    }
}

// Mostrar la página principal
function mostrarPrincipal(saldoInicial) {
    document.getElementById("registro").classList.add("hidden");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("principal").classList.remove("hidden");
    document.getElementById("saldo").textContent = `Saldo: $${saldoInicial}`;
}

// Mostrar el panel administrativo
function mostrarAdminPanel() {
    document.getElementById("registro").classList.add("hidden");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("principal").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
}

// Función para invertir y agregar el saldo durante 30 días
function invertir(costo, ingresoDiario) {
    const numeroActivo = localStorage.getItem("numeroActivo");
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuario = usuarios.find((u) => u.numero === numeroActivo);

    if (usuario.saldo >= costo) {
        usuario.saldo -= costo;
        // Guardamos la fecha de inicio de la inversión
        usuario.inversiones.push({
            ingresoDiario,
            fechaInicio: new Date(),
            diasRestantes: 30, // Duración de la inversión en días
        });
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        alert("Inversión realizada con éxito.");
        mostrarPrincipal(usuario.saldo);

        // Agregar saldo cada 24 horas durante 30 días
        const intervalo = setInterval(() => {
            const inversion = usuario.inversiones[usuario.inversiones.length - 1];
            const fechaInicio = new Date(inversion.fechaInicio);
            const fechaActual = new Date();
            const diasTranscurridos = Math.floor((fechaActual - fechaInicio) / (1000 * 60 * 60 * 24));

            if (diasTranscurridos < 30 && inversion.diasRestantes > 0) {
                agregarSaldoDiario(ingresoDiario);
                inversion.diasRestantes--;
                localStorage.setItem("usuarios", JSON.stringify(usuarios)); // Guardar cambios en localStorage
            }

            if (diasTranscurridos >= 30) {
                clearInterval(intervalo); // Detener el intervalo después de 30 días
            }
        }, 24 * 60 * 60 * 1000); // 24 horas en milisegundos
    } else {
        alert("Saldo insuficiente.");
    }
}



// Solicitar recarga por Telegram
function solicitarRecargaTelegram() {
    const cantidad = document.getElementById("cantidadAgregar").value;
    const numero = localStorage.getItem("numeroActivo");

    if (!cantidad || cantidad <= 0) {
        alert("Por favor, ingrese una cantidad válida para recargar.");
        return;
    }

    const mensaje = `Hola, solicito una recarga por $${cantidad}. Mi número de usuario es: ${numero}.`;
    const enlaceTelegram = `https://t.me/JesusBaltazar10?text=${encodeURIComponent(mensaje)}`;

    window.open(enlaceTelegram, "_blank");
    alert("Solicitud de recarga enviada. Por favor, procesa la recarga manualmente.");
}
// Solicitar recarga con mínimo 25,000
function solicitarRecargaTelegram() {
    const cantidad = document.getElementById("cantidadAgregar").value;
    const numero = localStorage.getItem("numeroActivo");

    if (!cantidad || cantidad < 25000) {
        alert("La cantidad mínima para recargar es $25,000.");
        return;
    }

    const mensaje = `Hola, solicito una recarga por $${cantidad}. Mi número de usuario es: ${numero}.`;
    const enlaceTelegram = `https://t.me/JesusBaltazar10?text=${encodeURIComponent(mensaje)}`;

    window.open(enlaceTelegram, "_blank");
    alert("Solicitud de recarga enviada. Por favor,espera la recarga se procesa manualmente.");
 }

 function solicitarRetiroTelegram() {
    const cantidad = document.getElementById("cantidadDisminuir").value;
    const numero = localStorage.getItem("numeroActivo");

    if (!cantidad || cantidad < 12000) {
        alert("La cantidad mínima para retirar es $12,000.");
        return;
    }

    const mensaje = `Hola, solicito un retiro por $${cantidad}. Mi número de usuario es: ${numero}.`;
    const enlaceTelegram = `https://t.me/JesusBaltazar10?text=${encodeURIComponent(mensaje)}`;

    window.open(enlaceTelegram, "_blank");
    alert("Solicitud de retiro enviada. Por favor, espere el retiro se procesa manualmente.");
}


// Aumentar saldo manualmente
function aumentarSaldo() {
    const numeroUsuario = document.getElementById("usuarioSaldo").value;
    const cantidad = Number(document.getElementById("cantidadSaldo").value);
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuario = usuarios.find((u) => u.numero === numeroUsuario);

    if (usuario) {
        usuario.saldo += cantidad;
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        alert(`Saldo aumentado. Nuevo saldo: $${usuario.saldo}`);
    } else {
        alert("Usuario no encontrado.");
    }
}
// Función para disminuir saldo manualmente
function disminuirSaldo() {
    const numeroUsuario = document.getElementById("usuarioSaldo").value;
    const cantidad = Number(document.getElementById("cantidadRestar").value);
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuario = usuarios.find((u) => u.numero === numeroUsuario);

    if (usuario) {
        if (usuario.saldo >= cantidad) {
            usuario.saldo -= cantidad;
            localStorage.setItem("usuarios", JSON.stringify(usuarios));
            alert(`Saldo disminuido. Nuevo saldo: $${usuario.saldo}`);
        } else {
            alert("Saldo insuficiente para restar.");
        }
    } else {
        alert("Usuario no encontrado.");
    }
}


// Función de cierre de sesión
function cerrarSesion() {
    localStorage.removeItem("numeroActivo");
    document.getElementById("adminPanel").classList.add("hidden");
    document.getElementById("principal").classList.add("hidden");
    mostrarLogin();
 }