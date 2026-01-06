import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 usuario_al_que_se_responde: String,
 comentario: String,
 producto: String,
 respuesta: String
});

export let log_respuestas= mongoose.model("respuestas-tienda-online",esquema)