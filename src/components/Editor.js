import { GoogleGenerativeAI } from "@google/generative-ai";
import { dbService } from '../services/db.js';

console.log("Daily Diary Editor v1.4 - Mobile Alignment Fix");

export function renderEditor({ entry, onSave, onDelete, onMenuToggle, onSettings }) {
    const container = document.createElement('div');
    container.className = 'editor-container';

    // State for current edit
    let state = entry ? {
        ...entry,
        images: entry.images || []
    } : {
        id: Date.now().toString(),
        content: '',
        images: [],
        title: ''
    };

    // Header
    const header = document.createElement('div');
    header.className = 'editor-header';

    const leftGroup = document.createElement('div');
    leftGroup.style.display = 'flex';
    leftGroup.style.alignItems = 'center';
    leftGroup.style.gap = '10px';

    const menuBtn = document.createElement('button');
    menuBtn.textContent = '☰';
    menuBtn.className = 'btn-mobile-menu';
    menuBtn.onclick = onMenuToggle;

    const dateDisplay = document.createElement('div');
    dateDisplay.className = 'date-display';
    const date = entry ? new Date(parseInt(entry.id)) : new Date();
    dateDisplay.textContent = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    leftGroup.append(menuBtn, dateDisplay);
    header.appendChild(leftGroup);

    const actions = document.createElement('div');
    actions.className = 'editor-actions';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn-primary';
    saveBtn.onclick = async () => {
        await onSave(state);
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Salvo! ✅';
        setTimeout(() => saveBtn.textContent = originalText, 1500);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Apagar';
    deleteBtn.className = 'btn-danger';
    deleteBtn.style.display = entry ? 'inline-block' : 'none';
    deleteBtn.onclick = () => {
        if (confirm('Tem certeza que deseja apagar esta nota?')) {
            onDelete(state.id);
        }
    };

    actions.append(deleteBtn, saveBtn);
    header.append(actions);
    container.appendChild(header);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
        <button class="btn-tool" id="btn-img" title="Add Images">📷</button>
        <button class="btn-tool" id="btn-assist" title="Writing Assistant">✨</button>
        <button class="btn-tool" id="btn-edit-log" title="Add Update Mark">📝</button>
        <button class="btn-tool" id="btn-font" title="Change Font">A</button>
        <button class="btn-tool" id="btn-bg" title="Change Background">🖼️</button>
    `;
    container.appendChild(toolbar);

    // Image Input
    const imgInput = document.createElement('input');
    imgInput.type = 'file';
    imgInput.accept = 'image/*';
    imgInput.multiple = true;
    imgInput.style.display = 'none';
    imgInput.onchange = (e) => handleImageUpload(e.target.files);
    container.appendChild(imgInput);

    toolbar.querySelector('#btn-img').onclick = () => imgInput.click();

    // Image Gallery
    const gallery = document.createElement('div');
    gallery.className = 'editor-gallery';
    gallery.style.display = 'flex';
    gallery.style.gap = '10px';
    gallery.style.padding = '10px 20px';
    gallery.style.flexWrap = 'wrap';
    container.appendChild(gallery);

    const renderGallery = () => {
        gallery.innerHTML = '';
        const images = Array.isArray(state.images) ? state.images : [];
        images.forEach((imgSrc, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.className = 'btn-danger';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '-5px';
            removeBtn.style.right = '-5px';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.padding = '0';
            removeBtn.onclick = () => {
                state.images.splice(index, 1);
                renderGallery();
            };
            imgContainer.append(img, removeBtn);
            gallery.appendChild(imgContainer);
        });
    };
    renderGallery();

    // Title Area
    const titleInput = document.createElement('input');
    titleInput.className = 'form-control';
    titleInput.placeholder = 'Título da Nota...';
    titleInput.value = state.title || '';
    titleInput.style.margin = '0 20px 10px 20px';
    titleInput.style.width = 'calc(100% - 40px)';
    titleInput.style.fontSize = '1.5rem';
    titleInput.style.fontWeight = 'bold';
    titleInput.style.background = 'transparent';
    titleInput.style.border = 'none';
    titleInput.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
    titleInput.oninput = (e) => { state.title = e.target.value; };
    container.appendChild(titleInput);

    // Content Area
    const content = document.createElement('div');
    content.className = 'editor-content';
    content.contentEditable = true;
    content.innerHTML = state.content || '';

    if (!state.content) {
        content.classList.add('empty');
        content.dataset.placeholder = "Querida Beatriz... (Clique no ✨ para ideias!)";
    }

    content.oninput = () => {
        state.content = content.innerHTML;
        content.classList.remove('empty'); // Force remove placeholder as soon as user types
    };
    content.onfocus = () => {
        content.classList.remove('empty');
    };
    content.onblur = () => { if (!content.innerText.trim()) content.classList.add('empty'); };

    container.appendChild(content);

    // AI Assistant Modal (Defined AFTER content for safety)
    const showAssistantModal = async () => {
        const overlay = document.createElement('div');
        overlay.className = 'assistant-overlay';

        const modal = document.createElement('div');
        modal.className = 'assistant-modal glass-panel';

        const body = document.createElement('div');
        body.className = 'assistant-body';

        const title = document.createElement('h3');
        title.textContent = '✨ Assistente de IA';

        const desc = document.createElement('p');
        desc.textContent = 'Transformando seu texto com IA Global...';
        desc.style.fontSize = '0.9rem';

        const resultArea = document.createElement('div');
        resultArea.className = 'assistant-card';
        resultArea.contentEditable = true;
        resultArea.innerHTML = '<div style="text-align:center; padding: 20px;">🪄 Gerando mágica...</div>';

        const getGeminiResponse = async (raw) => {
            if (!raw || raw.trim().length < 2) return "Escreva um pouco mais primeiro! 😉";
            try {
                const response = await fetch('/api/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: raw })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro no servidor');
                }
                const data = await response.json();
                return data.text;
            } catch (err) {
                console.error("AI Error:", err);
                return `❌ Indisponível: ${err.message}`;
            }
        };

        const currentDraft = content.innerText || "";

        const footer = document.createElement('div');
        footer.className = 'assistant-footer';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Descartar';
        closeBtn.className = 'btn-danger';
        closeBtn.onclick = () => document.body.removeChild(overlay);

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Usar esta versão ✅';
        applyBtn.className = 'btn-primary';
        applyBtn.onclick = () => {
            content.innerHTML = resultArea.innerHTML;
            state.content = resultArea.innerHTML;
            document.body.removeChild(overlay);
        };

        body.append(title, desc, resultArea);
        footer.append(closeBtn, applyBtn);
        modal.append(body, footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const aiResponse = await getGeminiResponse(currentDraft);
        resultArea.innerHTML = aiResponse;
    };

    toolbar.querySelector('#btn-assist').onclick = showAssistantModal;

    toolbar.querySelector('#btn-edit-log').onclick = () => {
        const now = new Date();
        const mark = `<div contenteditable="false" style="border-left: 4px solid #667eea; background: rgba(102, 126, 234, 0.1); padding: 5px 10px; margin: 10px 0; border-radius: 0 4px 4px 0; font-size: 0.8rem; user-select: none;"><strong>📝 ATUALIZAÇÃO [${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]</strong></div><br>`;
        content.focus();
        document.execCommand('insertHTML', false, mark);
        state.content = content.innerHTML;
    };

    toolbar.querySelector('#btn-font').onclick = onSettings;
    toolbar.querySelector('#btn-bg').onclick = onSettings;

    // Helpers
    const handleImageUpload = (files) => {
        if (state.images.length + files.length > 10) {
            alert('Máximo de 10 imagens.');
            return;
        }
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                state.images.push(e.target.result);
                renderGallery();
            };
            reader.readAsDataURL(file);
        });
    };

    return container;
}
