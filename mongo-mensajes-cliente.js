import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 usuario: String,
 mensaje: String,
 vendedor: Boolean,
 usuario_respuesta: String
});

export let log_mensajes_cliente= mongoose.model("mensajes-cliente-tienda-online",esquema)