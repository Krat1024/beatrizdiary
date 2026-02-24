import { authService } from '../services/auth.js';

export function renderRegistration({ onComplete, onSwitchToLogin }) {
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

    let currentStep = 1;
    let userData = {
        name: '',
        email: '',
        password: '',
        isVerified: false,
        twoFactorEnabled: false
    };

    const renderStep = () => {
        container.innerHTML = '';

        if (currentStep === 1) {
            renderStep1();
        } else if (currentStep === 2) {
            renderStep2();
        } else if (currentStep === 3) {
            renderStep3();
        } else if (currentStep === 4) {
            renderStep4();
        }
    };

    // STEP 1: Name & Email
    const renderStep1 = () => {
        container.innerHTML = `
            <h1>Bem-vindo</h1>
            <p>Crie seu perfil para começar o diário.</p>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nome</label>
                <input type="text" id="reg-name" placeholder="Seu Nome" value="${userData.name}" class="form-control">
            </div>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">E-mail</label>
                <input type="email" id="reg-email" placeholder="seu@email.com" value="${userData.email}" class="form-control">
            </div>
            <button id="btn-next" class="btn-primary" style="margin-top: 10px;">Continuar</button>
            <button id="btn-switch-login" style="background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; font-size: 0.8rem; margin-top: 10px;">Já tenho uma conta</button>
        `;

        container.querySelector('#btn-switch-login').onclick = onSwitchToLogin;

        container.querySelector('#btn-next').onclick = () => {
            userData.name = container.querySelector('#reg-name').value.trim();
            userData.email = container.querySelector('#reg-email').value.trim();

            if (!userData.name || !userData.email) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            currentStep = 3; // Pula direto para a senha
            renderStep();
        };
    };

    // STEP 3: Password Creation
    const renderStep3 = () => {
        container.innerHTML = `
            <h1>Segurança</h1>
            <p>Escolha uma senha para proteger seu diário.</p>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Senha</label>
                <input type="password" id="reg-pass" placeholder="Mínimo 6 caracteres" class="form-control">
            </div>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Confirmar Senha</label>
                <input type="password" id="reg-pass-conf" placeholder="Repita a senha" class="form-control">
            </div>
            <button id="btn-pass" class="btn-primary" style="margin-top: 10px;">Definir Senha</button>
        `;

        container.querySelector('#btn-pass').onclick = async () => {
            const pass = container.querySelector('#reg-pass').value;
            const conf = container.querySelector('#reg-pass-conf').value;

            if (pass.length < 6) {
                alert("A senha deve ter pelo menos 6 caracteres.");
                return;
            }
            if (pass !== conf) {
                alert("As senhas não coincidem.");
                return;
            }

            userData.password = pass;

            try {
                await authService.register(userData.name, userData.email, userData.password);
                alert("Conta criada com sucesso! Bem-vindo ao seu diário.");
                onComplete(userData);
            } catch (err) {
                alert("Erro ao criar conta: " + err.message);
            }
        };
    };

    renderStep();
    return container;
}
