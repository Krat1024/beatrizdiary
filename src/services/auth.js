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

        // Supabase handle 2FA via multi-factor auth, but for simple MVP 
        // we check a custom 'two_factor_enabled' flag in the public profile if needed
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
        // En produção, usaríamos supabase.auth.mfa.verify()
        // Por agora, manteremos o mock simplificado ou usaremos o código fixo
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
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw new Error(error.message);
        alert("E-mail de recuperação enviado!");
        return true;
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

        // Create profile in the 'profiles' table
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
