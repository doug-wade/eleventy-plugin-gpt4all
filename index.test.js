const assert = require('node:assert');
const { describe, it, mock } = require('node:test');
const gpt4all = require('gpt4all');

mock.method(gpt4all, 'loadModel', async () => ({}));

const gpt4AllPlugin = require('.');

describe('eleventy-plugin-gpt4all', () => {
    it('should register a transformer', async () => {
        const eleventyConfig = {
            addPassthroughCopy: mock.fn(),
            addWatchTarget: mock.fn(),
            addTransform: mock.fn(),
        };

        gpt4AllPlugin(eleventyConfig);

        assert.strictEqual(eleventyConfig.addTransform.mock.calls.length, 1);
        assert.deepStrictEqual(eleventyConfig.addTransform.mock.calls[0].arguments[0], 'gpt4all-prompt');
    });
});