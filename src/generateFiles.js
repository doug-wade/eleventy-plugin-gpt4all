const { createCompletion } = require('gpt4all');

const systemPromptTemplate = `
You are an expert web developer, who conforms 
to the latest best practices, and has access to all knowledge necessary 
to complete the tasks I assign to you. Please think carefully before 
giving me an answer, and check your work for correctness. Consider 
accessibility, seo, and performance when designing solutions, and take
as much time as you need to come to a good solution.
`;

const generateFiles = async ({ model, prompt, initialCode, codeReview }) => {
    const getInitialCode = async (model, prompt, lang) => {
        const content = initialCode(prompt, lang);
        const response = await createCompletion(model, content, { systemPromptTemplate });
        return response.choices[0].message.content;
    }
    
    const doCodeReview = async (model, code, lang) => {
        const content = codeReview(lang, code);
        const response = await createCompletion(model, content, { systemPromptTemplate });
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

module.exports = generateFiles;
