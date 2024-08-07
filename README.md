# facebookAutomationPost
Ejecuta el comando npm install en el proyecto

Luego instala el navegador de playwright que es chromium.

Este proyecto automatiza publicaciones en facebook
para que funcione crea una caperta en el root de tu proyecto src/config/facebookConfig.json para almacenar tus cuentas de facebook  y el archivo src/config/postsReport.json
con la siguiente estructura:

**Archivo facebookConfig.json**
```json
{
  "users": []
}
```

**Archivo postsReport.json**

```json
{
  "reports": []
}
```
