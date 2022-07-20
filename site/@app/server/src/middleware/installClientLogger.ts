import express, { Express, static as staticMiddleware } from "express";
import path from "path";

export default (app: Express) => {
  app.use('/api/log/client',  express.json(), (req,res) =>{
    const { body, url, query } = req
    const output = { body, url, query }

    console.log(`Client log received`, output)
    res.status(200).end()
  });  
};
