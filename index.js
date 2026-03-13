//------------------------------importaciones-------------------------
import express from 'express'
import {log} from './base_de_datos_mongo/mongo.js'
import {log_products} from './base_de_datos_mongo/mongo-productos.js'
import {createServer} from 'http'
import {Server} from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'
import multer from 'multer'
import { now } from 'mongoose'
import {log_comentarios} from './base_de_datos_mongo/mongo-comentarios.js'
import { log_respuestas } from './base_de_datos_mongo/mongo-respuestas.js'
import session from 'express-session'
import { log_mensajes_cliente } from './base_de_datos_mongo/mongo-mensajes-cliente.js'
import { log_notificaciones_vendedor } from './base_de_datos_mongo/mongo-notificaciones-vendedor.js'
import { log_notificaciones_comprador } from './base_de_datos_mongo/mongo-notificaciones-cliente.js'
import bcryptjs from 'bcryptjs'
import {MercadoPagoConfig,Preference,Payment} from 'mercadopago'
import { log_carrito } from './base_de_datos_mongo/mongo-carrito.js'
import {log_compras} from './base_de_datos_mongo/mongo-compras.js'
import { log_pagos_id } from './base_de_datos_mongo/mongo_pagos.js'
import { log_compras_terminadas } from './base_de_datos_mongo/mongo-compras-terminadas.js'
import  {log_ofertas2x1}  from './base_de_datos_mongo/mongo-ofertas.js'
import { log_ofertas_envio } from './base_de_datos_mongo/mongo-ofertas_envio.js'
import { log_reembolsos } from './base_de_datos_mongo/mongo-reembolsos.js'
import { log_numero_vendedor } from './base_de_datos_mongo/mongo-numero-whatssap.js'
import ImageKit from 'imagekit'
import fs from 'fs'

dotenv.config()

//-----------------------------declaraciones--------------------------
let dolarAuyu=0;
try{
    const response = await fetch("https://open.er-api.com/v6/latest/USD")
;

const data = await response.json();

 dolarAuyu =data.rates.UYU;
}catch(error){console.log("errror:",error)
  dolarAuyu=40
}           

console.log(dolarAuyu)

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC,
  privateKey: process.env.IMAGEKIT_PRIVATE,
  urlEndpoint: process.env.IMAGEKIT_URL
});



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

 const upload= multer({storage}) //probar borrar multer
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

app.get("/registro",function(req,res){
    res.sendFile("registro1.html",{root:import.meta.dirname})
})

