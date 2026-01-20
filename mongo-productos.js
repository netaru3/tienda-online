import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 producto_nombre: String,
 producto_descripcion: String,
 producto_imagen: Array,
 producto_precio: String,
 producto_stock: String,
 producto_id: Number,
 null: Boolean
});

export let log_products= mongoose.model("productos-tienda-online",esquema)
