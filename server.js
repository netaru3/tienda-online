//------------------------------importaciones-------------------------
import express from 'express'
import {log} from './mongo.js'
import {log_products} from './mongo-productos.js'
import {createServer} from 'http'
import {Server} from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import { now } from 'mongoose'
import {log_comentarios} from './mongo-comentarios.js'
import { log_respuestas } from './mongo-respuestas.js'
import session from 'express-session'
import { log_mensajes_cliente } from './mongo-mensajes-cliente.js'
dotenv.config()

//-----------------------------declaraciones--------------------------
         
//---------------------------- servidores-----------------------------
let app= express()
const server= createServer(app)
const IO= new Server(server)

//---------------------------configuración-----------------------------
app.set("views",path.join(import.meta.dirname,"views"))
app.set("view engine","ejs")

const storage = multer.diskStorage({ destination: function(req,file,cb){cb(null,"public")},
    filename: function(req,file,cb){
        let ext= path.extname(file.originalname)
        let nombre= Date.now() +ext

        cb(null,nombre)
    }
 });

 const upload= multer({storage})
//--------------------------middleware---------------------------------
app.use(express.json())

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(import.meta.dirname, "public")));
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store")
    next()});
    
app.use(session({
  secret:process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true
  }
}));

//------------------------rutas estáticas---------------------------------
app.get('/',function(req,res){ 
    res.sendFile("registro1.html",{
        root: import.meta.dirname
    })
})

app.post('/data',async function(req,res){
       try{ if(req.body)
       { let cuenta=await log.find({usuario:req.body.usuario
    });
    console.log(cuenta);
    if(cuenta.length>0){res.setHeader("Content-Type", "text/plain"); 
        return res.send("el usuario ya está tomado")}
        
        log.create({
        usuario: req.body.usuario,
        contraseña: req.body.contraseña
       })}} catch(error){
    console.log("error:",error)
   };

    res.sendFile("login.html",{
        root: import.meta.dirname
    })
})

app.get('/data',async function(req,res){
    res.sendFile("login.html",{
        root: import.meta.dirname
    })
})

app.post("/data/logeado",async function(req,res){
   delete req.session.usuario
       let cuenta=await log.find({usuario:req.body.usuario, contraseña:req.body.contraseña});

       if(cuenta.length>0){
        req.session.usuario=req.body.usuario
         res.send("ok")}

         else {res.send("error en el inicio de sesión")}
})

app.get("/tienda/cerrarsesion",function(req,res){
    delete req.session.usuario;
    res.sendFile("login.html",{root: import.meta.dirname})
})

app.get("/tienda/visitante",function(req,res){
    delete req.session.usuario
    res.render("tienda",{nombre: "visitante"})
})

app.get("/tienda/admin/productos",function(req,res){
    if(req.session.usuario===undefined){return res.sendFile("login.html",{root:import.meta.dirname})}

    res.render("productos")
})

app.get("/tienda/admin",function(req,res){
    if(req.session.usuario===undefined){res.sendFile("login.html",{root:import.meta.dirname})} else{
    res.render("tienda-admin")}
})

app.get("/verproductos",async function(req,res){
   let productos=await log_products.find()
   res.json(productos)
})
app.post("/products",upload.single("imagen"),function(req,res){
    log_products.create({
        producto_nombre: req.body.nombre,
        producto_descripcion: req.body.descripcion,
        producto_imagen: req.file.filename,
        producto_precio: req.body.precio
    })

    res.send("el producto fue creado con exito")
})

app.get("/comprobarusuario",function(req,res){ console.log(req.session.usuario)
    if (req.session.usuario===undefined){return res.send("ingrese sesion para comprar")}
    res.send("ok")
})

app.post("/editarnombre",async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_nombre:req.body.nombre},{producto_nombre: req.body.nombreeditado},{new: true})

    res.send({nombreeditado:req.body.nombreeditado})
})

app.post("/editardescripcion",async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_nombre:req.body.nombre},{  producto_descripcion: req.body.descripcioneditada},{new: true})
    
    res.send("ok")
})

