import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config()

try{await mongoose.connect(process.env.URL)}
catch(error){console.log("error:",error)}

let esquema=new mongoose.Schema({
 usuario: String,
 contraseña: String,
});

export let log= mongoose.model("usuarios-tienda-online",esquema)