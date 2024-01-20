const path = require('node:path');
const fs = require('node:fs/promises');
const { JSDOM } = require('jsdom');
const { createCompletion, loadModel } = require('gpt4all');

const systemPromptTemplate = `
You are an expert web developer, who conforms 
to the latest best practices, and has access to all knowledge necessary 
to complete the tasks I assign to you. Please think carefully before 
giving me an answer, and check your work for correctness. Consider 
accessibility, seo, and performance when designing solutions.
`;

const generateFile = async (model, prompt, lang) => {
    const response = await createCompletion(model, [
        { role: 'user', content: `I would like you to write a web page that matches the following description: ${prompt}` },
        { role: 'user', content: `Please generate the ${lang} needed for such a web page. Please output the code, and only the code, in the ${lang} language following best practices and coding style` }
    ], { systemPromptTemplate });

    return response.choices[0].message.content;
}

const generatePageFromPrompt = async (prompt, model, outputPath, verbose) => {
    const log = verbose ? console.log : () => {};
    const pageName = path.basename(outputPath, '.html');
    const dirName = path.dirname(outputPath);

    log(`Generating page ${pageName} from prompt`);
    
    // Call gpt4all with the prompt and get the statics
    const [html, css, js] = await Promise.all([
        generateFile(model, prompt, 'html'),
        generateFile(model, prompt, 'css'),
        generateFile(model, prompt, 'javascript'),
    ]);

    log(`Generated html, css, and js for ${pageName}`);

    // Parse the html into a DOM for us to operate on.
    // I checked to make sure that jsdom doesn't execute script
    // tags, but if it does, we'll need to find a way to sandbox
    // it, because we can't have ai-generated code running on our
    // build boxes.
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Generate the css and js files
    const jsFileName = path.join(dirName, `${pageName}.js`);
    const cssFileName = path.join(dirName, `${pageName}.css`);

    await Promise.all([ 
        fs.writeFile(jsFileName, js),
        fs.writeFile(cssFileName, css),
    ]);

    log(`Wrote ${jsFileName} and ${cssFileName}`);

    // Add the script tag to the body
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('src', `${jsFileName}`);
    document.body.appendChild(scriptTag);

    // Add the style tag to the body
    const styleTag = document.createElement('style');
    styleTag.setAttribute('type', 'text/css');
    styleTag.setAttribute('rel', 'stylesheet');
    styleTag.setAttribute('href', `${cssFileName}`);
    document.body.appendChild(styleTag);

    log(`Added script and style tags to ${pageName}`);

    return `<!DOCTYPE html>${document.documentElement.outerHTML}`;
};

module.exports = function eleventyPluginGPT4All(eleventyConfig, options = {}) {
    const modelName = options.modelName || 'replit-code-v1_5-3b-newbpe-q4_0.gguf';
    const verbose = options.verbose || false;
    const modelPromise = loadModel(modelName, { verbose });

    eleventyConfig.addTransform('gpt4all-prompt', async (content, outputPath) => {
        const model = await modelPromise;

        if (outputPath && outputPath.endsWith(".html")) {
            return await generatePageFromPrompt(content, model, outputPath, verbose);
        }
      
        return content;
    });
};