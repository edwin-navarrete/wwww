const config = {
    entry: ['./src/index.js'
        , './src/js/Guide.js'
        , './src/js/Setup.js'
        , './src/js/gameOver.js'
        , './src/js/join.js'
        , './src/js/Poll.js'],
    output: {
        filename: 'bundle.js'
    },
    devtool: "eval",
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }, {
                test: /src.*\.js$/,
                use: [{ loader: 'ng-annotate-loader' }],
            }
        ]
    }
};

module.exports = config;