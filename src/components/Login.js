import { authService } from '../services/auth.js';

export function renderLogin({ onLoginSuccess, onForgotPassword, onSwitchToRegister }) {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    document.body.classList.add('login-container');
    container.style.maxWidth = '400px';
    container.style.padding = '40px';
    container.style.textAlign = 'center';
    container.style.margin = 'auto';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '20px';

    let show2FA = false;
    let loginData = { email: '', password: '' };

    const render = () => {
        container.innerHTML = '';
        if (show2FA) {
            render2FA();
        } else {
            renderLoginForm();
        }
    };

    const render2FA = () => {
        container.innerHTML = `
            <h1>Verificação</h1>
            <p>Insira o código enviado para o seu dispositivo.</p>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Código 2FA</label>
                <input type="text" id="mfa-code" placeholder="123456" class="form-control">
            </div>
            <button id="btn-verify" class="btn-primary" style="margin-top: 10px;">Verificar e Entrar</button>
            <button id="btn-back" style="background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; font-size: 0.8rem; margin-top: 10px;">Voltar para o Login</button>
        `;

        container.querySelector('#btn-verify').onclick = async () => {
            const code = container.querySelector('#mfa-code').value;
            try {
                await authService.verify2FA(code);
                onLoginSuccess();
            } catch (err) {
                alert(err.message);
            }
        };

        container.querySelector('#btn-back').onclick = () => {
            show2FA = false;
            render();
        };
    };

    const renderLoginForm = () => {
        container.innerHTML = `
            <h1>Entrar</h1>
            <p>Seja bem-vindo de volta ao seu diário.</p>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">E-mail</label>
                <input type="email" id="login-email" placeholder="seu@email.com" value="${loginData.email}" class="form-control">
            </div>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Senha</label>
                <input type="password" id="login-pass" placeholder="Sua senha" value="${loginData.password}" class="form-control">
            </div>
            <button id="btn-login" class="btn-primary" style="margin-top: 10px;">Acessar Diário</button>
            <button id="btn-forgot" style="background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; font-size: 0.8rem; margin-top: 10px;">Esqueci minha senha</button>
            <button id="btn-switch-reg" style="background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; font-size: 0.8rem; margin-top: 5px;">Não tenho conta (Criar Diário)</button>
        `;

        container.querySelector('#btn-login').onclick = async () => {
            loginData.email = container.querySelector('#login-email').value.trim();
            loginData.password = container.querySelector('#login-pass').value;

            try {
                const res = await authService.login(loginData.email, loginData.password);
                if (res.requires2FA) {
                    show2FA = true;
                    render();
                } else {
                    onLoginSuccess();
                }
            } catch (err) {
                alert(err.message);
            }
        };

        container.querySelector('#btn-forgot').onclick = onForgotPassword;
        container.querySelector('#btn-switch-reg').onclick = onSwitchToRegister;
    };

    renderLoginForm();
    return container;
}
