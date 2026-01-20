//------------------------------importaciones-------------------------
import express from 'express'
import {log} from './mongo.js' 
import {log_products} from './mongo-productos.js'
import {createServer} from 'http'
import {Server} from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'
import multer from 'multer'
import { now } from 'mongoose'
import {log_comentarios} from './mongo-comentarios.js'
import { log_respuestas } from './mongo-respuestas.js'
import session from 'express-session'
import { log_mensajes_cliente } from './mongo-mensajes-cliente.js'
import { log_notificaciones_vendedor } from './mongo-notificaciones-vendedor.js'
import { log_notificaciones_comprador } from './mongo-notificaciones-cliente.js'
import bcryptjs from 'bcryptjs'
import {MercadoPagoConfig,Preference,Payment} from 'mercadopago'
dotenv.config()

//-----------------------------declaraciones--------------------------
        
//---------------------------- servidores-----------------------------
let app= express()
const server= createServer(app)
const IO= new Server(server)

//---------------------------configuración-----------------------------
app.set("views",path.join(import.meta.dirname,"views"))
app.set("view engine","ejs")
const cliente=new MercadoPagoConfig({accessToken: process.env.TOKEN})
 const payment = new Payment(cliente);
const preference= new Preference(cliente)

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
        let hash= await bcryptjs.hash(req.body.contraseña,10)
        
        log.create({
        usuario: req.body.usuario,
        contraseña: hash
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
 let cuenta=await log.find({usuario:req.body.usuario});
let comparacion= await bcryptjs.compare(req.body.contraseña, cuenta[0].contraseña)
        console.log(comparacion)
       if(comparacion){
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
app.post("/products",upload.array("imagen",6),async function(req,res){
 let producto= await log_products.find({})
 let id= producto.length +1
    log_products.create({
        producto_nombre: req.body.nombre,
        producto_descripcion: req.body.descripcion,
        producto_imagen: req.files,
        producto_precio: req.body.precio,
        producto_stock: req.body.stock,
        producto_id: id,
        null: false
    })

    res.send("el producto fue creado con exito")
})

app.post("/comprobar-usuario",async function(req,res){
    if (req.session.usuario===undefined){return res.send("ingrese sesion para comprar")}
    
   try{ console.log("creando notificacion"); await log_notificaciones_vendedor.create({
        usuario: req.session.usuario,
        notificacion: `el usuario ${req.session.usuario} ha comprado el producto ${req.body.producto}`,
       producto: req.body.producto

    })}catch(error){console.log("no se pudo crear la notificación",error)};
    res.send("ok")
})

app.post("/editarnombre",async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_id:req.body.nombre},{producto_nombre: req.body.nombreeditado},{new: true})

    res.send({nombreeditado:req.body.nombreeditado})
})

app.post("/editardescripcion",async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_id:req.body.nombre},{  producto_descripcion: req.body.descripcioneditada},{new: true})
    
    res.send("ok")
})

app.post("/editarprecio",async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_id:req.body.nombre},{
        producto_precio: req.body.precioeditado},
    {new: true})

    console.log(producto)

    res.send("ok")
})

app.post("/editarimagen",upload.single("editarimagen"),async function(req,res){
    let producto= await log_products.findOneAndUpdate({producto_id:req.body.nombre},{
        producto_imagen: req.file.filename},
    {new: true})

    console.log(producto)

    res.render("producto-admin",{nombre:req.body.nombre})
})

app.post("/editar-stock",async function(req,res){
    let stock= await log_products.findOneAndUpdate({producto_id: req.body.producto},{producto_stock: req.body.stock})
    res.send("ok")
})

app.post("/borrarproducto",async function(req,res){ console.log("producto borrado")
    await log_products.findOneAndReplace({producto_id: req.body.producto_id},{null: true})

    res.render("tienda-admin")
})

app.post("/comentarios",async function(req,res){
    if(req.session.usuario===undefined){return res.send("los visitantes no pueden comentar")}

    try{ await log_comentarios.create({
         usuario: req.body.usuario,
         comentario: req.body.comentario,
         producto: req.body.producto,
         producto_id: req.body.producto_id
     });

    let comentario=await log_comentarios.find({}); 
    IO.emit("comentarios",comentario)
    res.send("ok")}

    catch(error){console.log("error creando el comentario",error); res.send("error")}
    try{await log_notificaciones_vendedor.create({
        usuario: req.session.usuario,
        notificacion: `el usuario ${req.session.usuario} ha comentado en el producto ${req.body.producto}`,
        producto: req.body.producto
    })}
    
    catch(error){console.log("hubo un error creando la notificación",error)}
})

