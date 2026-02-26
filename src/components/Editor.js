import { GoogleGenerativeAI } from "@google/generative-ai";

export function renderEditor({ entry, onSave, onDelete, onMenuToggle, onSettings, allEntries = [] }) {
    const container = document.createElement('div');
    container.className = 'editor-container';

    let state = entry ? { ...entry, images: entry.images || [] } : {
        id: Date.now().toString(), content: '', images: [], title: ''
    };

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'editor-header';
    header.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <button class="btn-mobile-menu" id="m-btn">☰</button>
            <div class="date-display" style="color:white;">
                ${new Date(parseInt(state.id)).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
        </div>
        <div class="editor-actions">
            ${entry ? `<button class="btn-danger" id="d-btn">Apagar</button>` : ''}
            <button class="btn-primary" id="s-btn">Save</button>
        </div>
    `;

    // --- Toolbar ---
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
        <button class="btn-tool" id="btn-img" title="Fotos">📷</button>
        <button class="btn-tool" id="btn-assist" title="Assistente Gemini">✨</button>
        <button class="btn-tool" id="btn-edit-log" title="Log">📝</button>
        <button class="btn-tool" id="btn-font">A</button>
        <button class="btn-tool" id="btn-bg">🖼️</button>
    `;

    const titleInput = document.createElement('input');
    titleInput.className = 'form-control';
    titleInput.placeholder = 'Título da Nota...';
    titleInput.value = state.title || '';
    titleInput.style.cssText = "text-align:center; font-size:2rem; background:transparent; border:none; border-bottom:1px solid var(--glass-border); color:white; margin:20px auto; width:90%; display:block;";

    const content = document.createElement('div');
    content.className = 'editor-content';
    content.contentEditable = true;
    content.innerHTML = state.content || '';

    container.append(header, toolbar, titleInput, content);

    // --- LÓGICA DO ASSISTENTE INTEGRADO ---
    toolbar.querySelector('#btn-assist').onclick = () => {
        const userKey = localStorage.getItem('user_gemini_key');

        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:4000; padding:20px; backdrop-filter:blur(8px);";

        const modal = document.createElement('div');
        modal.className = 'glass-panel';
        modal.style.cssText = "padding:30px; max-width:500px; width:100%; background:#1a202c; color:white; border-radius:24px; border: 1px solid rgba(255,255,255,0.1);";

        // PASSO 1: CONFIGURAR CHAVE
        if (!userKey) {
            modal.innerHTML = `
                <h3 style="margin-bottom:15px; text-align:center;">🚀 Ativar Assistente IA</h3>
                <p style="font-size:0.9rem; opacity:0.8; margin-bottom:20px; text-align:center;">Para começar, cole sua chave do Gemini abaixo.</p>
                <input type="text" id="key-input" class="form-control" style="margin-bottom:20px; background:rgba(255,255,255,0.05); color:white; border: 1px solid rgba(255,255,255,0.2);" placeholder="AIzaSy...">
                <div style="display:flex; justify-content:center; gap:10px;">
                    <button id="ai-close" class="btn-danger">Agora não</button>
                    <button id="save-key" class="btn-primary" style="background:#6366f1;">Salvar Chave</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            modal.querySelector('#save-key').onclick = () => {
                const key = modal.querySelector('#key-input').value.trim();
                if (key.length < 10) return alert("Por favor, insira uma chave válida.");

                localStorage.setItem('user_gemini_key', key);
                document.body.removeChild(overlay);
                alert("Configurado! Clique novamente no ✨");
            };
        }
        // PASSO 2: MENU DE USO
        else {
            modal.innerHTML = `
                <h3 style="margin-bottom:20px; text-align:center;">✨ Assistente Gemini</h3>
                <div style="display:grid; gap:15px;">
                    <button id="go-desabafo" style="padding:20px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; cursor:pointer; text-align:left;">
                        <strong>✍️ Desabafo Inteligente</strong><br>
                        <small style="opacity:0.6;">Organizar pensamentos em uma nota poética.</small>
                    </button>
                    <button id="go-relatorio" style="padding:20px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; cursor:pointer; text-align:left;">
                        <strong>📊 Relatório da Semana</strong><br>
                        <small style="opacity:0.6;">Analisar sentimentos dos últimos 7 dias.</small>
                    </button>
                    <button id="reset-key" style="background:none; border:none; color:rgba(255,255,255,0.3); font-size:0.7rem; cursor:pointer; margin-top:10px; text-decoration:underline;">Trocar chave de API</button>
                </div>
                <button id="ai-close" class="btn-danger" style="margin-top:20px; width:100%;">Fechar</button>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // --- LÓGICA DESABAFO ---
            modal.querySelector('#go-desabafo').onclick = () => {
                modal.innerHTML = `
                    <h3>✨ Desabafo Inteligente</h3>
                    <textarea id="ai-input" class="form-control" style="height:150px; margin:15px 0; background:rgba(0,0,0,0.2); color:white;" placeholder="Como foi seu dia?"></textarea>
                    <div style="display:flex; justify-content:flex-end; gap:10px;">
                        <button id="ai-back" class="btn-danger">Voltar</button>
                        <button id="ai-gen" class="btn-primary">Gerar Nota</button>
                    </div>
                `;

                modal.querySelector('#ai-gen').onclick = async () => {
                    const textInput = modal.querySelector('#ai-input').value.trim();
                    if (!textInput) return;

                    const genBtn = modal.querySelector('#ai-gen');
                    genBtn.innerText = "🪄 Processando...";
                    genBtn.disabled = true;

                    try {
                        const genAI = new GoogleGenerativeAI(userKey);
                        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                        const result = await model.generateContent(`Transforme este relato em uma entrada de diário poética e organizada em português: "${textInput}"`);
                        const response = await result.response;
                        const text = response.text();

                        content.innerHTML = text.replace(/\n/g, '<br>');
                        state.content = content.innerHTML;

                        // Título Automático
                        const tResult = await model.generateContent(`Crie um título curto de 3 palavras para esta nota: ${text}`);
                        titleInput.value = tResult.response.text().replace(/"/g, '').trim();

                        document.body.removeChild(overlay);
                    } catch (err) {
                        alert("Erro na chave ou conexão. Verifique se a chave está correta.");
                        genBtn.innerText = "Gerar Nota";
                        genBtn.disabled = false;
                    }
                };
                modal.querySelector('#ai-back').onclick = () => document.body.removeChild(overlay);
            };

            // --- LÓGICA RELATÓRIO ---
            modal.querySelector('#go-relatorio').onclick = async () => {
                modal.innerHTML = `<div style="padding:40px; text-align:center;">🪄 Analisando sua semana...</div>`;
                try {
                    const umaSemanaAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    const notasSemana = allEntries.filter(e => parseInt(e.id) > umaSemanaAtras);

                    if (notasSemana.length === 0) {
                        alert("Você não tem notas suficientes para um relatório.");
                        document.body.removeChild(overlay);
                        return;
                    }

                    const genAI = new GoogleGenerativeAI(userKey);
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    const prompt = `Analise o humor destas notas e faça um resumo carinhoso da semana: ${notasSemana.map(n => n.content).join(" | ")}`;

                    const result = await model.generateContent(prompt);
                    const report = result.response.text();

                    modal.innerHTML = `
                        <h3>📊 Relatório Semanal</h3>
                        <div style="max-height:300px; overflow-y:auto; margin:15px 0; font-size:0.9rem;">${report.replace(/\n/g, '<br>')}</div>
                        <div style="display:flex; gap:10px; justify-content:flex-end;">
                            <button id="rep-close" class="btn-danger">Fechar</button>
                            <button id="save-rep" class="btn-primary">Salvar Nota</button>
                        </div>
                    `;
                    modal.querySelector('#save-rep').onclick = () => {
                        onSave({ id: Date.now().toString(), title: "📊 Relatório Semanal", content: report.replace(/\n/g, '<br>'), images: [] });
                        document.body.removeChild(overlay);
                    };
                    modal.querySelector('#rep-close').onclick = () => document.body.removeChild(overlay);
                } catch (e) { alert("Erro ao gerar relatório."); document.body.removeChild(overlay); }
            };

            modal.querySelector('#reset-key').onclick = () => {
                if (confirm("Deseja remover sua chave?")) {
                    localStorage.removeItem('user_gemini_key');
                    document.body.removeChild(overlay);
                }
            };
        }
        modal.querySelector('#ai-close').onclick = () => document.body.removeChild(overlay);
    };

    // --- Eventos de Botões ---
    header.querySelector('#s-btn').onclick = () => {
        state.title = titleInput.value;
        state.content = content.innerHTML;
        onSave(state);
    };
    header.querySelector('#m-btn').onclick = onMenuToggle;
    if (entry) header.querySelector('#d-btn').onclick = () => onDelete(state.id);

    return container;
}