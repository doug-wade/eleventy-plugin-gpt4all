const { afterEach, describe, it, mock } = require('node:test');
const assert = require('node:assert');

const fs = require('fs/promises');
mock.method(fs, 'writeFile', async () => ({}));
const gpt4all = require('gpt4all');
mock.method(gpt4all, 'createCompletion', async () => ({
    choices: [{ message: { content: 'mock content' }}],
}));


describe('generatePageFromPrompt', () => {
    afterEach(() => {
        mock.reset();
    });

    it('should call createChatCompletion six times', async () => {
        const generatePageFromPrompt = require('../src/generatePageFromPrompt');
        const initialCode = mock.fn();
        const codeReview = mock.fn();
        await generatePageFromPrompt({ 
            prompt: 'prompt', 
            client: {}, 
            outputPath: 'outputPath', 
            verbose: false, 
            initialCode, 
            codeReview 
        });
        assert.strictEqual(gpt4all.createCompletion.mock.calls.length, 6);
        assert.strictEqual(initialCode.mock.calls.length, 3);
        assert.strictEqual(codeReview.mock.calls.length, 3);
    });

    it('should call writeFile three times', async () => {
        const generatePageFromPrompt = require('../src/generatePageFromPrompt');
        const initialCode = mock.fn();
        const codeReview = mock.fn();
        await generatePageFromPrompt({ 
            prompt: 'prompt', 
            client: {}, 
            outputPath: 'outputPath', 
            verbose: false, 
            initialCode, 
            codeReview 
        });
        assert.strictEqual(fs.promises.writeFile.mock.calls.length, 3);
    });

});