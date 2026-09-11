async function loadDashboard() {
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');
    const error = document.getElementById('error');
    const username = document.getElementById('username');
    const guildSelect = document.getElementById('guild_select');

    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        const user = await response.json();

        username.textContent = user.username;
        for (const guild of user.guilds) {
            const option = document.createElement('option');
            option.value = guild.id;
            option.textContent = guild.name;
            guildSelect.appendChild(option);
        }

        loading.style.display = "none";
        dashboard.hidden = false;

    } catch (err) {
        loading.style.display = "none";
        error.style.display = "flex";
    }
}

loadDashboard();
