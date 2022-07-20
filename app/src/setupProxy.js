const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  [`api`, `graphql`, `graphiql`].forEach(x => {
    app.use(
      `/${x}`,
      createProxyMiddleware({
        target: `http://localhost:5678`,
        changeOrigin: true,
        ws: true
      })
    );
  })
  
};