app.post("/editarprecio",async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_nombre:req.body.nombre},{
        producto_precio: req.body.precioeditado},
    {new: true})

    console.log(producto)

    res.send("ok")
})

app.post("/editarimagen",upload.single("editarimagen"),async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_nombre:req.body.nombre},{
        producto_imagen: req.file.filename},
    {new: true})

    console.log(producto)

    res.render("producto-admin",{nombre:req.body.nombre})
})

app.post("/borrarproducto",async function(req,res){ console.log("producto borrado")
    await log_products.deleteOne({producto_nombre: req.body.producto_nombre})

    res.render("tienda-admin")
})

app.post("/comentarios",async function(req,res){
    if(req.session.usuario===undefined){return res.send("los visitantes no pueden comentar")}

    try{ await log_comentarios.create({
         usuario: req.body.usuario,
         comentario: req.body.comentario,
         producto: req.body.producto
     });

    let comentario=await log_comentarios.find({}); 
    IO.emit("comentarios",comentario)
    res.send("ok")}

    catch(error){console.log("error creando el comentario",error); res.send("error")}
})

app.post("/respuesta",async function(req,res){
    console.log("llegó la respuesta")
  await log_respuestas.create({usuario_al_que_se_responde:req.body.usuario,
        comentario: req.body.comentario,
        producto: req.body.producto,
        respuesta: req.body.respuesta
    })

    let respuestas= await log_respuestas.find({})
    let comentario=await log_comentarios.find({})

    IO.emit("respuestas",respuestas)
    IO.emit("comentarios",comentario)
})

app.post("/mensajes",async function(req,res){console.log("hola")
    console.log(req.body.mensaje)
    if(req.body.mensaje!==""){ 
        try{     
let nuevomensaje=await log_mensajes_cliente.create({
        usuario: req.session.usuario,
        mensaje: req.body.mensaje,
        vendedor: req.body.vendedor,
        usuario_respuesta: req.body.usuario_respuesta})
        
        IO.emit("mensajes",[nuevomensaje])
        res.send("ok")

   } catch(error){console.log("error: ",error)}}
})

app.get("/mensajeria/admin",function(req,res){
    if(req.session.usuario==="admin"){
    res.render("mensajes-vendedor",{usuario:"aaron"})}
    else {res.send("no tienes permiso para acceder al chat")}
})

app.get("/mensajeria/",function(req,res){
    res.send("ingrese sesión para enviar mensaje")
})

app.get("/chats",async function(req,res){
   let mensajes=await log_mensajes_cliente.find({})
   let array=[]
   for(let mensaje of mensajes){array.push(mensaje.usuario)}
   let usuarios_unicos=[...new Set(array)]
console.log(usuarios_unicos)

res.json(usuarios_unicos)
})

//----------------rutas dinámicas--------------------

app.get("/tienda/:nombre",function(req,res){
    if(req.session.usuario===undefined){return res.sendFile("login.html",{root:import.meta.dirname})}
     res.render("tienda",{nombre: req.session.usuario})

})

app.get("/producto/:producto",function(req,res){
    if(req.session.usuario==="admin"){console.log(req.session.usuario);
        return res.render("producto-admin",{nombre: req.params.producto})
    }
    else{
        res.render("producto",{nombre: req.params.producto,
        usuario: req.session.usuario
    })}

    console.log(req.session.usuario)
})

app.get("/mensajeria/:usuario",function(req,res){
    if(req.params.usuario!==req.session.usuario){return res.send("No tiene permiso para acceder a este chat")}
    res.render("mensajes-cliente",{usuario: req.session.usuario})
})

//----------------------------websocket----------------------

IO.on("connection",async function(socket){
    let comentario=await log_comentarios.find({})
    let respuestas= await log_respuestas.find({})
    let mensajes= await log_mensajes_cliente.find({})

    socket.emit("mensajes",mensajes)
    socket.emit("comentarios",comentario)

    IO.emit("respuestas",respuestas)

    console.log("te conectaste")
   
    socket.on("error-sesion",function(){
        socket.emit("error","hubo un error en el inicio de sesion")
    })

    socket.on("disconnect",function(){
    })})

server.listen(process.env.PORT || 3000)