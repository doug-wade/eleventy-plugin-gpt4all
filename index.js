const path = require('node:path');
const { loadModel } = require('gpt4all');
const { mkdirp } = require('mkdirp');
const generatePageFromPrompt = require('./src/generatePageFromPrompt');

const defaultInitialCode = (prompt, lang) => `
We are going to write a web page that matches the following description, 
surrounded by triple quotes ("""). The prompt description is as follows:

"""
${prompt}
"""

Please generate the ${lang} needed for the web page. Please output the 
code, and only the code, in ${lang} language, following best practices 
and coding style.
`;

const defaultCodeReview = (lang, code) => `
Please review the following ${lang} code, delimited by triple quotes 
("""), for correctness and best practices. If you find any errors, 
please correct them and return the corrected code and only the corrected 
code. If you find no errors, please return the code as is. It is imperative
that you return the full code, corrected and complete, delimited by a code 
fence, delimited by triple quotes (""").

"""
${code}
"""
`;

module.exports = function eleventyPluginGPT4All(eleventyConfig, options = {}) {
    const modelName = options.modelName || 'starcoder-newbpe-q4_0.gguf';
    const verbose = options.verbose || false;
    const prompts = options.prompts || {};
    const initialCode = prompts.initialCode || defaultInitialCode;
    const codeReview = prompts.codeReview || defaultCodeReview;
    const modelPromise = loadModel(modelName, { verbose });

    eleventyConfig.addTransform('gpt4all-prompt', async (prompt, outputPath) => {
        const model = await modelPromise;

        if (outputPath && outputPath.endsWith(".html")) {
            await mkdirp(path.dirname(outputPath));
            return await generatePageFromPrompt({ prompt, model, outputPath, verbose, initialCode, codeReview });
        }
      
        return prompt;
    });
};