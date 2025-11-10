/**
 * A simple Tool class that encapsulates a tool's name and its associated function.
 * 
 * @class Tool
 * @param {string} name - The name of the tool.
 * @param {Function} func - The function that the tool will execute.
 *                          Accepts a single input and returns a Promise.
 */
class Tool {
    constructor (name, func) {
        this.name = name;
        this.func = func;
    }

    /**
     * Executes the tool's function with the provided input.
     * @method execute
     * @async
     * @param {*} input - The input to be passed to the tool's function.
     * @returns {Promise<*>} - The result of the tool's function.
     */
    async execute(input) {
        return await this.func(input);
    }
}

/**
 * A simple Agent class that can use tools to perform tasks.
 * 
 * @class Agent
 * @param {string} name - The name of the agent.
 * @param {Tool[]} tools - An array of Tool instances that the agent can use.
 * @param {string} prompt - A prompt string for the agent (optional).
 * Exemple: Fetcher, Analyst, Writer...
 */
class Agent {
    constructor(name, tools = [], prompt = '') { 
        this.name = name;
        this.tools = tools;
        this.prompt = prompt;
    }

    /**
     * Performs a task using the specified tool.
     * @method perform
     * @async
     * @param {Object} task - The task to be performed.
     * @param {function} onProgress - A callback function to report progress (optional).
     * @returns {Promise<*>} - The result of the tool's execution.
     */
    async perform(task, onProgress) {
        // Recherche de l'outil
        const tool = this.tools.find(t => t.name === task.toolName);
        if (!tool) {
            const error = `Outil ${task.toolName} introuvable pour l'agent ${this.name}`;
            if (onProgress) {
                onProgress({
                    type: 'log',
                    level: 'error',
                    message: error
                });
            }
            throw new Error(error);
        }

        if (onProgress) {
            onProgress({
                type: 'log',
                level: 'info',
                message: `Agent ${this.name} utilise l'outil ${tool.name}`
            });
        }

        try {
            // Exécution de l'outil
            const result = await tool.execute(task.input);
            return result;
        } catch (error) {
            if (onProgress) {
                onProgress({
                    type: 'log',
                    level: 'error',
                    message: `Erreur lors de l'exécution de l'outil ${tool.name} par l'agent ${this.name}: ${error.message}`
                });
            }
            throw new Error(`Erreur lors de l'exécution de l'outil ${tool.name} par l'agent ${this.name}: ${error.message}`);
        }
    }
}

/**
 * A simple Task class that encapsulates a task's input and the tool to be used.
 * Example: {input: "Fetch data from URL", toolName: "Fetcher"}
 */
class Task {
    constructor(input, toolName) {
        this.input = input;
        this.toolName = toolName;
    }
}

module.exports = {
    Tool,
    Agent,
    Task
};