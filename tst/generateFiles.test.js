const { afterEach, describe, it, mock } = require('node:test');
const assert = require('node:assert');

const gpt4all = require('gpt4all');

describe('generateFiles', () => {
    const createCompletionMock = mock.method(gpt4all, 'createCompletion', async () => ({
        choices: [{ message: { content: 'mock content' }}],
    }));
    const generateFiles = require('../src/generateFiles');

    afterEach(() => {
        createCompletionMock.mock.resetCalls();
    });

    it('should call createCompletion six times', async () => {
        await generateFiles({ model: {}, prompt: 'prompt', initialCode: mock.fn(), codeReview: mock.fn() });

        assert.strictEqual(createCompletionMock.mock.calls.length, 6);
    });

    it('should call initialCode three times', async () => {
        const initialCode = mock.fn();
        await generateFiles({ model: {}, prompt: 'prompt', initialCode, codeReview: mock.fn() });

        assert.strictEqual(initialCode.mock.calls.length, 3);
    });

    it('should call codeReview three times', async () => {
        const codeReview = mock.fn();
        await generateFiles({ model: {}, prompt: 'prompt', initialCode: mock.fn(), codeReview });

        assert.strictEqual(codeReview.mock.calls.length, 3);
    });
});