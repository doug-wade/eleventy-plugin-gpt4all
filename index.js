const path = require('node:path');
const fs = require('node:fs/promises');
const { JSDOM } = require('jsdom');
const { createCompletion, loadModel } = require('gpt4all');
const { mkdirp } = require('mkdirp');

const systemPromptTemplate = `
You are an expert web developer, who conforms 
to the latest best practices, and has access to all knowledge necessary 
to complete the tasks I assign to you. Please think carefully before 
giving me an answer, and check your work for correctness. Consider 
accessibility, seo, and performance when designing solutions, and take
as much time as you need to come to a good solution.
`;

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
code. If you find no errors, please return the code as is.

"""
${code}
"""
`;

const generateFiles = async ({ model, prompt, initialCode, codeReview }) => {
    const getInitialCode = async (model, prompt, lang) => {
        const response = await createCompletion(model, [
            { role: 'user', content: initialCode(prompt, lang) }
        ], { systemPromptTemplate });
        return response.choices[0].message.content;
    }
    
    const doCodeReview = async (model, code, lang) => {
        const response = await createCompletion(model, [
            { role: 'user', content: codeReview(lang, code) }
        ], { systemPromptTemplate });
        return response.choices[0].message.content;
    };

    const htmlResponse = await getInitialCode(model, prompt, 'html');
    const cssResponse = await getInitialCode(model, prompt, 'css');
    const jsResponse = await getInitialCode(model, prompt, 'javascript');

    const reviewedHtml = await doCodeReview(model, htmlResponse, 'html');
    const reviewedCss = await doCodeReview(model, cssResponse, 'css');
    const reviewedJs = await doCodeReview(model, jsResponse, 'javascript');

    return {
        html: reviewedHtml,
        js: reviewedJs,
        css: reviewedCss,
    };
}

const generatePageFromPrompt = async ({ prompt, model, outputPath, verbose, initialCode, codeReview }) => {
    const log = verbose ? console.log : () => {};
    const pageName = path.basename(outputPath, '.html');
    const dirName = path.dirname(outputPath);

    log(`Generating page ${dirName}/${pageName} from prompt`);
    
    // Call gpt4all with the prompt and get the statics
    const { html, css, js } = await generateFiles({ model, prompt, initialCode, codeReview });

    log(`Generated html, css, and js for ${dirName}/${pageName}`);

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
    const modelName = options.modelName || 'starcoder-newbpe-q4_0.gguf';
    const verbose = options.verbose || false;
    const prompts = options.prompts || {};
    const initialCode = prompts.initialCode || defaultInitialCode;
    const codeReview = prompts.codeReview || defaultCodeReview;
    const modelPromise = loadModel(modelName, { verbose });

    eleventyConfig.addTransform('gpt4all-prompt', async (content, outputPath) => {
        const model = await modelPromise;

        if (outputPath && outputPath.endsWith(".html")) {
            await mkdirp(path.dirname(outputPath));
            return await generatePageFromPrompt({ content, model, outputPath, verbose, initialCode, codeReview });
        }
      
        return content;
    });
};