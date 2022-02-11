module.exports = {
    env: {
        browser: true, // allow use window.
        node: true,
        commonjs: true
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        parser: '@typescript-eslint/parser',
        sourceType: 'module', // allow the use of imports statements
        ecmaVersion: 2020, // allow the parsing of modern ecmascript
    },
    rules: {
        'ban-ts-comment': 0,
        '@typescript-eslint/ban-ts-comment': 'off',
        "@typescript-eslint/no-explicit-any": "off",
        "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
};
