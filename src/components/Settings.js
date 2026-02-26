import { dbService } from '../services/db.js';
import { authService } from '../services/auth.js';

const FONTS = [
    'Inter', 'Roboto', 'Lato', 'Montserrat', 'Open Sans',
    'Poppins', 'Playfair Display', 'Merriweather', 'Nunito', 'Raleway',
    'Ubuntu', 'Oswald', 'Quicksand', 'Inconsolata', 'Dosis',
    'Anton', 'Lobster', 'Pacifico', 'Dancing Script', 'Caveat'
];

const WALLPAPERS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Default
    'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(to top, #0ba360 0%, #3cba92 100%)',
    'linear-gradient(to top, #5f72bd 0%, #9b23ea 100%)',
    'linear-gradient(to right, #b8cbb8 0%, #b8cbb8 0%, #b465da 0%, #cf6cc9 33%, #ee609c 66%, #ee609c 100%)',
    'linear-gradient(to right, #f83600 0%, #f9d423 100%)',
    'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // Light
    'linear-gradient(to top, #09203f 0%, #537895 100%)', // Dark
    'linear-gradient(to right, #243949 0%, #517fa4 100%)',
    'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
    'linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)',
    'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)',
    'linear-gradient(to right, #fa709a 0%, #fee140 100%)'
];

