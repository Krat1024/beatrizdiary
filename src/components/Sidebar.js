export function renderSidebar({ entries, currentEntryId, user, onSelect, onNew, onSettings, onLogout, onCloseMobile }) {
    const container = document.createElement('div');
    container.className = 'sidebar-container';

    // Header / Actions
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.style.flexDirection = 'column';
    header.style.alignItems = 'flex-start';
    header.style.gap = '10px';

    const userGreeting = document.createElement('div');
    userGreeting.innerHTML = `<strong>Olá, ${user && user.name ? user.name : 'Escritor'}</strong>`;
    userGreeting.style.fontSize = '1.1em';
    userGreeting.style.marginBottom = '5px';

    const actionsRow = document.createElement('div');
    actionsRow.style.display = 'flex';
    actionsRow.style.width = '100%';
    actionsRow.style.justifyContent = 'space-between';
    actionsRow.style.alignItems = 'center';

    const newBtn = document.createElement('button');
    newBtn.textContent = '+ New Entry';
    newBtn.className = 'btn-primary';
    newBtn.onclick = onNew;

    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '&#9881;'; // Gear icon
    settingsBtn.className = 'btn-icon';
    settingsBtn.title = 'Configurações';
    settingsBtn.onclick = onSettings;

    const logoutBtn = document.createElement('button');
    logoutBtn.innerHTML = '&#8618;'; // Logout/Exit icon
    logoutBtn.className = 'btn-icon';
    logoutBtn.title = 'Sair';
    logoutBtn.onclick = onLogout;

    const closeMobileBtn = document.createElement('button');
    closeMobileBtn.textContent = '✕';
    closeMobileBtn.className = 'btn-mobile-menu';
    closeMobileBtn.onclick = onCloseMobile;

    actionsRow.append(newBtn, settingsBtn, logoutBtn, closeMobileBtn);
    header.append(userGreeting, actionsRow);
    container.appendChild(header);

    // Entries List
    const list = document.createElement('div');
    list.className = 'entries-list';

    // Sort entries by date desc
    if (!Array.isArray(entries)) {
        console.warn("Sidebar.js: 'entries' is not an array. Value:", entries);
    }
    const sortedEntries = Array.isArray(entries) ? [...entries].sort((a, b) => b.id - a.id) : [];

    if (sortedEntries.length === 0) {
        list.innerHTML = '<div class="empty-state">No entries yet.</div>';
    } else {
        sortedEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = `entry-item ${entry.id === currentEntryId ? 'active' : ''}`;

            const date = new Date(parseInt(entry.id));
            const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            // Snippet (first 40 chars)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = entry.content || '(Empty)';
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const snippet = textContent.slice(0, 40) + (textContent.length > 40 ? '...' : '');

            item.innerHTML = `
            <div class="entry-date" style="display: flex; justify-content: space-between;">
                <span>${dateStr}</span>
                <span style="opacity: 0.5; font-size: 0.8rem;">${timeStr}</span>
            </div>
            <div class="entry-title" style="font-weight: bold; margin: 4px 0; color: #2d3748;">
                ${entry.title || 'Sem Título'}
            </div>
            <div class="entry-snippet">${snippet}</div>
        `;
            item.onclick = () => onSelect(entry.id);
            list.appendChild(item);
        });
    }

    container.appendChild(list);
    return container;
}
