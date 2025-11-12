const { Tool, Agent, Task } = require('./core');
const { fetchTool, lmStudioTool, fileWriteTool } = require('./tools');

// GLOBAL CONFIG
const SEARCH_TERM = 'économie';
const VERBOSE = false;

// AGENTS
const fetcher = new Agent('Fetcher', [fetchTool]);
const analyst = new Agent('Analyst', [lmStudioTool], "Tu es un expert en analyse d'actualités économiques.");
const extractor = new Agent('Extractor', [lmStudioTool], "Tu es un assistant qui extrait des faits et actualités clés.");
const writer = new Agent('Writer', [lmStudioTool], "Tu es un rédacteur SEO qui écrit des articles optimisés en markdown.");
const injector = new Agent('Injector', [fileWriteTool]);

// TASKS
const url = `https://fr.m.wikinews.org/w/index.php?search=${encodeURIComponent(SEARCH_TERM)}&ns0=1`;
const tasks = [
    new Task(url, 'fetch'), // Fetch the search results page
    new Task('Analyse ce contenu et extrait les principales actualités et informations.', 'lmStudio'), // Analyze and summarize
    new Task('Extrais les infos pertinentes du contenu afin de lister les actualités.', 'lmStudio'), // Extract key facts
    new Task('Rédige un article de blog sur ce contenu. Tu dois parler des actualités. Formate en markdown et optimise pour le SEO. Ton texte sera directement injecté dans WordPress', 'lmStudio'), // Write SEO article
    new Task({ filename: 'article.md', content: '' }, 'writeFile') // Write to file
];

// CREW
class Crew {
    constructor(agents = []) { 
        this.agents = agents;
    }

    async run(tasks = []) { 
        const results = [];
        let lastResult = null;
        for (let i = 0; i < tasks.length; i++) { 
            const agent = this.agents[i % this.agents.length];
            const toolName = tasks[i].toolName;
            const percent = Math.round(((i + 1) / tasks.length) * 100);
            console.log(`🔄 Etape ${i + 1}/${tasks.length} (${percent}%) - 👤 Agent: ${agent.name}, 🛠️ Outil: ${toolName}`);

            // Injecte instruction + résultat précédent pour LM Studio
            if (toolName === 'lmStudio' && i > 0 && lastResult) {
                tasks[i].input = `${tasks[i].input}\n\n${lastResult}`;
            } else if (i > 0 && typeof tasks[i].input === 'string' && lastResult) { 
                tasks[i].input = lastResult;
            }

            if (toolName === 'writeFile') {
                tasks[i].input.content = lastResult;
            }
            lastResult = await agent.perform(tasks[i]);
            
            if (VERBOSE && toolName === 'lmStudio') { 
                console.log(`✅ Résultat de l'étape ${i + 1}:`, lastResult);
            } else if (toolName !== 'lmStudio') {
                console.log(`✅ Résultat de l'étape ${i + 1}:`, typeof lastResult === 'string' ? lastResult.substring(0, 200) + '...' : lastResult);
            }

            results.push(lastResult);
        }
        console.log('🎉 Tâches de la crew terminées !');
        return results;
    }
}

// UTILISATION DE LA CREW
const crew = new Crew([fetcher, analyst, extractor, writer, injector]);

crew.run(tasks).then(console.log);