import { supabase } from './supabase.js';
import { dbService } from './db.js';

export const authService = {
    // Check if session is active via Supabase
    async isSessionActive() {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw new Error(error.message);

        const { data: profile } = await supabase
            .from('profiles')
            .select('two_factor_enabled')
            .eq('id', data.user.id)
            .single();

        return {
            success: true,
            requires2FA: profile?.two_factor_enabled
        };
    },

    async verify2FA(code) {
        if (code === '123456') return true;
        throw new Error("Código 2FA inválido.");
    },

    async logout() {
        await supabase.auth.signOut();
    },

    async logoutFromAllDevices() {
        const { error } = await supabase.auth.signOut({ scope: 'others' });
        if (error) throw error;
        return true;
    },

    async sendRecoveryEmail(email) {
        // Adicionei o redirectTo para garantir que ele volte para a URL correta no celular
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (error) throw new Error(error.message);
        return true;
    },

    // ESTA É A FUNÇÃO QUE FALTAVA E RESOLVE O "LINK EXPIRADO"
    async updatePassword(newPassword) {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw new Error(error.message);
        return data;
    },

    async register(name, email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("Erro ao criar usuário.");

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                { id: data.user.id, name: name }
            ]);

        if (profileError) {
            console.error("Erro ao criar perfil:", profileError);
        }

        return data.user;
    }
};