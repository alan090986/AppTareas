# 1. Usamos una versión ligera y segura de Node.js
FROM node:20-alpine

# 2. Creamos y definimos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiamos los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# 4. Instalamos únicamente las librerías necesarias para producción (Bcrypt, JWT, MySQL2)
RUN npm ci --only=production

# 5. Copiamos el resto del código fuente del backend
COPY . .

# 6. Exponemos el puerto interno del contenedor (Sintonizado con tu server.js)
EXPOSE 5001

# 7. Comando definitivo para arrancar tu servidor Node en internet
CMD ["node", "server.js"]