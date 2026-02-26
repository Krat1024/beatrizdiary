import { dbService } from './services/db.js';
import { authService } from './services/auth.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderEditor } from './components/Editor.js';
import { renderSettings } from './components/Settings.js';
import { renderRegistration } from './components/Registration.js';
import { renderLogin } from './components/Login.js';
import { renderRecovery } from './components/Recovery.js';

export async function renderApp() {
    const app = document.querySelector('#app');
    const hash = window.location.hash;

    // 1. LIMPEZA DE URL PARA CELULAR (Impede loops de redirecionamento)
    if (hash.includes('access_token') || hash.includes('type=recovery')) {
        // Se estivermos processando a recuperação, mostramos ela primeiro
        app.innerHTML = '';
        const recoveryContainer = renderRecovery({
            onBack: () => {
                window.location.hash = '';
                renderApp();
            },
            onRecovered: () => {
                window.location.hash = '';
                // Limpa a URL do navegador mobile sem dar refresh pesado
                window.history.replaceState(null, null, window.location.pathname);
                renderApp();
            }
        });

        const authWrapper = document.createElement('div');
        authWrapper.className = 'auth-container';
        authWrapper.appendChild(recoveryContainer);
        app.appendChild(authWrapper);
        return;
    }

    // 2. VERIFICAÇÃO DE SESSÃO
    const user = await dbService.getUserProfile();
    const isSessionActive = sessionStorage.getItem('diary-auth-session') === 'active';

    let viewState = 'loading';
    if (user && isSessionActive) {
        viewState = 'main';
    } else if (!user) {
        viewState = 'register';
    } else {
        viewState = 'login';
    }

    const renderSocialFooter = () => {
        const footer = document.createElement('footer');
        footer.className = 'social-footer';
        footer.innerHTML = `
            <span>Desenvolvido por Krat1024</span>
            <div class="social-links">
                <a href="https://www.linkedin.com/in/jonatas-junqueira-fernandes-83546238/" target="_blank" title="LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.676 0 7.225 0 7.225h2.4z"/></svg>
                </a>
                <a href="https://x.com/John1349" target="_blank" title="Twitter">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.055-4.425 5.055H.316l5.733-6.551L0 .75h5.063l3.495 4.633L12.6.75zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633z"/></svg>
                </a>
            </div>
        `;
        return footer;
    };

    const updateView = async () => {
        app.innerHTML = '';
        if (viewState === 'register' || viewState === 'login' || viewState === 'recovery') {
            const authContainer = document.createElement('div');
            authContainer.className = 'auth-container';

            if (viewState === 'register') {
                authContainer.appendChild(renderRegistration({
                    onComplete: async (profile) => {
                        await dbService.saveUserProfile(profile);
                        sessionStorage.setItem('diary-auth-session', 'active');
                        renderApp();
                    },
                    onSwitchToLogin: () => { viewState = 'login'; updateView(); }
                }));
            } else if (viewState === 'recovery') {
                authContainer.appendChild(renderRecovery({
                    onBack: () => { viewState = 'login'; updateView(); },
                    onRecovered: () => {
                        window.location.hash = '';
                        viewState = 'login';
                        updateView();
                    }
                }));
            } else {
                authContainer.appendChild(renderLogin({
                    onLoginSuccess: () => {
                        sessionStorage.setItem('diary-auth-session', 'active');
                        renderApp();
                    },
                    onForgotPassword: () => { viewState = 'recovery'; updateView(); },
                    onSwitchToRegister: () => { viewState = 'register'; updateView(); }
                }));
            }
            authContainer.appendChild(renderSocialFooter());
            app.appendChild(authContainer);
            return;
        }

        // TELA PRINCIPAL (DENTRO DO DIÁRIO)
        app.innerHTML = `<aside id="sidebar" class="glass-panel"></aside><main id="main-content" class="glass-panel"></main>`;
        const sidebar = document.querySelector('#sidebar');
        const mainContent = document.querySelector('#main-content');

        let entries = await dbService.getEntries();
        let currentEntryId = entries[0]?.id || null;
        let showSettings = false;
        let mobileMenuOpen = false;

        const settings = await dbService.getSettings();
        if (settings) {
            if (settings.font) document.body.style.setProperty('--font-family', `"${settings.font}", sans-serif`);
            if (settings.wallpaper) document.body.style.setProperty('--bg-image', settings.wallpaper);
            if (settings.isDarkMode) document.body.classList.add('dark-theme');
            else document.body.classList.remove('dark-theme');
        }

        async function renderDiary() {
            sidebar.innerHTML = '';
            sidebar.className = `glass-panel ${mobileMenuOpen ? 'mobile-open' : ''}`;
            sidebar.appendChild(renderSidebar({
                entries, currentEntryId, user,
                onSelect: (id) => { currentEntryId = id; showSettings = false; mobileMenuOpen = false; renderDiary(); },
                onNew: async () => {
                    const newEntry = await dbService.saveEntry({ content: '', title: '' });
                    entries.unshift(newEntry);
                    currentEntryId = newEntry.id;
                    showSettings = false;
                    mobileMenuOpen = false;
                    renderDiary();
                },
                onSettings: () => { showSettings = true; mobileMenuOpen = false; renderDiary(); },
                onLogout: async () => {
                    await authService.logout();
                    sessionStorage.removeItem('diary-auth-session');
                    window.location.reload();
                },
                onCloseMobile: () => { mobileMenuOpen = false; renderDiary(); }
            }));

            mainContent.innerHTML = '';
            if (showSettings) {
                mainContent.appendChild(renderSettings({
                    onClose: async () => {
                        const updatedUser = await dbService.getUserProfile();
                        if (updatedUser) user.name = updatedUser.name;
                        showSettings = false;
                        renderDiary();
                    }
                }));
            } else {
                const entry = entries.find(e => e.id === currentEntryId);
                mainContent.appendChild(renderEditor({
                    entry,
                    onSave: async (state) => {
                        const updated = await dbService.saveEntry(state);
                        const idx = entries.findIndex(e => e.id === updated.id);
                        if (idx !== -1) entries[idx] = updated;
                        renderDiary();
                    },
                    onDelete: async (id) => {
                        await dbService.deleteEntry(id);
                        entries = entries.filter(e => e.id !== id);
                        if (currentEntryId === id) currentEntryId = entries[0]?.id;
                        renderDiary();
                    },
                    onMenuToggle: () => { mobileMenuOpen = !mobileMenuOpen; renderDiary(); },
                    onSettings: () => { showSettings = true; mobileMenuOpen = false; renderDiary(); }
                }));
            }
        }
        renderDiary();
    };

    updateView();
}