#  Marketplace - Tienda Online

Una tienda online completa construida con Node.js, Express, MongoDB y Socket.io (El CSS y las animaciones las hizo la IA). Permite gestionar productos, procesar pagos con MercadoPago, y comunicarse en tiempo real entre compradores y vendedor. 

---

##  Características

- **Tienda pública** con búsqueda de productos
- **Sistema de usuarios** con registro, login y sesiones seguras
- **Carrito de compras** con soporte para múltiples productos
- **Pagos integrados** con MercadoPago
- **Chat en tiempo real** entre compradores y vendedor (Socket.io)
- **Panel de administración** para gestionar productos, ventas y notificaciones
- **Notificaciones** para compradores y vendedor
- **Comentarios y respuestas** en productos
- **Ofertas 2x1** y primer envío gratis
- **Tickets de compra** para los usuarios
- **Historial de ventas** y ventas terminadas con estadísticas
- **Sistema de reembolsos**
- **Soporte de múltiples imágenes** por producto
- **Integración con WhatsApp** del vendedor
- **Cotización automática** del dólar (UYU)
- **estética hecha con IA**

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js + Express | Servidor y rutas |
| MongoDB + Mongoose | Base de datos |
| Socket.io | Mensajería y notificaciones en tiempo real |
| EJS | Motor de plantillas |
| MercadoPago SDK | Procesamiento de pagos |
| Multer | Subida de imágenes |
| bcryptjs | Encriptación de contraseñas |
| express-session | Manejo de sesiones |

---

## comprador (imagenes)
<img width="1360" height="768" alt="Screenshot_2026-02-24_17_13_05" src="https://github.com/user-attachments/assets/fc26c545-0596-4428-9eda-6f0361572e3a" />


## Admin (imagenes)

**home del vendedor**
<img width="1360" height="768" alt="Screenshot_2026-02-24_17_04_59" src="https://github.com/user-attachments/assets/d7040f19-9020-43bb-a24a-af6d557c2171" />

**mensajería del vendedor**
<img width="1360" height="768" alt="Screenshot_2026-02-24_17_08_59" src="https://github.com/user-attachments/assets/c2f7aee8-90ab-44e7-99e9-417c900e472c" />

**publicar cambios del producto**
<img width="1360" height="768" alt="Screenshot_2026-02-24_17_11_12" src="https://github.com/user-attachments/assets/c6d25043-bf59-4311-811a-7947f55b8aa4" />



## Estructura del Proyecto

```
├── index.js                        # Servidor principal
├── views/                          # Plantillas EJS
│   ├── tienda.ejs                  # Tienda pública
│   ├── tienda-admin.ejs            # Panel de administración
│   ├── producto.ejs                # Vista de producto
│   ├── producto-admin.ejs          # Editar producto
│   ├── carrito.ejs                 # Carrito de compras
│   ├── compra.ejs                  # Formulario de compra
│   ├── compra-carrito.ejs          # Compra del carrito
│   ├── mensajes-cliente.ejs        # Chat del cliente
│   ├── mensajes-vendedor.ejs       # Chat del vendedor
│   ├── ventas.ejs                  # Panel de ventas
│   ├── ventas-terminadas.ejs       # Historial de ventas
│   ├── tickets.ejs                 # Tickets del usuario
│   └── ...
├── base_de_datos_mongo/            # Modelos de MongoDB
│   ├── mongo.js                    # Usuarios
│   ├── mongo-productos.js          # Productos
│   ├── mongo-carrito.js            # Carrito
│   ├── mongo-compras.js            # Compras activas
│   ├── mongo-compras-terminadas.js # Historial de compras
│   ├── mongo-mensajes-cliente.js   # Mensajes
│   ├── mongo-notificaciones-*.js   # Notificaciones
│   ├── mongo-ofertas.js            # Ofertas 2x1
│   ├── mongo-ofertas_envio.js      # Ofertas envío gratis
│   ├── mongo-reembolsos.js         # Reembolsos
│   └── ...
├── public/                         # Archivos estáticos e imágenes subidas
├── login.html                      # Página de login
├── registro1.html                  # Página de registro
└── package.json
```

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
URL=mongodb+srv://tu_usuario:tu_contraseña@cluster.mongodb.net/tu_base_de_datos
SECRET=tu_secreto_de_sesion
TOKEN=tu_access_token_de_mercadopago
KEY=tu_public_key_de_mercadopago
PORT=3000
```

### 4. Iniciar el servidor

```bash
node index.js
```

Abre tu navegador en `http://localhost:3000`

---

##  Uso

### Para compradores
1. Regístrate o entra como visitante
2. Explora los productos disponibles
3. Agrega productos al carrito o cómpralos directamente
4. Completa el pago con MercadoPago
5. Consulta tus tickets de compra

### Para el administrador
1. Inicia sesión con la cuenta `admin`
2. Accede al panel en `/tienda/admin`
3. Publica y gestiona productos
4. Revisa ventas, mensajes y notificaciones
5. Marca ventas como terminadas y gestiona reembolsos

---

## 🔌 Rutas Principales

| Ruta | Método | Descripción |
|---|---|---|
| `/` | GET | Tienda pública (visitante) |
| `/tienda` | GET | Tienda (usuario autenticado) |
| `/tienda/admin` | GET | Panel de administración |
| `/data` | GET/POST | Login y registro |
| `/verproductos` | GET | API - listar productos |
| `/products` | POST | Crear producto |
| `/comprar` | POST | Iniciar pago individual |
| `/comprar-carrito` | POST | Iniciar pago del carrito |
| `/webhook` | POST | Webhook de MercadoPago |
| `/mensajeria/:usuario` | GET | Chat |
| `/tickets` | GET | Tickets del usuario |
| `/ventas` | GET | Panel de ventas (admin) |

---

##  Pagos con MercadoPago

El sistema utiliza MercadoPago para procesar pagos. Los pagos se procesan a través de preferencias de pago y se reciben confirmaciones vía webhook en `/webhook`.

Soporte de monedas:
- **Pesos uruguayos ($)**
- **Dólares (US$)** con conversión automática

---

## Funcionalidades Destacadas

### Ofertas
- **2x1**: Al comprar un producto, el cliente se lleva otro gratis
- **Primer envío gratis**: Descuento en el primer envío de un producto

### Chat en tiempo real
Comunicación directa entre compradores y el vendedor usando WebSockets (Socket.io)

### Galería de imágenes
Cada producto puede tener hasta 6 imágenes con navegación por flechas y miniaturas

---

##  Requisitos

- Node.js 18+
- MongoDB Atlas o instancia local
- Cuenta de MercadoPago con credenciales de API

---

## 📄 Licencia

Este proyecto no se puede vender sin mi consentimiento
