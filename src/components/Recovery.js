import { authService } from '../services/auth.js';

export function renderRecovery({ onBack, onRecovered }) {
    const container = document.createElement('div');
    container.className = 'glass-panel auth-container'; // Adicionado auth-container para pegar a animação de entrada

    // Estilos base mantendo a estrutura, mas com transições suaves
    Object.assign(container.style, {
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        textAlign: 'center',
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)'
    });

    // Detecta se estamos no passo 2 (vindo do e-mail)
    let step = window.location.hash.includes('access_token') || window.location.href.includes('type=recovery') ? 2 : 1;

    const render = () => {
        container.innerHTML = '';
        if (step === 1) renderEmailForm();
        else renderResetForm();
    };

    const renderEmailForm = () => {
        container.innerHTML = `
            <h1 style="margin-bottom: 10px;">Recuperação</h1>
            <p style="opacity: 0.8; margin-bottom: 10px;">Digite seu e-mail para receber o link de redefinição.</p>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 0.9rem;">E-mail</label>
                <input type="email" id="rec-email" class="form-control" placeholder="seu@email.com">
            </div>
            <button id="btn-rec-send" class="btn-primary" style="width: 100%; margin-top: 10px;">Enviar Link</button>
            <button id="btn-rec-back" style="background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; font-size: 0.8rem; margin-top: 10px; opacity: 0.7;">Voltar ao Login</button>
        `;

        container.querySelector('#btn-rec-send').onclick = async () => {
            const emailInput = container.querySelector('#rec-email').value.trim();
            if (!emailInput) { alert("Por favor, digite seu e-mail."); return; }

            try {
                await authService.sendRecoveryEmail(emailInput);
                alert("E-mail enviado! Verifique sua caixa de entrada (e o spam).");
            } catch (err) {
                alert("Erro ao enviar: " + err.message);
            }
        };

        container.querySelector('#btn-rec-back').onclick = onBack;
    };

    const renderResetForm = () => {
        container.innerHTML = `
            <h1 style="margin-bottom: 10px;">Nova Senha</h1>
            <p style="opacity: 0.8; margin-bottom: 10px;">Crie uma senha forte para sua conta.</p>
            <div style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 0.9rem;">Nova Senha</label>
                    <input type="password" id="rec-new-pass" class="form-control" placeholder="Mínimo 6 caracteres">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 0.9rem;">Confirmar Senha</label>
                    <input type="password" id="rec-confirm-pass" class="form-control" placeholder="Repita a nova senha">
                </div>
            </div>
            <button id="btn-rec-reset" class="btn-primary" style="width: 100%; margin-top: 15px;">Redefinir Senha</button>
        `;

        container.querySelector('#btn-rec-reset').onclick = async () => {
            const newPass = container.querySelector('#rec-new-pass').value;
            const confirmPass = container.querySelector('#rec-confirm-pass').value;

            if (newPass.length < 6) {
                alert("A senha deve ter pelo menos 6 caracteres.");
                return;
            }
            if (newPass !== confirmPass) {
                alert("As senhas não coincidem!");
                return;
            }

            try {
                // Chama a função que adicionamos no authService
                await authService.updatePassword(newPass);

                alert("Senha alterada com sucesso! Você será redirecionado.");

                // Limpa o token da URL para não tentar usar de novo
                window.history.replaceState(null, null, window.location.pathname);
                window.location.hash = '';

                onRecovered(); // Avisa o App.js que terminou
                setTimeout(() => window.location.reload(), 500);
            } catch (err) {
                console.error(err);
                alert("Ocorreu um erro ou o link expirou. Tente solicitar um novo e-mail.");
            }
        };
    };

    render();
    return container;
}