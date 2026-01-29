import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 producto_nombre: String,
 producto_precio: String,
 producto_stock: String,
 producto_envio: String,
 producto_id: Number,
 local_ubicacion: String,
});

export let log_compras= mongoose.model("compras-tienda-online",esquema)