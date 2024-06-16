const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require("path");

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        resolve: {
            fallback: {
            "fs": false,
            "tls": false,
            "net": false,
            "path": false,
            "zlib": false,
            "http": false,
            "https": false,
            "stream": false,
            "crypto": false, 
            } 
        },
        mode: isProduction ? 'production' : 'development',
        entry: {
            main: "./src/main.js",
        },
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname,  "dist")
        },
        devServer: {
            port: 8081,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'X-Content-Type-Options': 'undefined',
            },
            static: {
                directory: isProduction ? path.resolve(__dirname, "dist") : path.resolve(__dirname, 'public'), // Serve files from the 'dist' directory
                publicPath: '/', // Serve public files from the root
                watch: true, // Enable watching files for changes
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: isProduction ? 'index.html' : path.resolve(__dirname, 'public', 'index.html'),
                chunks: ["main"]
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.resolve(__dirname, 'public'), to: path.resolve(__dirname, 'dist') } // Copy all files from 'public' to 'dist'
                ]
            })
        ],
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                    },
                },
            ],
        },
    }
};