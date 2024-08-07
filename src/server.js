const express = require("express");
const fs = require("fs/promises"); //para operacion asincronas
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

//Importar la funcion de automatizacion de facebook
const { automatizarFacebook } = require("./facebookAutomation");

app.use(express.json());

//Ruta del archivo JSON de configuracion, apunta al archivo quiero hacer read o write
const configPath = path.join(__dirname, "./config/facebookConfig.json");
// Ruta del archivo JSON para el reporte
const reportPath = path.join(__dirname, "./config/postsReport.json");

//Funcion para leer el archivo JSON
const readConfigFile = async () => {
  const data = await fs.readFile(configPath, "utf-8");
  return JSON.parse(data);
};

//Funcion para escribir el archivo JSON
const writeConfigFile = async (config) => {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2)); // parametro 2 para la sangria y mejorar la legibilidad de lectura.
};

// Función para leer el archivo JSON del reporte
const readReportFile = async () => {
  try {
    const data = await fs.readFile(reportPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error al leer el archivo de reporte:", error);
    throw error; // Propaga el error para que pueda ser manejado en el endpoint
  }
};

//Funcion para escribir el archivo JSON
const writeReportFile = async (config) => {
  await fs.writeFile(reportPath, JSON.stringify(config, null, 2)); // parametro 2 para la sangria y mejorar la legibilidad de lectura.
};

//Endpoint para añadir un usuario
app.post("/addUser", async (req, res) => {
  //Extrae el nuevo usuario del cuerpo de la solicitud (req.body)
  const newUser = req.body;

  try {
    //Lee el contenido del archivo JSON y lo convierte a un objeto JavaScript
    const config = await readConfigFile();
    config.users.push(newUser); // Añadir el nuevo usuario al array

    //Guarda el objeto actualizado de configuracion de vuelta en el archivo JSON
    await writeConfigFile(config);

    //Enviar respuesta de exito al cliente
    res.status(200).json({ message: "Usuario añadido con éxito." });
  } catch (error) {
    console.log("Error durante la adición del usuario:", error);
    res
      .status(500)
      .json({ message: "Se produjo un error al añadir el usuario." });
  }
});

// Endpoint para compartir posts desde el archivo JSON
app.post("/sharePosts", async (req, res) => {
  try {
    const config = await readConfigFile();

    for (const user of config.users) {
      try {
        await automatizarFacebook(user);
      } catch (error) {
        console.log(`Error al automatizar la cuenta de ${user.email}:`, error);
      }
    }

    //Enviar respuesta JSON
    res.status(200).json({
      message: "Automatización de posts completada con éxito.",
    });
  } catch (error) {
    console.error("Error durante sharePosts:", error);
    res.status(500).json({
      message: "Se produjo un error durante la automatización de posts.",
    });
  }
});

//Endpoint para obtener la lista de usuarios
app.get("/getUsers", async (req, res) => {
  try {
    const config = await readConfigFile();
    //Enviar respuesta JSON
    res.status(200).json(config.users);
  } catch (error) {
    console.log("Error al obtener la lista de usuarios:", error);
    res.status(500).json({
      message: "Se produjo un error al obtener la lista de usuarios.",
    });
  }
});

//Endpoint para eliminar un usuario
app.delete("/deleteUser/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const config = await readConfigFile();
    const userIndex = config.users.findIndex((user) => user.email === email);

    if (userIndex === -1) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    //Eliminar el usuario del array
    config.users.splice(userIndex, 1);
    await writeConfigFile(config);

    // Enviar respuesta JSON
    res.status(200).json({ message: "La Cuenta ha sido eliminada con éxito." });
  } catch (error) {
    console.error("Error durante la eliminacion del usuario:", error);
    res
      .status(500)
      .json({ message: "Se produjo un error al eliminar la Cuenta." });
  }
});

//Endpoint para actualizar un usuario
app.put("/updateUser", async (req, res) => {
  const updatedUser = req.body;

  try {
    const config = await readConfigFile();
    const userIndex = config.users.findIndex(
      (user) => user.email === updatedUser.oldEmail
    );

    if (userIndex === -1) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    //Actualizar el usuario en el array
    config.users[userIndex] = {
      ...config.users[userIndex],
      ...updatedUser,
      email: updatedUser.email, // Actualizar email
    };

    await writeConfigFile(config);

    //Enviar respuesta JSON
    res.status(200).json({ message: "Cuenta actualizada con éxito." });
  } catch (error) {
    console.error("Error durante la actualización de la cuenta:", error);
    res
      .status(500)
      .json({ message: "Se produjo un error al actualizar la cuenta." });
  }
});

//Enpoint para obtener el reporte de publicaciones
app.get("/postsReport", async (req, res) => {
  try {
    const report = await readReportFile();
    res.status(200).json(report.reports);
  } catch (error) {
    console.error("Error al obtener el reporte de publicaciones:", error);
    res.status(500).json({
      message: "Se produjo un error al obtener el reporte de publicaciones.",
    });
  }
});

//Endpoint para eliminar el reporte de publicaciones
app.delete("/deleteReport", async (req, res) => {
  try {
    const report = await readReportFile();

    // Verificar si el campo `reports` existe y es un array
    if (!Array.isArray(report.reports)) {
      return res.status(400).json({
        message:
          'El archivo de configuración no contiene un array válido en "reports".',
      });
    }

    //Escribir un array vacio en el archivo
    report.reports = [];
    await writeReportFile(report);

    // Enviar respuesta JSON
    res.status(200).json({ message: "Reporte eliminado con éxito." });
  } catch (error) {
    console.error("Error durante la eliminacion del Reporte:", error);
    res
      .status(500)
      .json({ message: "Se produjo un error al eliminar el Reporte." });
  }
});

// Servir el archivo HTML
app.use(express.static(path.join(__dirname, "../public")));

//Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ message: "Algo salió mal", error: err.message });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
