export async function setup2FA(userEmail) {
    try {
        const qrcode = await import('https://cdn.skypack.dev/qrcode');

        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 20; i++) {
            secret += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        // Use as crases (inclinação para a esquerda) exatamente como abaixo:
        const otpauth = `otpauth://totp/DailyDiary:${userEmail}?secret=${secret}&issuer=DailyDiary`;

        const qrCodeUrl = await qrcode.default.toDataURL(otpauth);

        return {
            secret: secret,
            qrCodeUrl: qrCodeUrl
        };
    } catch (err) {
        console.error("Erro na geração do 2FA:", err);
        throw err;
    }
}