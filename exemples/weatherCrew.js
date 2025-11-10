require('dotenv').config({
    path: require('path').join(__dirname, '../.env')
});
const { Tool, Agent, Task } = require('../core');
const { weatherTool, lmStudioTool } = require('../tools');

const CITY = 'Toulouse';
const VERBOSE = true;

// Agent
const weatherFetcher = new Agent('WeatherFetcher', [weatherTool]);
const weatherAnalyst = new Agent('WeatherAnalyst', [lmStudioTool],
    'Tu es un expert en analyse météorologique. Analyse les données météorologiques fournies et donne des conseils pratiques pour la journée (vêtements, activités, précautions).'
);

// Tasks
const tasks = [
    new Task(CITY, 'weather'), // Fetch weather data for the city
    new Task(
        `Analyse ces données et donne des conseils pratiques pour la journée (vêtements, activités, précautions). Sois concis et utile.`,
        'lmStudio'
    )
];

// Crew
class Crew {
    constructor(agents = []) { 
        this.agents = agents;
    }

    async run(tasks = [], verbose = false) { 
        const results = [];
        let lastResult = null;

        for (let i = 0; i < tasks.length; i++) { 
            const agent = this.agents[i % this.agents.length];
            const toolName = tasks[i].toolName;
            const percent = Math.round(((i + 1) / tasks.length) * 100);

            console.log(`🔄 Etape ${i + 1}/${tasks.length} (${percent}%) - 👤 Agent: ${agent.name}, 🛠️ Outil: ${toolName}`);

            // Injecte le résultat de la tâche précédente si nécessaire pour analyse IA
            if (toolName === 'lmStudio' && i > 0 && lastResult) { 
                tasks[i].input = `${tasks[i].input}\n\nDonnées météo: ${lastResult}`;
            }

            lastResult = await agent.perform(tasks[i]);

            if (VERBOSE) { 
                console.log(`✅ Résultat de l'étape ${i + 1}:\n${lastResult}\n`);
            }

            results.push(lastResult);
        }

        console.log(`🎉 Analyse météo terminée pour ${CITY} !`);
        return results;
    }
}

// Utilisation de la Crew
const crew = new Crew([weatherFetcher, weatherAnalyst]);

crew.run(tasks, VERBOSE).then(console.log);