export function renderSettings({ onClose }) {
    const container = document.createElement('div');
    container.className = 'settings-container p-20';
    container.style.padding = '20px';
    container.style.overflowY = 'auto';
    container.style.height = '100%';

    container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2>Configurações</h2>
        <button id="btn-close-settings" class="btn-icon">✕</button>
    </div>

    <div class="settings-section">
        <h3>Modo Noturno</h3>
        <p style="font-size: 0.8rem; margin-bottom: 10px; opacity: 0.8;">Ative para ler e escrever no escuro 🌙</p>
        <label class="switch">
            <input type="checkbox" id="dark-mode-toggle">
            <span class="slider round"></span>
        </label>
    </div>
    
    <div class="settings-section">
        <h3>Perfil</h3>
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Seu Nome</label>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <input type="text" id="profile-name" class="form-control" style="flex: 1;">
            <button id="btn-save-profile" class="btn-primary">Salvar</button>
        </div>
    </div>

    <div class="settings-section">
        <h3>Font</h3>
        <select id="font-select" class="form-control" style="width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ccc;">
            ${FONTS.map(font => `<option value="${font}" style="font-family: '${font}'">${font}</option>`).join('')}
        </select>
    </div>

    <div class="settings-section">
        <h3>Wallpaper</h3>
        <div class="wallpaper-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 10px; margin-bottom: 20px;">
            ${WALLPAPERS.map((wp, i) => `
                <div class="wallpaper-item" data-bg="${wp}" style="background: ${wp}; height: 60px; border-radius: 8px; cursor: pointer; border: 2px solid transparent;"></div>
            `).join('')}
        </div>
        
        <h4>Custom Wallpaper</h4>
        <input type="file" id="custom-bg-input" accept="image/*" style="width: 100%;">
    </div>

    <div class="settings-section" style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
        <h3>Segurança</h3>
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
            <div style="text-align: left;">
                <div style="font-weight: bold;">Autenticação de 2 Fatores (2FA)</div>
                <div style="font-size: 0.8rem; opacity: 0.7;">Exigir código extra ao entrar</div>
            </div>
            <input type="checkbox" id="tfa-toggle" style="width: 20px; height: 20px; cursor: pointer;">
        </div>
        <div id="qrcode-container" style="display: none; text-align: center; background: white; padding: 15px; border-radius: 12px; margin-bottom: 15px; color: #333;">
        <p style="font-size: 0.8rem; margin-bottom: 10px; font-weight: bold;">Escaneie com o Google Authenticator:</p>
        <img id="qrcode-img" src="" style="width: 150px; height: 150px; display: block; margin: 0 auto; border: 1px solid #ddd;">
        <p style="font-size: 0.7rem; margin-top: 8px; opacity: 0.8;">Chave manual: <code id="secret-text" style="background: #eee; padding: 2px 5px; border-radius: 4px;"></code></p>
    </div>
        
        <button id="btn-logout-all" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ff4b2b; background: rgba(255,75,43,0.1); color: #ff4b2b; cursor: pointer; font-weight: bold; transition: 0.3s;">
             Sair de todos os dispositivos
        </button>
        <p style="font-size: 0.75rem; opacity: 0.5; margin-top: 8px;">Isso encerrará sua sessão em qualquer outro celular ou computador.</p>
    </div>

    </div>
  `;

    // Handlers
    const nameInput = container.querySelector('#profile-name');
    const saveProfileBtn = container.querySelector('#btn-save-profile');

    dbService.getUserProfile().then(user => {
        if (user && user.name) nameInput.value = user.name;
    });

    saveProfileBtn.onclick = async () => {
        const newName = nameInput.value.trim();
        if (!newName) return alert("Por favor, insira um nome.");

        const user = await dbService.getUserProfile();
        if (user) {
            user.name = newName;
            await dbService.saveUserProfile(user);
            alert("Nome atualizado com sucesso!");
        }
    };

    const fontSelect = container.querySelector('#font-select');
    fontSelect.onchange = (e) => {
        applySettings({ font: e.target.value });
        saveSettings(e.target.value, null);
    };

    const wpItems = Array.from(container.querySelectorAll('.wallpaper-item'));
    wpItems.forEach(item => {
        item.onclick = () => {
            const bg = item.dataset.bg;
            applySettings({ bg });
            saveSettings(null, bg);
        };
    });

    const customInput = container.querySelector('#custom-bg-input');
    customInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const result = evt.target.result; // Base64
                const bg = `url(${result})`;
                applySettings({ bg });
                saveSettings(null, bg);
            };
            reader.readAsDataURL(file);
        }
    };

    // Theme Toggle Handler
    const darkModeToggle = container.querySelector('#dark-mode-toggle');
    dbService.getSettings().then(settings => {
        if (settings) {
            darkModeToggle.checked = !!settings.isDarkMode;
        }
    });

    darkModeToggle.onchange = async (e) => {
        const isDark = e.target.checked;
        await saveSettings(null, null, isDark);
        document.body.classList.toggle('dark-theme', isDark);
    };

    const tfaToggle = container.querySelector('#tfa-toggle');

    dbService.getUserProfile().then(user => {
        if (user) tfaToggle.checked = !!user.twoFactorEnabled;
    });

    tfaToggle.onchange = async (e) => {
        const enabled = e.target.checked;
        const qrContainer = container.querySelector('#qrcode-container');
        const qrImg = container.querySelector('#qrcode-img');
        const secretText = container.querySelector('#secret-text');

        if (enabled) {
            try {
                const user = await dbService.getUserProfile();
                const { setup2FA } = await import('../../api/2fa.js');
                const resultado = await setup2FA(user.email || 'usuario@daily.diary');

                if (qrImg) qrImg.src = resultado.qrCodeUrl;
                if (secretText) secretText.innerText = resultado.secret;
                if (qrContainer) qrContainer.style.display = 'block';

                user.twoFactorSecret = resultado.secret;
                user.twoFactorEnabled = true;
                await dbService.saveUserProfile(user);

            } catch (err) {
                console.error("Erro ao ativar 2FA:", err);
                alert("Erro ao carregar o QR Code.");
                e.target.checked = false;
            }
        } else {
            if (qrContainer) qrContainer.style.display = 'none';
            const user = await dbService.getUserProfile();
            if (user) {
                user.twoFactorEnabled = false;
                user.twoFactorSecret = null;
                await dbService.saveUserProfile(user);
            }
        }
    };
    // Logout All Handler
    container.querySelector('#btn-logout-all').onclick = async () => {
        if (confirm("Tem certeza que deseja sair de todos os outros dispositivos?")) {
            try {
                await authService.logoutFromAllDevices();
                alert("Sessões remotas encerradas com sucesso!");
                window.location.reload();
            } catch (err) {
                alert("Erro ao encerrar sessões: " + err.message);
            }
        }
    };

    container.querySelector('#btn-close-settings').onclick = onClose;
    return container;
}

function applySettings({ font, bg }) {
    if (font) document.body.style.setProperty('--font-family', `"${font}", sans-serif`);
    if (bg) document.body.style.setProperty('--bg-image', bg);
}

async function saveSettings(font, bg, isDark) {
    const current = await dbService.getSettings() || {};
    const newSettings = {
        ...current,
        font: font !== null ? font : (current.font || 'Inter'),
        wallpaper: bg !== null ? bg : (current.wallpaper || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
        isDarkMode: isDark !== undefined ? isDark : current.isDarkMode
    };
    await dbService.saveSettings(newSettings);
}
