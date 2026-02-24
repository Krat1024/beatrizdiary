import { openDB } from 'idb';
import { supabase } from './supabase.js';

const DB_NAME = 'daily-diary';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        db.createObjectStore('entries', { keyPath: 'id' });
        db.createObjectStore('user', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'id' });
    },
});

export const dbService = {
    // --- USER PROFILE & SETTINGS ---
    async getUserProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return {
            ...user,
            ...profile,
            twoFactorEnabled: profile?.two_factor_enabled // Normalize for the UI
        };
    },

    async saveUserProfile(profileData) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("Sessão expirada. Faça login novamente.");

        const db = await dbPromise;

        // Save locally
        await db.put('user', { id: 'current', ...profileData });

        // Save to Supabase
        console.log("Sincronizando perfil para o ID:", user.id);
        const { error } = await supabase.from('profiles').upsert({
            id: user.id, // Usar o ID da sessão atual para garantir permissão RLS
            name: profileData.name,
            two_factor_enabled: !!profileData.twoFactorEnabled
        }, { onConflict: 'id' });

        if (error) {
            console.error("Erro ao sincronizar perfil:", error);
            alert(`Erro ao salvar perfil (Código ${error.code}): ${error.message}\n\nTente rodar o comando SQL de correção de permissões.`);
        } else {
            console.log("Perfil sincronizado.");
        }
    },

    async getSettings() {
        const { data: { user } } = await supabase.auth.getUser();
        const db = await dbPromise;
        let local = await db.get('settings', 'current');

        if (user) {
            const { data: remote } = await supabase
                .from('settings')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (remote) {
                local = {
                    ...local,
                    ...remote,
                    geminiKey: remote.gemini_key || local?.geminiKey,
                    isDarkMode: remote.is_dark_mode !== undefined ? remote.is_dark_mode : local?.isDarkMode
                };
                await db.put('settings', { id: 'current', ...local });
            }
        }
        return local;
    },

    async saveSettings(settings) {
        const { data: { user } } = await supabase.auth.getUser();
        const db = await dbPromise;
        await db.put('settings', { id: 'current', ...settings });

        if (user) {
            console.log("Sincronizando configurações na nuvem...");
            const { error } = await supabase.from('settings').upsert({
                user_id: user.id,
                font: settings.font,
                wallpaper: settings.wallpaper,
                gemini_key: settings.geminiKey,
                is_dark_mode: settings.isDarkMode
            });

            if (error) {
                console.error("Erro ao sincronizar configurações:", error);
                if (error.message.includes('column "gemini_key"')) {
                    alert("⚠️ O BANCO DE DADOS NÃO ESTÁ PRONTO!\n\nVocê esqueceu de rodar o comando SQL no Supabase.\n\nCopie e rode no SQL Editor:\nALTER TABLE settings ADD COLUMN gemini_key TEXT;");
                }
            } else {
                console.log("Configurações sincronizadas com sucesso.");
            }
        }
    },

    // --- DIARY ENTRIES ---
    async getEntries() {
        const { data: { user } } = await supabase.auth.getUser();
        const db = await dbPromise;
        const localEntries = await db.getAll('entries');

        // Normalize local entries
        let entries = (localEntries || []).map(e => ({
            ...e,
            title: e.title || '',
            images: Array.isArray(e.images) ? e.images : []
        }));

        if (user) {
            const { data: remoteEntries, error } = await supabase
                .from('entries')
                .select('*')
                .order('id', { ascending: false }); // Note: RLS handles user_id filter

            if (!error && remoteEntries) {
                // Normalize remote entries
                entries = remoteEntries.map(e => ({
                    ...e,
                    title: e.title || '',
                    images: Array.isArray(e.images) ? e.images : []
                }));

                // Update local cache
                const tx = db.transaction('entries', 'readwrite');
                await tx.store.clear();
                for (const entry of entries) await tx.store.put(entry);
                await tx.done;
            } else if (error) {
                console.error("Erro ao buscar entradas remotas:", error);
            }
        }
        return entries;
    },

    async saveEntry(entry) {
        const { data: { user } } = await supabase.auth.getUser();
        const db = await dbPromise;

        const entryData = {
            ...entry,
            title: entry.title || '',
            id: entry.id || Date.now().toString(),
            updated_at: new Date().toISOString()
        };

        await db.put('entries', entryData);

        if (user) {
            console.log("Syncing entry:", entryData.id, "Title:", entryData.title);
            const { error } = await supabase.from('entries').upsert({
                id: entryData.id,
                user_id: user.id,
                title: entryData.title,
                content: entryData.content,
                images: entryData.images || [],
                updated_at: entryData.updated_at
            }, { onConflict: 'id' });

            if (error) {
                console.error("Erro ao sincronizar entrada:", error);
                if (error.code === '42703' || error.message.includes('column "title"')) {
                    alert("⚠️ ERRO: O banco de dados não conhece a coluna 'title'. Execute o comando SQL.");
                } else if (error.message.includes('column "images"')) {
                    alert("⚠️ NOVO: O banco de dados não conhece a coluna de 'fotos'.\n\nPor favor, execute o NOVO comando SQL no Supabase para permitir salvar fotos.");
                } else if (error.message.includes('schema cache')) {
                    alert("⚠️ ERRO DE CACHE: O Supabase ainda não atualizou. Tente atualizar a página (F5).");
                } else {
                    alert(`Erro ao salvar nota na nuvem (Código ${error.code}): ${error.message}`);
                }
            }
        }
        return entryData;
    },

    async deleteEntry(id) {
        const { data: { user } } = await supabase.auth.getUser();
        const db = await dbPromise;

        // Delete locally
        await db.delete('entries', id);

        // Delete from Supabase
        if (user) {
            const { error } = await supabase
                .from('entries')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);
            if (error) console.error("Erro ao deletar entrada remota:", error);
        }
        return true;
    },
};
