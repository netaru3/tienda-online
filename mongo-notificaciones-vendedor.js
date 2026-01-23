import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 usuario: String,
 notificacion: String,
 producto: String,
 show: Boolean
});

export let log_notificaciones_vendedor= mongoose.model("notificaciones-vendedor-tienda-online",esquema)
