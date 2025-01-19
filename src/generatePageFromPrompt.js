const path = require('node:path');
const { writeFile } = require('node:fs/promises');

const { JSDOM } = require('jsdom');

const generateFiles = require('./generateFiles');

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
        writeFile(jsFileName, js),
        writeFile(cssFileName, css),
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

module.exports = generatePageFromPrompt;
