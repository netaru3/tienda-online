import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 usuario: String,
 comentario: String,
 producto: String
});

export let log_comentarios= mongoose.model("comentarios-tienda-online",esquema)