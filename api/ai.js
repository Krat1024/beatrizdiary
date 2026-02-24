import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Configuração de CORS para permitir chamadas do seu site
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Configuração Incompleta: GEMINI_API_KEY não encontrada no painel da Vercel.' });
    }

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Tentar o modelo Flash primeiro (mais rápido/barato)
        // Se falhar (404), tentamos o modelo Pro como fallback
        const tryGeneration = async (modelName) => {
            const model = genAI.getGenerativeModel({
                model: modelName,
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                ]
            });

            const finalPrompt = prompt || `Reescreva o seguinte texto de diário para torná-lo mais descontraído, amigável e expressivo (use emojis). Mantenha a essência do que foi escrito. Não responda como um chat, apenas retorne o texto reescrito. Texto original: "${text}"`;

            const result = await model.generateContent(finalPrompt);
            const response = await result.response;

            // Verificar se houve bloqueio por segurança
            if (response.promptFeedback?.blockReason) {
                // Throw an error that can be caught by the outer try-catch
                throw new Error(`⚠️ IA Bloqueada: O conteúdo foi considerado sensível pela política do Google (${response.promptFeedback.blockReason}). Tente escrever de outra forma.`);
            }

            return response.text().trim();
        };

        let output;
        try {
            output = await tryGeneration("gemini-1.5-flash-latest");
        } catch (err) {
            console.warn("Flash model failed, trying Pro fallback...", err.message);
            if (err.message.includes('404') || err.message.includes('not found')) {
                output = await tryGeneration("gemini-pro");
            } else {
                throw err; // Re-throw if it's not a 404 or not found error
            }
        }

        return res.status(200).json({ text: output });
    } catch (error) {
        console.error("Gemini Final Error:", error);
        let msg = error.message || 'Erro ao gerar conteúdo';
        if (msg.includes('404')) msg = "Modelo de IA não encontrado. Verifique se seu plano do Google AI suporta o modelo Flash.";
        if (msg.includes('API key not valid')) msg = 'Chave de API inválida no painel da Vercel.';
        if (msg.includes('quota')) msg = 'Limite de uso gratuito atingido. Tente novamente mais tarde.';
        return res.status(500).json({ error: msg });
    }
}
