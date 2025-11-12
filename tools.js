require('dotenv').config();
const fs = require('fs').promises;
const { Tool } = require('./core');
const LM_API_URL = process.env.LM_API_URL;
const LM_MODEL = process.env.LM_MODEL;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

if (!LM_API_URL || !LM_MODEL) {
    throw new Error("Les variables d'environnement LM_API_URL et LM_MODEL doivent être définies dans le fichier .env");
}

const lmStudioTool = new Tool('lmStudio', async (input, systemPrompt = null) => {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: input });
    console.log('[LM STUDIO] Prompt sent: ', input);
    const res = await fetch(LM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: LM_MODEL,
            messages
        })
    });
    const data = await res.json();
    const result = data.choices?.[0].message?.content;
    console.log('[LM STUDIO] Response received: ', result);
    return result;
});

const fetchTool = new Tool('fetch', async (url) => {
    console.log('[FETCH] Fetching URL: ', url);
    const response = await fetch(url, {
        header: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36'
        }
    });
    const result = await response.text();
    console.log(`[FETCH] Response : ${result.substring(0, 200)}...`); // Log first 200 characters
    return result.replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags for safety
                 .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove style tags
                 .replace(/<[^>]+>/g, '') // Remove all HTML tags
                 .replace(/\s+/g, ' ') // Collapse whitespace
                 .trim(); 
});

const fileWriteTool = new Tool('writeFile', async ({ filename, content }) => {
    console.log(`[WRITE FILE] Writing to file: ${filename}`);
    console.log(`[WRITE FILE] Content: ${content.substring(0, 100)}...`); // Log first 100 characters

    await fs.writeFile(filename, content, 'utf8');
    const result = `File ${filename} written successfully.`;
    console.log(`[WRITE FILE] Result: ${result}`);
    return result;
});
 
const weatherTool = new Tool('weather', async (city) => {
    const url = `http://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;
    console.log('[WEATHER] Fetching weather for: ', city);
    console.log('[WEATHER] Request URL: ', url);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`[WEATHER] Response: ${JSON.stringify(data, null, 2)}`);

    if (data.error) {
        const errorMsg = `Error fetching weather data: ${data.error.message}`;
        console.error('[WEATHER] ', errorMsg);
        throw new Error(errorMsg);
    }

    const result = `Météo à ${data.location.name}, ${data.location.country} : ${data.current.temp_c}°C, ${data.current.condition.text}, Ressenti: ${data.current.feelslike_c}°C, Humidité: ${data.current.humidity}%, Vent: ${data.current.wind_kph} kph`;
    console.log('[WEATHER] Result: ', result);
    return result;
});

module.exports = {
    lmStudioTool,
    fetchTool,
    fileWriteTool,
    weatherTool
};