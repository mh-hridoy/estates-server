module.exports = {
    "env": {
        "node": true,
        "commonjs": true,
        "es2021": true,
        "browser": true,

    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12
    },
    "plugins": [
        "react"
    ],
    "rules": {
    }
};
