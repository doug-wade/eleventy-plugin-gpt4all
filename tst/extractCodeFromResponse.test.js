const { describe, it } = require('node:test');
const assert = require('node:assert');

const extractCodeFromResponse = require('../src/extractCodeFromResponse');

describe('extractCodeFromResponse', () => {
    it('should extract code blocks delimited with triple quotes', () => {
        const expected = '<html></html>';
        const mockCode = `here is some code: """${expected}"""`;

        const actual = extractCodeFromResponse(mockCode, 'html');

        assert.strictEqual(actual, expected);
    });

    it('should trim the language name from code blocks', () => {
        const expected = 'console.log("hello world");';
        const mockCode = `here is some code: """javascript${expected}"""`;

        const actual = extractCodeFromResponse(mockCode, 'javascript');

        assert.strictEqual(actual, expected);
    });
});