app.post("/respuesta",async function(req,res){
    console.log("llegó la respuesta")
  await log_respuestas.create({usuario_al_que_se_responde:req.body.usuario,
        comentario: req.body.comentario,
        producto: req.body.producto,
        producto_id: req.body.producto_id,
        respuesta: req.body.respuesta
    })

    await log_notificaciones_comprador.create({
        usuario:req.body.usuario,
        notificacion: `el vendedor ha respondido tu comentario sobre el producto ${req.body.producto}`
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

  if(req.session.usuario!=="admin"){ await log_notificaciones_vendedor.create({
    usuario: req.session.usuario,
    notificacion: `el usuario ${req.session.usuario} te ha enviado un mensaje`
   })}
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
   console.log("mensajes:",mensajes)
   let array=[]
   for(let mensaje of mensajes){if(mensaje.usuario!==undefined && mensaje.usuario!=="admin")
    {array.push(mensaje.usuario)}

if(mensaje.usuario_respuesta!==undefined && mensaje.usuario==="admin"){array.push(mensaje.usuario_respuesta)}}

   let usuarios_unicos=[...new Set(array)]
console.log(usuarios_unicos)
res.json(usuarios_unicos)
})

app.get("/notificaciones-vendedor",async function(req,res){
  let notificaciones= await log_notificaciones_vendedor.find({})
  res.json(notificaciones)
})

app.get("/notificaciones-comprador",async function(req,res){
    let notificaciones= await log_notificaciones_comprador.find({})
    res.json(notificaciones)
})

app.post("/bajarstock",async function(req,res){
    
})

app.get("/usuarios",async function(req,res){
    let allusers=[]
    let usuarios= await log.find({})
    for(let usuario of usuarios){allusers.push(usuario.usuario)}
    res.json(allusers)
})

app.get("/comprar",async function(req,res){console.log("comprar")
    let producto= await log_products.find({producto_id: req.session.producto_id})
    console.log("producto:",producto)
    let precio1= Number(producto[0].producto_precio.match(/\d+/))
    console.log("precio1:",precio1)
 if(Number(producto[0].producto_stock)>0){
    try{
        const body= {
            items:[{title: producto[0].producto_nombre,
                unit_price: precio1,
                quantity:1,
                currency_id:"UYU"
            }],  external_reference:req.session.usuario,
            metadata:{id: req.session.producto_id},
             payer: {  // ← ESTO ES LO QUE FALTA
                email: "test_user_123456@testuser.com"  // Email de prueba
            },
            back_urls:{
                success: `https://tienda-online-production-a6d6.up.railway.app/tienda/${req.session.usuario}`,
                failure: "http://localhost:3000/pago-fallido",
                pending: "http://localhost:3000/pago-pendiente"
            },
            notification_url: "http://localhost:3000/webhook"
        };
        const response= await preference.create({body});
        console.log("init_point:",response.init_point)
        res.json({init_point: response.init_point})
    }catch(error){console.log("error:", error)}}
    else{res.send("no hay stock")}
})

app.post("/webhook", async function(req, res) {
    console.log("Webhook recibido:", req.body);
    
    const { type, data } = req.body;
    
    // MercadoPago envía diferentes tipos de notificaciones
        try {
            // Aquí procesás la notificación del pago
            const paymentId = data.id;
            const paymentinfo= await payment.get({id:paymentId})
            
            // Opcional: Obtener más detalles del pago
            // const payment = await Payment.get({ id: paymentId });
             if(paymentinfo.status==="approved"){ console.log("pago aprobado")
                let producto= await log_products.find({producto_id: paymentinfo.metadata.id})
    
    if(Number(producto[0].producto_stock)>0){let nuevoproducto= await log_products.findOneAndUpdate({producto_id: producto[0].producto_id},{producto_stock: `${Number(producto[0].producto_stock)-1}`})
   }}
   
                
             }catch(error) {
            console.error("❌ Error procesando el pago:", error);
        }
            
            
            
       res.sendStatus(200)  } 
    )
//----------------rutas dinámicas--------------------

app.get("/tienda/:nombre",function(req,res){
    console.log(req.session.usuario)
    if(req.session.usuario===undefined && req.query.external_reference===undefined){return res.sendFile("login.html",{root:import.meta.dirname})}
     res.render("tienda",{nombre: req.session.usuario})

})

app.get("/producto/:producto/:id",function(req,res){ req.session.producto_id= req.params.id
    if(req.session.usuario==="admin"){console.log(req.session.usuario);
        return res.render("producto-admin",{nombre: req.params.producto, id: req.params.id})
    }
    else{
        res.render("producto",{nombre: req.params.producto,
        usuario: req.session.usuario, id: req.params.id
    })}

    console.log(req.session.usuario)
})

app.get("/mensajeria/:usuario",function(req,res){if(req.session.usuario==="admin"){return res.render("mensajes2-vendedor",{usuario: req.params.usuario})}
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
