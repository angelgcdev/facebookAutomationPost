// src/facebookAutomation.js

const { chromium } = require("playwright");
const fs = require("fs/promises");
const path = require("path");

const MIN_DELAY = 5000; // Minimo tiempo de espera en milisegundos
const MAX_DELAY = 10000; // Máximo tiempo de espera en milisegundos

// Función para obtener un retraso aleatorio
const getRandomDelay = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

//Funcion para hacer click en un selector con espera
const clickOnSelector = async (page, selector) => {
  await page.waitForSelector(selector, { timeout: 10000 }); //Espera hasta 10 segundos
  await page.click(selector);
};

//Funcion para llenar un campo de texto
const fillField = async (page, selector, value) => {
  await page.waitForSelector(selector, { timeout: 10000 }); //Espera hasta 10 segundos
  await page.fill(selector, value);
};

//Funcion para iniciar sesion en Facebook
const loginToFacebook = async (page, user) => {
  await page.goto("https://www.facebook.com/");
  await fillField(page, "#email", user.email);
  await fillField(page, "#pass", user.password);
  await clickOnSelector(page, "button[name='login']");
  await page.waitForNavigation({ timeout: 30000 }); //Espera hasta 30 segundos
};

const readReportFile = async () => {
  const data = await fs.readFile(
    path.join(__dirname, "./config/postsReport.json"),
    "utf-8"
  );
  return JSON.parse(data);
};

const writeReportFile = async (report) => {
  await fs.writeFile(
    path.join(__dirname, "./config/postsReport.json"),
    JSON.stringify(report, null, 2)
  );
};

// Función Principal de automatización de Facebook
const automatizarFacebook = async (user) => {
  let browser;
  const flagPost = 1; //acumulador
  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 50,
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Iniciar sesión en Facebook
    await loginToFacebook(page, user);

    // Navegar al enlace del post de una página
    await page.goto(user.urlPost);
    await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));

    //Verificar si ya se dio me gusta
    const likeButtonSelector = 'div[aria-label="Me gusta"]';

    try {
      //Esperar a que el boton este presente
      await page.waitForSelector(likeButtonSelector, { timeout: 10000 });

      //Evalua el aria-label del boton
      const isLiked = await page.evaluate((selector) => {
        const button = document.querySelector(selector);
        if (button) {
          const ariaLabel = button.getAttribute("aria-label");
          //Compara el valor de aria-label
          return ariaLabel !== "Me gusta";
        }
        return false;
      }, likeButtonSelector);

      if (!isLiked) {
        await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));
        await clickOnSelector(page, likeButtonSelector);
      } else {
        console.log("Me gusta esta activado");
      }
    } catch (error) {
      console.log(
        'El boton "Me gusta" no se encontro o se produjo un error:',
        error
      );
    }

    // Publicar en los primeros tres grupos
    for (let i = 1; i <= user.postCount; i++) {
      await page.waitForTimeout(user.postInterval * 60000); //intervalo de tiempo entre publicaciones

      //Botón Compartir
      const selector1 =
        'div[aria-label="Envía la publicación a amigos o publícala en tu perfil."]';
      const selector2 =
        'div[aria-label="Envía esto a tus amigos o publícalo en tu perfil."]';
      const selector3 = 'div[aria-label="Compartir"]';

      const firstSelector = await Promise.race([
        page.waitForSelector(selector1, { timeout: 10000 }),
        page.waitForSelector(selector2, { timeout: 10000 }),
        page.waitForSelector(selector3, { timeout: 10000 }),
      ]);

      if (firstSelector) {
        await firstSelector.click();
        console.log(
          "Se hizo clic en el primer selector(compartir) que se resolvió."
        );
      } else {
        throw new Error("Ningún selector se resolvió a tiempo.");
      }

      try {
        await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));
        //Click en el boton 'Grupo'
        await clickOnSelector(
          page,
          'div[role="button"] span:has-text("Grupo")'
        );
      } catch (error) {
        console.error(error);
      }

      //-----------------Opcion auxiliar-------------------------------
      try {
        await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));
        await clickOnSelector(
          page,
          'div[role="button"] span:has-text("Más opciones")'
        );

        await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));
        await clickOnSelector(
          page,
          'div[role="button"] span:has-text("Compartir en un grupo")'
        );
      } catch (error) {
        console.error(error);
      }
      //--------------------------------------------------------------------

      await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));
      await page.waitForSelector('div[role="list"]');

      const titleGroupPost = await page.locator(
        `div[role="listitem"][data-visualcompletion="ignore-dynamic"]:nth-of-type(${i})
  span[class="x193iq5w xeuugli x13faqbe x1vvkbs x1xmvt09 x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x xudqn12 x676frb x1lkfr7t x1lbecb7 xk50ysn xzsf02u x1yc453h"]`
      );

      const titleGroupPostText = await titleGroupPost.textContent();
      console.log(titleGroupPostText);

      await page.click(
        `div[role="list"] div[role="listitem"][data-visualcompletion="ignore-dynamic"]:nth-child(${i})`
      );

      await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));
      await fillField(
        page,
        'div[aria-label="Crea una publicación pública..."]',
        user.message
      );
      await page.keyboard.press("Space");

      await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));
      await clickOnSelector(page, 'div[aria-label="Publicar"]');

      await page.waitForTimeout(getRandomDelay(MIN_DELAY, MAX_DELAY));

      //Actualizar el reporte de publicaciones en el archivo JSON
      const report = await readReportFile();
      const existingReportIndex = report.reports.findIndex(
        (r) => r.email === user.email
      );

      const currentDate = new Date().toISOString();

      if (existingReportIndex !== -1) {
        report.reports[existingReportIndex].postsCount =
          Number(report.reports[existingReportIndex].postsCount) + flagPost;

        report.reports[existingReportIndex].dates.push({
          titleGroupPostText: titleGroupPostText,
          currentDate: currentDate,
        }); //Agrega la fecha actual
      } else {
        report.reports.push({
          email: user.email,
          message: user.message,
          URL: user.urlPost,
          postsCount: flagPost,
          dates: [
            {
              titleGroupPostText: titleGroupPostText,
              currentDate: currentDate,
            },
          ],
        });
      }

      console.log("reporte:", report.reports);

      await writeReportFile(report);
    }

    await browser.close();
  } catch (error) {
    console.log("Se ha producido un error:", error);
    if (browser) {
      await browser.close();
    }
    throw error; // Propagar el error para manejarlo en la ruta del servidor
  }
};

console.log("Exportando automatizarFacebook:", typeof automatizarFacebook);
module.exports = { automatizarFacebook };