app.get('/',async function(req,res){ 
     let numero= await log_numero_vendedor.find({})
    let numero_valido= numero[0].numero_del_vendedor.replace("+","")
    let numero_ahora_si_valido_en_serio_UwU= numero_valido.replace(/ /g,"")
    res.render("tienda",{ nombre: "visitante",numero: numero_ahora_si_valido_en_serio_UwU
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
try{let comparacion= await bcryptjs.compare(req.body.contraseña, cuenta[0].contraseña)
    if(comparacion){
        req.session.usuario=req.body.usuario; console.log("se ejecutó la comparación")
         res.send("ok")}

         else {res.send("error en el inicio de sesión")}
         
}catch(error){res.send("error en el inicio de sesión"); 
    console.log("se ejecutó el catch");return}
       
})

app.get("/tienda",async function(req,res){ if(req.session.usuario===undefined){ res.sendFile("login.html",{root:import.meta.dirname}); return}
    let numero= await log_numero_vendedor.find({})
    let numero_valido= numero[0].numero_del_vendedor.replace("+","")
    let numero_ahora_si_valido_en_serio_UwU= numero_valido.replace(/ /g,"")
    res.render("tienda",{nombre: req.session.usuario,numero: numero_ahora_si_valido_en_serio_UwU})
})

app.get("/tienda/cerrarsesion",function(req,res){
    delete req.session.usuario;
    res.sendFile("login.html",{root: import.meta.dirname})
})

app.get("/tienda/visitante",async function(req,res){
    delete req.session.usuario

    let numero= await log_numero_vendedor.find({})
    let numero_valido= numero[0].numero_del_vendedor.replace("+","")
    let numero_ahora_si_valido_en_serio_UwU= numero_valido.replace(/ /g,"")
    res.render("tienda",{nombre: "visitante",numero: numero_ahora_si_valido_en_serio_UwU})
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
 let imagenes= [];

 if(req.files){
    for(let img of req.files){
        let result= await imagekit.upload({file:fs.readFileSync(img.path),
            fileName:"imagenes"
        })

        imagenes.push(result.url)
        console.log("imagen subida correctamente")
    }
 }
 let id= producto.length +1
    log_products.create({
        producto_nombre: req.body.nombre,
        producto_descripcion: req.body.descripcion,
        producto_imagen: imagenes,
        producto_precio: req.body.precio,
        producto_stock: req.body.stock,
        producto_envio: req.body.envio,
        producto_id: id,
        local_ubicacion: req.body.local,
        null: false
    })

    res.send("el producto fue creado con exito")
})

app.post("/comprobar-usuario",async function(req,res){
    if (req.session.usuario===undefined){return res.send("ingrese sesion para comprar")}
    
  ;
    res.send("ok")
})

app.post("/editarnombre",async function(req,res){
    console.log(req.body.id)
    let producto= await log_products.findOneAndUpdate({producto_id:req.body.id},{producto_nombre: req.body.nombreeditado},{new: true})

    res.json({nombreeditado:req.body.nombreeditado,id: req.body.id})
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

app.post("/editarimagen",upload.array("editarimagen",6),async function(req,res){
    let imagenes= [];

    let result;
try{
    if(req.files){
    for(let img of req.files){
         result= await imagekit.upload({file:fs.readFileSync(img.path),
            fileName: "imagen"
        })

        imagenes.push(result.url)
        console.log("imagen subida correctamente")
    }
 }
    let producto= await log_products.findOneAndUpdate({producto_id:req.body.id},{
        producto_imagen: result.url},
    {new: true})

    console.log(producto)
    res.render("producto-admin",{id:req.body.id, nombre: producto.producto_nombre})
}catch(error){console.log("error:",error)}
 
})

app.post("/editar-stock",async function(req,res){
    let stock= await log_products.findOneAndUpdate({producto_id: req.body.producto},{producto_stock: req.body.stock})
    res.send("ok")
})

app.post("/editar-ubicacion",async function(req,res){
    await log_products.findOneAndUpdate({producto_id: req.body.id},{local_ubicacion: req.body.ubicacion})
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

app.post("/borrar-notificacion",async function(req,res){
let notificacion= await log_notificaciones_vendedor.findByIdAndUpdate({_id:req.body.id},{show:false})
res.send("ok")
})

app.post("/borrar-notificacion-comprador",async function(req,res){
    let notificacion= await log_notificaciones_comprador.findByIdAndUpdate({_id:req.body.id},{show:false})
res.send("ok")
})

app.get("/usuarios",async function(req,res){
    let allusers=[]
    let usuarios= await log.find({})
    for(let usuario of usuarios){allusers.push(usuario.usuario)}
    res.json(allusers)
})

app.get("/compra",function(req,res){
    res.render("compra")
})
app.post("/comprar",async function(req,res){console.log("comprar")
    let ofertas2x1= await log_ofertas2x1.find({})
    let ofertas_envios= await log_ofertas_envio.find({})

    if(req.body.unidad<0){return res.statusCode(400)}

    let hay_oferta= false
    let hay_oferta_envio= false

    let compras= await log_compras.find({usuario: req.session.usuario})

    let i=0
   

    if(compras.length!==0){ for(let compra of compras){
        if(!compra.local_ubicacion.includes("no definida")){hay_oferta_envio=false; ++i; break}
    }}

    if(i===0){hay_oferta_envio=true}

   
    let producto= await log_products.find({producto_id: req.session.producto_id})

   if(ofertas2x1.length!==0){ for(let oferta of ofertas2x1){
        if(oferta.productos[0].producto_id===producto[0].producto_id){
            producto.push(oferta.productos[1]); hay_oferta=true
        }
    }}
    let precio1= Number(producto[0].producto_precio.match(/\d+/))
    let unidad=producto[0].producto_precio.match(/[^\d]+/g).toString()

    let precioenvio;
    let unidadenvio;

    if(producto[0].producto_envio){
           precioenvio= Number(producto[0].producto_envio.match(/\d+/))
    unidadenvio=producto[0].producto_precio.match(/[^\d]+/g).toString()

    }
   if(hay_oferta_envio===true){ for(let oferta_envio of ofertas_envios){
        if(oferta_envio.producto_id==producto[0].producto_id){
            precioenvio=0
        }}
    }
  
    if(req.body.envio==="si"){
        if(unidad.toUpperCase()==="US$" && unidadenvio==="$"){precioenvio= precioenvio/dolarAuyu}
        else if(unidad==="$" && unidadenvio.toUpperCase()==="US$"){precioenvio= precioenvio*dolarAuyu}

        precio1+= precioenvio
    }

    async function preferencia(unidad){if(Number(producto[0].producto_stock)>0){
        if(hay_oferta===false){ try{
        const body= {
            items:[{title: producto[0].producto_nombre,
                unit_price: precio1,
                quantity:req.body.unidad,
                currency_id:unidad
            }],  external_reference:req.session.usuario,
            metadata:{id: req.session.producto_id,
                producto: req.session.producto,
                oferta: producto[1],
                direccion: req.body.ubicacion
            },
             payer: {  // ← ESTO ES LO QUE FALTA
                email: "test_user_123456@testuser.com"  // Email de prueba
            },
            back_urls:{
                success: `https://tienda-online-5jo4.onrender.com/tienda/${req.session.usuario}`,
                failure: "http://localhost:3000/pago-fallido",
                pending: "http://localhost:3000/pago-pendiente"
            },
            notification_url: "https://tienda-online-5jo4.onrender.com/webhook"
        };
        const response= await preference.create({body});    
        console.log("init_point:",response.init_point)
        res.json({init_point: response.init_point})
    }catch(error){console.log("error:", error)}}
    else if(hay_oferta===true){
         try{
        const body= {
            items:[{title: producto[0].producto_nombre+" y "+ producto[1].producto_nombre + " (oferta 2x1)",
                unit_price: precio1,
                quantity:1,
                currency_id:unidad
            }],  external_reference:req.session.usuario,
            metadata:{id: req.session.producto_id,
                producto: req.session.producto,
                oferta: producto[1],
                direccion: req.body.ubicacion
            },
             payer: {  // ← ESTO ES LO QUE FALTA
                email: "test_user_123456@testuser.com"  // Email de prueba
            },
            back_urls:{
                success: `https://tienda-online-5jo4.onrender.com/tienda/${req.session.usuario}`,
                failure: "http://localhost:3000/pago-fallido",
                pending: "http://localhost:3000/pago-pendiente"
            },
            notification_url: "https://tienda-online-5jo4.onrender.com/webhook"
        };
        const response= await preference.create({body});    
        console.log("init_point:",response.init_point)
        res.json({init_point: response.init_point})
    }catch(error){console.log("error:", error)}
    }
   }
    else{res.send("no hay stock")}}

    if(unidad==="$"){preferencia("UYU")}
        else if(unidad.toLowerCase()==="us$"){preferencia("USD")}
 
})

app.post("/comprar-carrito",async function(req,res){
    let hay_oferta=false
    let z=0
    let i=0
    let n=0
    let carrito= await log_carrito.find({usuario: req.session.usuario})
    console.log(carrito)
    let coste_envio=0

    let hay_oferta_envio= false

   let ofertas_envios= await log_ofertas_envio.find({})

   let compras= await log_compras.find({usuario: req.session.usuario})

    let a=0
   

    if(compras.length!==0){ for(let compra of compras){
        if(!compra.local_ubicacion.includes("no definida")){hay_oferta_envio=false; ++a; break}
    }}

    if(a===0){hay_oferta_envio=true}


   

    let products= await log_products.find({})
let precio_envio=0
    let preciototal=0
    let num_ofertas=0

    let ofertas2x1= await log_ofertas2x1.find({})
    if(ofertas2x1.length!==0){hay_oferta=true}
    while(i<carrito.length){
        for(let ofertas of ofertas2x1){
            if(ofertas.productos[0].producto_id===carrito[i].producto_id){
                carrito.push(ofertas.productos[1]); ++num_ofertas
            }
        }
        ++i
    }

      while(z<products.length){
                for(let productos of carrito){if(products[z].producto_id===productos.producto_id && products[z].producto_stock==0){
                    res.send("uno de los productos está sin stock, por favor vuélvalo a intentar con los productos disponibles"); return
                }} ++z
            }


    for(let producto of carrito){
        if(hay_oferta_envio===true){for(let oferta_envio of ofertas_envios ){
        if(oferta_envio.producto_id==producto.producto_id){producto.producto_envio=0}
    }}
        if(n>=carrito.length-num_ofertas && hay_oferta===true){console.log("hay ofertiña UwU,n carrito y num de ofertas",n,carrito,num_ofertas)} 
        else{
            let producto_precio= Number(producto.producto_precio.match(/\d+/))
       if(producto.producto_precio.includes("US$")){producto_precio= producto_precio*dolarAuyu}
        preciototal+=producto_precio;

      if(producto.producto_envio){ precio_envio= Number(producto.producto_envio.match(/\d+/)); console.log("precio_envio:", precio_envio)}

        if(producto.producto_envio!==undefined && producto.producto_envio.includes("US$")){
            precio_envio= precio_envio*dolarAuyu}

    if(precio_envio>coste_envio){coste_envio=precio_envio; console.log("coste envio: ", coste_envio)}

if(req.body.ubicacion!==" no definida (se recogerá en el local)"){preciototal+=coste_envio; console.log("hay ubicación")}} ++n
        }
        console.log(preciototal)

        try{
        const body= {
            items:[{title: "carrito",
                unit_price: preciototal,
                quantity:1,
                currency_id:"UYU"
            }],  external_reference:req.session.usuario,
             payer: {  // ← ESTO ES LO QUE FALTA
                email: "test_user_123456@testuser.com"  // Email de prueba
            },metadata:{
                carrito:carrito,
                precio_total: preciototal,
                direccion: req.body.ubicacion
            },
            back_urls:{
                success: `https://tienda-online-5jo4.onrender.com/tienda/${req.session.usuario}`,
                failure: "http://localhost:3000/pago-fallido",
                pending: "http://localhost:3000/pago-pendiente"
            },
            notification_url: "https://tienda-online-5jo4.onrender.com/webhook"
        };
        const response= await preference.create({body});    
        console.log("init_point:",response.init_point)
        res.json({init_point: response.init_point})
    }catch(error){console.log("error:", error)}

})


app.post("/notificaciones-cliente",async function(req,res){
    await log_notificaciones_comprador.create({usuario: req.session.usuario,
        notificacion: req.body.notificacion})
        res.send("ok")
})

app.post("/webhook", async function(req, res) {
    console.log("Webhook recibido:", req.body);
    const { type, data,topic } = req.body;
    
    // MercadoPago envía diferentes tipos de notificaciones
        try { 
        
            if (topic === 'merchant_order' || type === 'merchant_order') {
    console.log("ℹ️ Webhook ignorado - merchant_order");
    return res.sendStatus(200);
}       
              let paymentId; 

            // acá procesás la notificación del pago
                if(data && data.id){
             paymentId = data.id;}
             else{paymentId = req.body.resource?.split("/").pop(); }
                  if(paymentId===undefined){return res.sendStatus(200)}
            await log_pagos_id.create({paymentId: paymentId})

             const paymentInfo= await payment.get({id:paymentId})
               
           
            if(paymentInfo.status="refunded"){
                let compra= await log_compras.find({paymentId:paymentId})
                compra[0].reembolsado= false
                await log_compras.findOneAndDelete({paymentId:paymentId})
                await log_reembolsos.create(compra[0])
            }
            
            // Opcional: Obtener más detalles del pago
            // const payment = await Payment.get({ id: paymentId });
             if(paymentInfo.status==="approved" && !paymentInfo.metadata.carrito){

                 try{ 
                    let producto= await log_products.find({producto_id:paymentInfo.metadata.id})
                    console.log("creando notificacion"); await log_notificaciones_vendedor.create({
        usuario: paymentInfo.external_reference,
        notificacion: `el usuario ${paymentInfo.external_reference} ha comprado el producto ${paymentInfo.metadata.producto}`,
       producto: paymentInfo.metadata.producto

    }); 
    
    if(!paymentInfo.metadata.carrito){await log_compras.create({usuario: paymentInfo.external_reference,
        producto_nombre: paymentInfo.metadata.producto+ "y gratis el producto "+ paymentInfo.metadata.oferta.producto_nombre,
        producto_id:paymentInfo.metadata.id, producto_precio: producto[0].producto_precio, producto_envio: producto[0].producto_envio,
        local_ubicacion: paymentInfo.metadata.direccion,
        Date: new Date(),
        paymentId: paymentId,
        unidades: Number(req.body.unidad)

        
        
    }); console.log("se creo el log de la compra")}  IO.emit("compras")


    
}catch(error){console.log("no se pudo crear la notificación",error)}


                console.log("pago aprobado")
                let producto= await log_products.find({producto_id: paymentInfo.metadata.id})
                console.log("producto del webhook:",producto)
                
        
    if(producto && Number(producto[0].producto_stock)>0){let nuevoproducto= await log_products.findOneAndUpdate({producto_id: producto[0].producto_id},{producto_stock: `${Number(producto[0].producto_stock)-1}`})
        for(let productos of paymentInfo.metadata.carrito){
    if(Number(productos.producto_stock)>0){let nuevoproducto= await log_products.findOneAndUpdate({producto_id: productos.producto_id},{producto_stock: `${Number(productos.producto_stock)-1}`})}
   }}
   
                
             }
             if(paymentInfo.status==="approved" && paymentInfo.metadata.carrito){
           await log_carrito.deleteMany({usuario: paymentInfo.external_reference})
       
        for(let producto of paymentInfo.metadata.carrito){ let product= (await log_products.find({producto_id: producto.producto_id}))[0]
            if(producto.producto_envio!==undefined){
              let precio_envio= Number(producto.producto_envio.match(/\d+/))

        if(producto.producto_envio.includes("US$")){precio_envio= precio_envio*dolarAuyu}
            if(precio_envio>envio){envio=precio_envio}}

            if(Number(product.producto_stock)>0){let nuevoproducto= await log_products.findOneAndUpdate({producto_id: producto.producto_id},{producto_stock: `${Number(product.producto_stock)-1}`})}
        }
          

        try{
            await log_compras.create({usuario: paymentInfo.external_reference,
            productos: paymentInfo.metadata.carrito,
         producto_envio: envio,
        local_ubicacion: paymentInfo.metadata.direccion,
        Date: new Date(),
        paymentId: paymentId,
        precio_total: paymentInfo.metadata.preciototal
        
    });IO.emit("compras")}catch(error){console.log("error creando la notificacion del carrito",error)}
    }
            }catch(error) {
            console.error("❌ Error procesando el pago:", error);
            return res.sendStatus(200)
        }
        
            
            
            
       res.sendStatus(200)  } 
    )

    app.post("/carrito",async function(req,res){
        console.log("producto id session:",req.session.producto_id) //EL SERVIDOR ME ESTÁ DANDO QUE LA ID DEL PRODUCTO ES UN ARCHIVO PNG ?????????? PORFAVOR, ACABEN CON MI SUFRIMIENTO, SI LEEN ESTE COMENTARIO DESACTIVEN MI CUENTA DE GITHUB
        console.log("id del body:",req.body.id)
        if(req.session.producto_id!==req.body.id){res.send("id del cliente distinta del servidor"); return}
        let producto= await log_products.find({producto_id: req.body.id})
        await log_carrito.create({usuario: req.session.usuario,
            producto_nombre: producto[0].producto_nombre,
            producto_precio: producto[0].producto_precio,
            producto_id: Number(req.body.id),
            producto_imagen: producto[0].producto_imagen,
            producto_envio: producto[0].producto_envio
        })

        res.sendStatus(200) //ahhhh me quiero matar amigo, porfavorque la IA me remplace de una vez...

    }

)

    app.get("/ver-carrito",async function(req,res){
     let carrito=   await log_carrito.find({usuario: req.session.usuario})
     res.json(carrito)
    })

    app.get("/tienda/carrito",function(req,res){
        if(req.session.usuario!==undefined){ res.render("carrito",{usuario: req.session.usuario,KEY:process.env.KEY})}
        else{res.send("inicie sesión para usar el carrito")}
    })

    app.post("/quitar-del-carrito",async function(req,res){
        await log_carrito.findOneAndDelete({producto_id: Number(req.body.id)})
        IO.emit("quitar-carrito")
        res.send("ok")
        
    })

    app.get("/compra-carrito",function(req,res){
        res.render("compra-carrito")
    })

    app.get("/ventas",function(req,res){
        res.render("ventas")
    })

    app.get("/ver-ventas",async function(req,res){
       let ventas= await log_compras.find({})
       res.json(ventas)
    })

    app.post("/eliminar-venta",async function(req,res){
     let compra=   await log_compras.findById( req.body.id)
     console.log(compra)
        await log_compras.findByIdAndDelete(req.body.id)
        await log_compras_terminadas.create(
            compra.toObject()
        )
        IO.emit("compras")
        res.send("ok")
    })

    app.get("/ventas-terminadas",function(req,res){
        res.render("ventas-terminadas")
    })

    app.get("/ver-ventas-terminadas",async function(req,res){
     let comprasterminadas= await log_compras_terminadas.find({})
     res.json(comprasterminadas)
    })

    app.post("/crear-oferta-2x1",async function(req,res){
        try{
       let producto1= (await log_products.find({producto_id: Number(req.session.producto_id)}))[0]
       let producto2= (await log_products.find({producto_nombre: req.body.producto2}))
       if(producto2.length===0){res.send("ingrese bien el nombre del producto"); return}
        await log_ofertas2x1.create({productos:[producto1,producto2[0]],
            precio: producto1.producto_precio
        })}
        catch(error){console.log("error creando la oferta",error)}

        res.sendStatus(200)

    })

    app.get("/ver-ofertas2x1",async function(req,res){
        let ofertas2x1= await log_ofertas2x1.find({})
        res.json(ofertas2x1)
    })

    app.post("/borrar-oferta2x1",async function(req,res){
        let ofertas2x1= await log_ofertas2x1.find({})
        for(let oferta2x1 of ofertas2x1){
            if(oferta2x1.productos[0].producto_id===req.body.producto_id){
                await log_ofertas2x1.findByIdAndDelete(oferta2x1._id)
            }
        }
        res.sendStatus(200); return
    })

    app.post("/crear-envio-gratis",async function(req,res){
        await log_ofertas_envio.create({producto_id: req.body.producto_id})
        res.sendStatus(200)
    })

    app.get("/ver-envios-gratis",async function(req,res){
        let ofertas_de_envio= await log_ofertas_envio.find({})
        res.json(ofertas_de_envio)
    })

    app.post("/cambiar-coste-envio",async function(req,res){
        if(!req.body.envio.includes("$") && !req.body.envio.includes("US$")){res.send("ingrese una unidad válida"); return}
      try{await log_products.findOneAndUpdate({producto_id: req.session.producto_id},{producto_envio: req.body.envio
        })
}catch(error){console.log("error",error)}

console.log(req.session.producto_id,req.body.envio)
        
        res.sendStatus(200)
    })

    app.get("/reembolsos",function(req,res){
        res.render("reembolsos")
    })

    app.get("/ver-reembolsos",async function(req,res){
        let reembolsos= await log_reembolsos.find({})
        res.json(reembolsos)
    })

    app.post("/reembolsar",async function(req,res){

        try{await log_reembolsos.findOneAndUpdate({paymentId: req.body.id},{reembolsado: true})} catch(error){console.log(error)}
        
        res.send("ok")
    })

    app.get("/reembolsados",function(req,res){
        res.render("reembolsados")
    })

    app.get("/tickets",function(req,res){
        res.render("tickets")
    })

    app.get("/ver-tickets",async function(req,res){
        let compras= await log_compras.find({usuario: req.session.usuario})
        let compras_terminadas= await log_compras_terminadas.find({usuario:req.session.usuario})

        let tickets= [...compras,...compras_terminadas]
        console.log("tickets:",tickets)
        res.json(tickets)
    })

    app.post("/leer-mensajes",async function(req,res){
     await log_mensajes_cliente.updateMany({usuario: req.body.usuario},{$set: {leido:true}})

     let mensajes= await log_mensajes_cliente.find({})
    IO.emit("mensajes",mensajes)

    res.sendStatus(200)


})

app.post("/enviar-numero",async function(req,res){
    if(!req.body.numero.includes("+")){return res.send("ingrese el numero internacional al principio, ej: +598")}
    try{ await log_numero_vendedor.deleteMany({})
    await log_numero_vendedor.create({numero_del_vendedor: req.body.numero})
res.send("ingreso del numero exitoso")} catch(error){
    console.log("error:",error);
    res.send("error en el ingreso del numero, por favor inteténtelo de nuevo")
}
   

})
//----------------rutas dinámicas--------------------


app.get("/tienda/:nombre",async function(req,res){
    console.log("usuario",req.session.usuario)
    let numero= await log_numero_vendedor.find({})
    let numero_valido= numero[0].numero_del_vendedor.replace("+","")
    let numero_ahora_si_valido_en_serio_UwU= numero_valido.replace(/ /g,"")
    console.log(numero_ahora_si_valido_en_serio_UwU)
    if(req.session.usuario===undefined && req.query.external_reference===undefined){return res.sendFile("login.html",{root:import.meta.dirname})}
     res.render("tienda",{nombre: req.session.usuario,numero: numero_ahora_si_valido_en_serio_UwU})

})

app.get("/producto/:producto/:id",function(req,res){delete req.session.producto_id;
    req.session.producto_id=req.params.id
    console.log("id session:",req.session.producto_id)
    req.session.producto= req.params.producto
    console.log(req.session.usuario)
    if(req.session.usuario==="admin"){console.log(req.session.usuario);
     res.render("producto-admin",{nombre: req.params.producto, id: req.params.id});return
    }
    else{
        res.render("producto",{nombre: req.params.producto,
        usuario: req.session.usuario, id: req.params.id
    })}

    console.log(req.session.usuario)

    if(req.session.producto_id!==req.params.id){}
    console.log("id session:",req.session.producto_id)
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
