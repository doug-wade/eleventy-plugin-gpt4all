const extractCodeFromResponse = (code, lang) => {
    if (!code.includes('"""')) {
        return code;
    }

    const firstCodeBlock = code.split('"""')[1];
    if (firstCodeBlock.startsWith(lang)) {
        return firstCodeBlock.replace(lang, '');
    }

    return firstCodeBlock;
};

module.exports = extractCodeFromResponse;
