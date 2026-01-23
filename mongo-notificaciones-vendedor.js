import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 usuario: String,
 notificacion: String,
 producto:{type:String,
    required: false
 },
 show: Boolean
});

export let log_notificaciones_comprador= mongoose.model("notificaciones-cliente-tienda-online",esquema)
