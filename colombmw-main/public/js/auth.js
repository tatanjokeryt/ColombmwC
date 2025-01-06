async function register() {
    const phone_number = document.getElementById('numeroRegistro').value;
    const password = document.getElementById('passwordRegistro').value;
    const invitation_code = document.getElementById('codigoInvitacion').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_number,
                password,
                invitation_code
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registro exitoso');
            mostrarLogin();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error en el servidor');
    }
}

async function login() {
    const phone_number = document.getElementById('numeroLogin').value;
    const password = document.getElementById('passwordLogin').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_number,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error en el servidor');
    }
}
