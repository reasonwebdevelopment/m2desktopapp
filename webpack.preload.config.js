// webpack.preload.config.js
const path = require('path');

module.exports = {
    mode: 'development', // of 'production' als je klaar bent voor productie
    target: 'electron-preload', // Hiermee geef je aan dat het preload script Node-bouwstenen mag gebruiken
    entry: './preload.js', // Zorg dat dit pad klopt
    output: {
        filename: 'preload.bundle.js',
        path: path.resolve(__dirname, 'dist') // Output map
    },
    externals: {
        fs: 'commonjs2 fs',
        path: 'commonjs2 path',
        os: 'commonjs2 os'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            }
        ]
    }
};
