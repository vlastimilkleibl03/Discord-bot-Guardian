async function loadDashboard() {
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');
    const error = document.getElementById('error');
    const username = document.getElementById('username');

    try {
        const response = await fetch('/api/me');

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        const user = await response.json();

        username.textContent = user.username;

        loading.hidden = true;
        dashboard.hidden = false;

    } catch (err) {
        loading.hidden = true;
        error.hidden = false;
    }
}

loadDashboard();
