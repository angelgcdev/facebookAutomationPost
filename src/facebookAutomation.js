const { chromium } = require("playwright");

// Función para obtener un retraso aleatorio
const getRandomDelay = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

//Funcion para hacer click en un selector con espera
const clickOnSelector = async (page, selector) => {
  await page.waitForSelector(selector);
  await page.click(selector);
};

//Funcion para llenar un campo de texto
const fillField = async (page, selector, value) => {
  await page.waitForSelector(selector);
  await page.fill(selector, value);
};

//Funcion para iniciar sesion en Facebook
const loginToFacebook = async (page, user) => {
  await page.goto("https://www.facebook.com/");
  await fillField(page, "#email", user.email);
  await fillField(page, "#pass", user.password);
  await clickOnSelector(page, "button[name='login']");
  await page.waitForNavigation();
};

// Función Principal de automatización de Facebook
const automatizarFacebook = async (user) => {
  let browser;
  let totalGroupsShared = 0; //Contador de grupos compartidos
  try {
    browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Iniciar sesión en Facebook
    await loginToFacebook(page, user);

    // Navegar al enlace del post de una página
    await page.goto(user.urlPost);

    // Publicar en los primeros tres grupos
    for (let i = 1; i <= user.postCount; i++) {
      //Botón Compartir
      const selector1 =
        'div[aria-label="Envía la publicación a amigos o publícala en tu perfil."]';
      const selector2 =
        'div[aria-label="Envía esto a tus amigos o publícalo en tu perfil."]';

      const firstSelector = await Promise.race([
        page.waitForSelector(selector1),
        page.waitForSelector(selector2),
      ]);

      if (firstSelector) {
        await firstSelector.click();
        console.log(
          "Se hizo clic en el primer selector(compartir) que se resolvió."
        );
      } else {
        throw new Error("Ningún selector se resolvió a tiempo.");
      }

      await page.waitForTimeout(getRandomDelay(5000, 10000));
      //Click en el boton 'Grupo'
      await clickOnSelector(page, 'div[role="button"] span:has-text("Grupo")');

      await page.waitForTimeout(getRandomDelay(5000, 10000));
      await page.waitForSelector('div[role="list"]');
      await page.click(
        `div[role="list"] div[role="listitem"][data-visualcompletion="ignore-dynamic"]:nth-child(${i})`
      );

      await page.waitForTimeout(getRandomDelay(5000, 10000));
      await fillField(
        page,
        'div[aria-label="Crea una publicación pública..."]',
        user.message
      );
      await page.keyboard.press("Space");

      await page.waitForTimeout(getRandomDelay(5000, 10000));
      await clickOnSelector(page, 'div[aria-label="Publicar"]');

      //Incrementar el contador de grupos compartidos
      totalGroupsShared++;
    }

    await browser.close();

    console.log(`Post compartido en ${totalGroupsShared} grupos.`);
    return totalGroupsShared; //Retorna el total de publicaciones en grupos por usuario
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
