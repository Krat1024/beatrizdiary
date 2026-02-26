import { authService } from '../services/auth.js';

export function renderLogin({ onLoginSuccess, onForgotPassword, onSwitchToRegister }) {
    // Wrapper para garantir que o rodapé e o card se respeitem
    const wrapper = document.createElement('div');
    wrapper.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; width:100%;";

    const container = document.createElement('div');
    container.className = 'glass-panel auth-container';
    // auth-container já tem o max-width: 360px no seu CSS

    let loginData = { email: '', password: '' };

    const renderLoginForm = () => {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; display:flex; flex-direction:column; gap:20px;">
                <h1 style="color:black;">Login</h1>
                <div style="text-align: left;">
                    <label style="color:black; font-weight:bold; font-size:0.8rem;">E-MAIL</label>
                    <input type="email" id="l-email" placeholder="seu@email.com" class="form-control">
                </div>
                <div style="text-align: left;">
                    <label style="color:black; font-weight:bold; font-size:0.8rem;">SENHA</label>
                    <input type="password" id="l-pass" placeholder="Sua senha" class="form-control">
                </div>
                <button id="btn-login" class="btn-primary">Acessar Diário</button>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <button id="btn-forgot" style="background:none; border:none; color:black; cursor:pointer; font-size:0.8rem; text-decoration:underline;">Esqueci minha senha</button>
                    <button id="btn-reg" style="background:none; border:none; color:black; cursor:pointer; font-size:0.8rem; text-decoration:underline;">Criar Conta</button>
                </div>
            </div>
        `;

        container.querySelector('#btn-login').onclick = async () => {
            const email = container.querySelector('#l-email').value;
            const pass = container.querySelector('#l-pass').value;
            try {
                await authService.login(email, pass);
                onLoginSuccess();
            } catch (err) { alert(err.message); }
        };

        container.querySelector('#btn-forgot').onclick = onForgotPassword;
        container.querySelector('#btn-reg').onclick = onSwitchToRegister;
    };

    renderLoginForm();

    // Rodapé (Social Footer)
    const footer = document.createElement('div');
    footer.className = 'social-footer';
    footer.innerHTML = `
        Desenvolvido por Krat1024
        <div class="social-links">
            <a href="#">in 𝕏</a>
        </div>
    `;

    wrapper.append(container, footer);
    return wrapper;
}