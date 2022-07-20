import { Express, static as staticMiddleware } from "express";
import path from "path";

export default (app: Express) => {
  console.log(`Using static content directory: ${__dirname}/../../public`);
  app.use(staticMiddleware(`${__dirname}/../../public`));
  if (process.env.NODE_ENV === `production`) {
    console.log(`Running in production mode with wildcard routing enabled for React app`);
    app.get('*', (req,res) =>{
      res.sendFile(path.join(`${__dirname}/../../public/index.html`));
    });  
  }
};
