const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
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
    
    mode: 'development',
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
            directory: path.resolve(__dirname), // Serve files from the 'dist' directory
            publicPath: '/', // Serve public files from the root
            watch: true, // Enable watching files for changes
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html",
            chunks: ["main"]
        })
    ]
};