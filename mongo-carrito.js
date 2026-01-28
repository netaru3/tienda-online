import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 usuario: String,
 producto_nombre: String,
 producto_precio: String,
 producto_id: Number,
 producto_imagen: Array
});

export let log_carrito= mongoose.model("carrito-tienda-online",esquema)