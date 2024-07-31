/**---------VARIABLES---------- */
const automationForm = document.querySelector("#automationForm");
const sharePostsButton = document.querySelector("#sharePostsButton");

const userList = document.querySelector("#users");

const editModal = document.querySelector("#editModal");
const closeModal = document.querySelector("#closeModal");
const editForm = document.querySelector("#editForm");

/**---------FUNCIONES DE RED---------- */

//Solicita datos al servidor y maneja la respuesta
const requestData = async (url, options) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor");
    }

    return response.json();
  } catch (error) {
    showNotification("Se produjo un error durante la solicitud.", false);
    console.error(error); // para depuracion
    return null; //retornar null para evitar errores posteriores
  }
};

//Funcion para compartir publicaciones
const sharePosts = async () => {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };

  const response = await requestData("/sharePosts", options);

  if (response) {
    showNotification("Las publicaciones se han compartido correctamente.");
  } else {
    showNotification("Hubo un problema al compartir las publiciones.", false);
  }
};

//Funcion para añadir usuarios
const addUser = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    urlPost: formData.get("urlPost"),
    message: formData.get("message"),
    postCount: parseInt(formData.get("postCount"), 10 || 1),
  };

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };

  const response = await requestData("/addUser", options);

  if (response) {
    showNotification("La cuenta se ha añadido correctamente.");
    event.target.reset(); //Limpiar el formulario después de añadir el usuario
    loadUsers(); // Recargar la lista de usuarios
  } else {
    showNotification(
      "Hubo problemas al añadir la cuenta. Por favor, inténtelo de nuevo",
      false
    );
  }
};

/**---------FUNCIONES DE MANEJO DE DATOS---------- */

//Funcion para cargar y mostrar usuarios
const loadUsers = async () => {
  const users = await requestData("/getUsers");

  if (users) {
    userList.innerHTML = ""; //Limpiar la lista
    let userCount = 0; //Variable para contar usuarios

    users.forEach((user) => {
      const listItem = document.createElement("li");
      listItem.classList.add("user-list__item");

      const emailSpan = document.createElement("span");
      emailSpan.classList.add("user-list__item-email", "user-list__span");
      emailSpan.textContent = `${user.email}`;
      listItem.appendChild(emailSpan);

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("user-list__item-message", "user-list__span");
      messageSpan.textContent = `Mensaje: ${user.message}`;
      listItem.appendChild(messageSpan);

      const postsSpan = document.createElement("span");
      postsSpan.classList.add("user-list__item-posts", "user-list__span");
      postsSpan.textContent = `Publicaciones Pendientes: ${user.postCount}`;
      listItem.appendChild(postsSpan);

      listItem.appendChild(createEditButton(user));
      listItem.appendChild(createDeleteButton(user.email));

      userList.appendChild(listItem);

      userCount++;
    });

    //Mostrar el conteo de usuarios en el UI
    const userCountDisplay = document.querySelector("#userCount");
    if (userCountDisplay) {
      userCountDisplay.textContent = `Nùmero de Cuentas: ${userCount}`;
    }
  }
};

//Función para editar un usuario
const editUser = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    urlPost: formData.get("urlPost"),
    message: formData.get("message"),
    postCount: parseInt(formData.get("postCount"), 10) || 1,
    oldEmail: formData.get("oldEmail"),
  };

  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };

  const response = await requestData("/updateUser", options);

  if (response) {
    showNotification("La cuenta se ha actualizado correctamente.");
    closeEditModal();
    loadUsers(); //Recargar la lista de usuarios
  } else {
    showNotification(
      "Hubo problemas al actualizar la cuenta. Por favor, inténtelo de nuevo",
      false
    );
  }
};

//Funcion para cerrar el modal de edición
const closeEditModal = () => {
  editModal.style.display = "none";
};

//Función para crear el botón de edición
const createEditButton = (user) => {
  const editButton = document.createElement("button");
  editButton.classList.add("button", "button--edit");
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => openEditModal(user));
  return editButton;
};

//Funcion para abrir el modal de edicion
const openEditModal = (user) => {
  document.querySelector("#editEmail").value = user.email;
  document.querySelector("#editPassword").value = user.password;
  document.querySelector("#editUrlPost").value = user.urlPost;
  document.querySelector("#editMessage").value = user.message;
  document.querySelector("#editPostCount").value = user.postCount;
  document.querySelector("#editOldEmail").value = user.email;
  editModal.style.display = "block";
};

//Funcion para crear un botón de eliminacion de usuario
const createDeleteButton = (userEmail) => {
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("button", "button--delete");
  deleteButton.textContent = "Eliminar";
  deleteButton.addEventListener("click", () => handleDeleteUser(userEmail));
  return deleteButton;
};

