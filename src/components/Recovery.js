import { authService } from '../services/auth.js';
import { dbService } from '../services/db.js';

export function renderRecovery({ onBack, onRecovered }) {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    container.style.padding = '40px';
    container.style.textAlign = 'center';
    container.style.margin = 'auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '20px';

    let step = 1; // 1: Email, 2: Reset
    let recoveryEmail = '';

    const render = () => {
        container.innerHTML = '';
        if (step === 1) renderEmailForm();
        else renderResetForm();
    };

    const renderEmailForm = () => {
        container.innerHTML = `
            <h1>Recuperação</h1>
            <p>Esqueceu sua senha? Digite seu e-mail para receber as instruções.</p>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">E-mail</label>
                <input type="email" id="rec-email" placeholder="seu@email.com" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: inherit;">
            </div>
            <button id="btn-rec-send" class="btn-primary" style="margin-top: 10px;">Enviar Link</button>
            <button id="btn-rec-back" style="background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; font-size: 0.8rem;">Voltar</button>
        `;

        container.querySelector('#btn-rec-send').onclick = async () => {
            recoveryEmail = container.querySelector('#rec-email').value.trim();
            try {
                await authService.sendRecoveryEmail(recoveryEmail);
                step = 2;
                render();
            } catch (err) {
                alert(err.message);
            }
        };

        container.querySelector('#btn-rec-back').onclick = onBack;
    };

    const renderResetForm = () => {
        container.innerHTML = `
            <h1>Nova Senha</h1>
            <p>Defina sua nova senha para <strong>${recoveryEmail}</strong></p>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nova Senha</label>
                <input type="password" id="rec-new-pass" placeholder="Mínimo 6 caracteres" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: inherit;">
            </div>
            <button id="btn-rec-reset" class="btn-primary" style="margin-top: 10px;">Redefinir Senha</button>
        `;

        container.querySelector('#btn-rec-reset').onclick = async () => {
            const newPass = container.querySelector('#rec-new-pass').value;
            if (newPass.length < 6) {
                alert("A senha deve ter pelo menos 6 caracteres.");
                return;
            }

            const user = await dbService.getUserProfile();
            user.password = newPass;
            await dbService.saveUserProfile(user);

            alert("Senha redefinida com sucesso! Agora você pode entrar.");
            onRecovered();
        };
    };

    render();
    return container;
}
