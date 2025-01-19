const { afterEach, describe, it, mock } = require('node:test');
const assert = require('node:assert');

const gpt4all = require('gpt4all');

const fs = require('node:fs');

describe('generatePageFromPrompt', () => {
    const createCompletionMock = mock.method(gpt4all, 'createCompletion', async () => ({
        choices: [{ message: { content: 'mock content' }}],
    }));
    const writeFileMock = mock.method(fs, 'writeFile', async () => {
        return Promise.resolve();
    });
    const generatePageFromPrompt = require('../src/generatePageFromPrompt');

    afterEach(() => {
        writeFileMock.mock.resetCalls();
        createCompletionMock.mock.resetCalls();
    });

    it('should call writeFile two times', async () => {
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

        assert.strictEqual(writeFileMock.mock.calls.length, 2);
    });

    it('should call createCompletion six times', async () => {
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

        assert.strictEqual(createCompletionMock.mock.calls.length, 6);
        assert.strictEqual(initialCode.mock.calls.length, 3);
        assert.strictEqual(codeReview.mock.calls.length, 3);
    });
});