//Funcion para manejar la eliminacion de un usuario
const handleDeleteUser = async (userEmail) => {
  const confirmDelete = confirm(
    "¿Esta seguro de que deseas eliminar esta cuenta? Esta accion no se puede deshacer."
  );
  if (confirmDelete) {
    const response = await requestData(
      `/deleteUser/${encodeURIComponent(userEmail)}`,
      { method: "DELETE" }
    );
    if (response) {
      console.log("Usuario eliminado con exito"); // para depuracion
      loadUsers(); // Recargar la lista de usuarios despues de eliminar
    } else {
      console.log("Error al eliminar el usuario"); // para depuracion
    }
  }
};

//Funcion para alternar la visibilidad de la contraseña
const togglePasswordVisibility = () => {
  const passwordField = document.querySelector(".password");
  const toggleButton = document.querySelector(".togglePassword");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    toggleButton.textContent = "Ocultar Contraseña";
  } else {
    passwordField.type = "password";
    toggleButton.textContent = "Mostrar Contraseña";
  }
};

/**---------FUNCIONES DE UI---------- */

//Mostrar mensajes de notificacion
const showNotification = (message, isSuccess = true) => {
  const notification = document.createElement("div");
  notification.classList.add(
    "notification",
    isSuccess ? "notification--success" : "notification--error"
  );
  const notificationText = document.createElement("p");
  notificationText.classList.add("notification__text");
  notificationText.textContent = message;
  notification.appendChild(notificationText);
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 4000);
};

/**---------FUNCIONES DE REPORTES---------- */

//Función para abrir el modal del reporte
const openReportModal = async () => {
  try {
    const report = await requestData("/postsReport");
    if (report) {
      const reportContent = document.querySelector("#reportContent");
      reportContent.innerHTML = ""; //Limpiar el contenido previo

      report.forEach((post) => {
        const postElement = document.createElement("div");
        postElement.classList.add("report-post__item");

        postElement.innerHTML = `
        <p class="report-post__text"><strong>Cuenta:</strong> ${post.email}</p>
        <p class="report-post__text"><strong>Mensaje:</strong> ${
          post.message
        }</p>
        <p class="report-post__text"><strong>URL:</strong> <a href="${
          post.URL
        }" target="_blank">${post.URL}</a></p>
        <p class="report-post__text"><strong>Cantidad de Publicaciones:</strong> ${
          post.postsCount
        }</p>
        <p class="report-post__text"><strong>
        Fecha(s):</strong>
        <ul class="date-list">
        ${post.dates
          .map((date) => `<li>${new Date(date).toLocaleString()}</li>`)
          .join("")}
        </ul>
        </p>
        `;

        reportContent.appendChild(postElement);
      });

      document.querySelector("#reportModal").style.display = "block";
    }
  } catch (error) {
    showNotification("Error al cargar el reporte:", false);
    console.error(error);
  }
};

//Funcion para cerrar el modal del reporte
const closeReportModal = () => {
  document.querySelector("#reportModal").style.display = "none";
};

/**---------LISTENERS---------- */

const cargarEventListeners = () => {
  //Cargar los usuarios cuando el contenido del DOM esté completamente cargado
  document.addEventListener("DOMContentLoaded", loadUsers);

  //Dispara cuando se hace click en añadir cuenta
  automationForm.addEventListener("submit", addUser);

  //Dispara cuando se hace click en share posts
  sharePostsButton.addEventListener("click", sharePosts);

  //Toggle button para contraseñas
  document
    .querySelector(".togglePassword")
    .addEventListener("click", togglePasswordVisibility);

  //Se dispara cuando se hace click en el boton "Guardar Cambios"
  editForm.addEventListener("submit", editUser);

  //Se dispara cuando se hace click en cerrar el modal
  closeModal.addEventListener("click", closeEditModal);

  //Se dispara cuando se hace click fuera del modal
  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal();
    }
  });

  //se dispara cuando se hace clien en el boton 'Ver Reporte de Publicaciones'
  document
    .querySelector("#viewReportButton")
    .addEventListener("click", openReportModal);

  //Se dispara cuando se hace click en el boton 'X' del reportModal
  document
    .querySelector("#closeReportModal")
    .addEventListener("click", closeReportModal);

  //Cerrar el modal si se hace click fuera de el
  window.addEventListener("click", (event) => {
    if (event.target === document.querySelector("#reportModal")) {
      closeReportModal();
    }
  });
};

//Llama a la funcion para cargar los listeners
cargarEventListeners();
