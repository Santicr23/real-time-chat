document.addEventListener('DOMContentLoaded', async () => {
  const socket = io();

  // Recuperar el usuario actual de sessionStorage
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

  // Obtener el contenedor donde se mostrará el nombre de usuario
  const welcomeMessageContainer = document.getElementById('welcome-message');

  // Mostrar el nombre de usuario si está disponible
  if (welcomeMessageContainer && currentUser) {
    welcomeMessageContainer.innerText = `¡Bienvenido, ${currentUser.nombre}!`;
  } else {
    console.error('No se pudo encontrar el contenedor de mensaje de bienvenida o no hay usuario actual.');
  }

  // Evento para manejar el registro e inicio de sesión
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const contrasena = document.getElementById('contrasena').value;
      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, contrasena }),
        });

        if (!response.ok) {
          throw new Error('Inicio de sesión fallido');
        }

        const data = await response.json();
        const { success, usuario, message } = data;

        if (success) {
          sessionStorage.setItem('currentUser', JSON.stringify(usuario)); // Guardar usuario en sessionStorage
          window.location.href = '/chat.html'; // Redirigir a la página de chat
        } else {
          throw new Error(message || 'Inicio de sesión fallido');
        }

        loginForm.reset(); // Reiniciar formulario de inicio de sesión

      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert(error.message);
      }
    });
  } else {
    console.error('El formulario login-form no se encontró en el documento.');
  }

  // Evento para manejar el registro
  const registroForm = document.getElementById('registro-form');
  if (registroForm) {
    registroForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const nombre = document.getElementById('nombre').value;
      const email = document.getElementById('email-registro').value;
      const contrasena = document.getElementById('contrasena-registro').value;
      const fotoPerfil = document.getElementById('foto-perfil').files[0]; // Obtener el archivo de la imagen de perfil

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('email', email);
      formData.append('contrasena', contrasena);
      formData.append('fotoPerfil', fotoPerfil); // Añadir la imagen de perfil al FormData

      try {
        const response = await fetch('/registro', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Registro fallido');
        }

        alert('Registro exitoso');
        registroForm.reset();

      } catch (error) {
        console.error('Error al registrarse:', error);
        alert(error.message);
      }
    });
  } else {
    console.error('El formulario registro-form no se encontró en el documento.');
  }

  // Mostrar el nombre de usuario si está disponible
  if (welcomeMessageContainer && currentUser) {
    welcomeMessageContainer.innerText = `¡Bienvenido, ${currentUser.nombre}!`;
  } else {
    console.error('No se pudo encontrar el contenedor de mensaje de bienvenida o no hay usuario actual.');
  }

  // Obtener y mostrar lista de usuarios y grupos
  const usersList = document.getElementById('users-list');
  if (usersList) {
    try {
      const response = await fetch('/get-users');
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios');
      }
      const users = await response.json();

      // Filtrar usuarios seleccionados para chat privado
      const selectedUsers = JSON.parse(localStorage.getItem(`selectedUsers_${currentUser.id}`)) || [];
      const filteredUsers = users.filter(user => selectedUsers.includes(user.id));

      displayUsers(filteredUsers, currentUser.id); // Pasar el ID del usuario actual

      // Obtener y mostrar lista de grupos
      await loadGroups();

      // Cargar el último chat abierto si existe en localStorage
      const lastChatUserId = localStorage.getItem('lastChatUserId');
      if (lastChatUserId) {
        await loadMessages(currentUser.id, lastChatUserId);
        const lastChatUser = users.find(user => user.id === parseInt(lastChatUserId));
        if (lastChatUser) {
          updateUserInfo(lastChatUser);
        }
      }
    } catch (error) {
      console.error('Error al obtener la lista de usuarios:', error);
    }
  } else {
    console.error('Elemento users-list no encontrado en el documento.');
  }

  // Función para mostrar la lista de usuarios con botones para crear chat privado
  function displayUsers(users, currentUserId) {
    const usersList = document.getElementById('users-list');
    if (!usersList) {
      console.error('Elemento users-list no encontrado en el documento.');
      return;
    }
    usersList.innerHTML = ''; // Limpiar lista de usuarios
    users.forEach(user => {
      if (user.id !== currentUserId) { // Evitar mostrar el usuario actual
        const listItem = document.createElement('li');
        
        const profileContainer = document.createElement('div');
        profileContainer.classList.add('profile-container');

        const img = document.createElement('img');
        img.src = user.foto_perfil ? `${user.foto_perfil}` : 'ruta/de/imagen/por/defecto'; // Ruta de la foto de perfil
        img.alt = `${user.nombre}'s profile picture`;
        img.classList.add('profile-picture'); // Clase CSS para la foto de perfil
        img.style.cursor = 'pointer'; // Hacer que la imagen sea clicable

        img.addEventListener('click', async () => {
          const destinatarioInput = document.getElementById('usuario-destinatario');
          destinatarioInput.value = user.id;

          console.log(`destinatarioInput value set to: ${destinatarioInput.value}`); // Log para depuración

          await loadMessages(currentUserId, user.id);

          // Guardar el ID del usuario destinatario en localStorage
          localStorage.setItem('lastChatUserId', user.id);

          // Actualizar la foto de perfil y el nombre del usuario en la parte superior del chat
          updateUserInfo(user);
        });

        const span = document.createElement('span');
        span.textContent = ` ${user.nombre}`; // Añadir espacio antes del nombre

        profileContainer.appendChild(img);
        profileContainer.appendChild(span);

        listItem.appendChild(profileContainer); // Añadir el contenedor de la imagen de perfil y nombre al elemento de la lista
        usersList.appendChild(listItem);
      }
    });
  }

  // Función para actualizar la información del usuario en la parte superior del chat
  function updateUserInfo(user, isGroup = false) {
    const userProfilePicture = document.getElementById('user-profile-picture');
    const userName = document.getElementById('user-name');

    userProfilePicture.src = isGroup ? (user.foto_grupo ? `${user.foto_grupo}` : 'ruta/de/imagen/por/defecto') : (user.foto_perfil ? `${user.foto_perfil}` : 'ruta/de/imagen/por/defecto');
    userName.textContent = user.nombre;
  }

  // Función para crear un nuevo grupo
  async function createGroup(groupName, memberIds, fotoPerfilGrupo) {
    try {
      const formData = new FormData();
      formData.append('nombre', groupName);
      formData.append('miembros', JSON.stringify(memberIds)); // Asegurarse de que los miembros se envíen como JSON
      if (fotoPerfilGrupo) {
        formData.append('fotoPerfilGrupo', fotoPerfilGrupo);
      }
  
      const response = await fetch('/create-group', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Error al crear el grupo');
      }
  
      const group = await response.json();
      return group;
    } catch (error) {
      console.error('Error al crear el grupo:', error);
      alert(error.message);
    }
  }

  // Función para cargar usuarios para seleccionar en el modal de crear grupo
  async function loadUsersForGroupSelection() {
    try {
      const response = await fetch('/get-users');
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios');
      }
      const users = await response.json();
      const groupMembersContainer = document.getElementById('group-members');
      groupMembersContainer.innerHTML = ''; // Limpiar lista

      users.forEach(user => {
        if (user.id !== currentUser.id) { // No incluir el usuario actual
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `user-${user.id}`;
          checkbox.value = user.id;

          const label = document.createElement('label');
          label.htmlFor = `user-${user.id}`;
          label.textContent = user.nombre;

          const div = document.createElement('div');
          div.appendChild(checkbox);
          div.appendChild(label);

          groupMembersContainer.appendChild(div);
        }
      });
    } catch (error) {
      console.error('Error al obtener la lista de usuarios:', error);
    }
  }

  // Función para cargar grupos
  async function loadGroups() {
    try {
      const response = await fetch(`/get-groups?userId=${currentUser.id}`);
      if (!response.ok) {
        throw new Error('Error al obtener los grupos');
      }
      const groups = await response.json();
      displayGroups(groups);
    } catch (error) {
      console.error('Error al obtener los grupos:', error);
    }
  }

  // Función para mostrar los grupos en la interfaz
  async function displayGroups(groups) {
    const usersList = document.getElementById('users-list');
    if (!usersList) {
      console.error('Elemento users-list no encontrado en el documento.');
      return;
    }
    groups.forEach(group => {
      const listItem = document.createElement('li');
      
      const profileContainer = document.createElement('div');
      profileContainer.classList.add('profile-container');

      const img = document.createElement('img');
      img.src = group.foto_grupo ? `${group.foto_grupo}` : 'ruta/de/imagen/por/defecto'; // Ruta de la foto de grupo
      img.alt = `${group.nombre}'s profile picture`;
      img.classList.add('profile-picture'); // Clase CSS para la foto de grupo
      img.style.cursor = 'pointer'; // Hacer que la imagen sea clicable

      img.addEventListener('click', async () => {
        const destinatarioInput = document.getElementById('usuario-destinatario');
        destinatarioInput.value = `group_${group.id}`; // Usar un prefijo para identificar chats de grupo

        console.log(`destinatarioInput value set to: ${destinatarioInput.value}`); // Log para depuración

        await loadGroupMessages(group.id);

        // Guardar el ID del grupo en localStorage
        localStorage.setItem('lastChatGroupId', group.id);

        // Actualizar la foto de perfil y el nombre del grupo en la parte superior del chat
        updateUserInfo(group, true); // Segundo parámetro para indicar que es un grupo
      });

      const span = document.createElement('span');
      span.textContent = ` ${group.nombre}`; // Añadir espacio antes del nombre

      profileContainer.appendChild(img);
      profileContainer.appendChild(span);

      listItem.appendChild(profileContainer); // Añadir el contenedor de la imagen de perfil y nombre al elemento de la lista
      usersList.appendChild(listItem);
    });
  }

  // Evento para manejar la creación de grupo
  const createGroupForm = document.getElementById('create-group-form');
  if (createGroupForm) {
    createGroupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const groupName = document.getElementById('group-name').value;
      const selectedUsers = document.querySelectorAll('#group-members input[type="checkbox"]:checked');
      const memberIds = Array.from(selectedUsers).map(checkbox => parseInt(checkbox.value));
      memberIds.push(currentUser.id); // Incluir al usuario actual en el grupo

      const fotoPerfilGrupo = document.getElementById('foto-perfil-grupo').files[0];

      const group = await createGroup(groupName, memberIds, fotoPerfilGrupo);
      if (group) {
        alert(`Grupo "${groupName}" creado exitosamente`);
        const createGroupModal = document.getElementById('createGroupModal');
        createGroupModal.style.display = 'none';
        await loadGroups(); // Recargar la lista de grupos
      }
      window.location.reload();

    });
  }

  // Evento para abrir el modal de crear grupo
  const createGroupBtn = document.getElementById('create-group-btn');
  if (createGroupBtn) {
    createGroupBtn.addEventListener('click', () => {
      const createGroupModal = document.getElementById('createGroupModal');
      createGroupModal.style.display = 'block';
      loadUsersForGroupSelection();
    });
  }

  // Evento para cerrar el modal
  const modalCloseBtns = document.querySelectorAll('.modal .close');
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      modal.style.display = 'none';
    });
  });

  // Evento submit del formulario chat-form
  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const messageInput = document.getElementById('message-input');
      const destinatarioInput = document.getElementById('usuario-destinatario');
      const message = messageInput.value.trim();
      const targetUserId = destinatarioInput.value;

      console.log(`targetUserId: ${targetUserId}`); // Log para depuración

      if (message === '') {
        return;
      }

      if (targetUserId.startsWith('group_')) {
        sendGroupMessage(message, targetUserId.split('_')[1]);
      } else {
        sendMessage(message, targetUserId);
      }

      messageInput.value = '';
    });
  } else {
    console.error('El formulario chat-form no se encontró en el documento.');
  }

  // Evento de clic para el icono de subida de archivos
  const fileUploadIcon = document.getElementById('file-upload-icon');
  const fileInput = document.getElementById('file-input');

  fileUploadIcon.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    const destinatarioInput = document.getElementById('usuario-destinatario');
    const targetUserId = destinatarioInput.value;

    if (!file || !targetUserId) {
      alert('Por favor, selecciona un destinatario antes de subir un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('id_usuario', currentUser.id);
    formData.append('id_usuario_destinatario', targetUserId);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const data = await response.json();
      console.log('Archivo subido:', data);

    } catch (error) {
      console.error('Error al subir el archivo:', error);
    }
  });

  // Función para mostrar mensajes en el cliente
  function displayChatMessage(message) {
    const messageList = document.getElementById('chat-box');
    if (!messageList) {
      console.error('Elemento chat-box no encontrado en el documento.');
      return;
    }
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.id_usuario === currentUser.id ? 'sent-message' : 'received-message');

    let messageContent = '';

    switch (message.tipo) {
      case 'texto':
        messageContent = `
          <p class="username">${message.nombre_usuario}</p>
          <p>${message.contenido}</p>
        `;
        break;
      case 'imagen':
        messageContent = `
          <p class="username">${message.nombre_usuario}</p>
          <img src="${message.contenido}" alt="Imagen" class="chat-image">
        `;
        break;
      case 'audio':
        messageContent = `
          <p class="username">${message.nombre_usuario}</p>
          <audio controls>
            <source src="${message.contenido}" type="audio/mpeg">
            Tu navegador no soporta el elemento de audio.
          </audio>
        `;
        break;
      case 'video':
        messageContent = `
          <p class="username">${message.nombre_usuario}</p>
          <video controls width="250">
            <source src="${message.contenido}" type="video/mp4">
            Tu navegador no soporta el elemento de video.
          </video>
        `;
        break;
      default:
        const fileName = message.contenido.split('/').pop();
        messageContent = `
          <p class="username">${message.nombre_usuario}</p>
          <p>${fileName}</p>
          <a href="${message.contenido}" target="_blank" download="${fileName}">Descargar archivo</a>
        `;
        break;
    }

    messageElement.innerHTML = `
      ${messageContent}
      <span class="timestamp">${new Date(message.fecha).toLocaleString()}</span>
    `;

    messageList.appendChild(messageElement);
    messageList.scrollTop = messageList.scrollHeight; // Scroll hasta el último mensaje
  }

  // Función para cargar mensajes del historial
  async function loadMessages(userId, destinatarioId) {
    console.log(`Cargando mensajes entre ${userId} y ${destinatarioId}`); // Log para depuración

    // Limpiar mensajes anteriores
    const messageList = document.getElementById('chat-box');
    if (messageList) {
      messageList.innerHTML = '';
    }

    try {
      const response = await fetch(`/get-messages?id_usuario1=${userId}&id_usuario2=${destinatarioId}`);
      console.log(`Fetch response status: ${response.status}`); // Log para depuración
      if (!response.ok) {
        throw new Error('Error al obtener historial de mensajes');
      }
      const messages = await response.json();
      console.log('Messages fetched:', messages); // Log para depuración
      messages.forEach(message => displayChatMessage(message));
    } catch (error) {
      console.error('Error al cargar historial de mensajes:', error);
    }
  }

  // Función para cargar mensajes del historial de un grupo
  async function loadGroupMessages(groupId) {
    console.log(`Cargando mensajes del grupo ${groupId}`); // Log para depuración

    // Limpiar mensajes anteriores
    const messageList = document.getElementById('chat-box');
    if (messageList) {
      messageList.innerHTML = '';
    }

    try {
      const response = await fetch(`/get-group-messages?id_grupo=${groupId}`);
      console.log(`Fetch response status: ${response.status}`); // Log para depuración
      if (!response.ok) {
        throw new Error('Error al obtener historial de mensajes del grupo');
      }
      const messages = await response.json();
      console.log('Messages fetched:', messages); // Log para depuración
      messages.forEach(message => displayChatMessage(message));

    } catch (error) {
      console.error('Error al cargar historial de mensajes del grupo:', error);
    }
  }

  // Función para enviar mensajes al servidor
  async function sendMessage(message, destinatario) {
    const userId = currentUser.id;
    console.log(`Enviar mensaje a ${destinatario}`); // Log para depuración
    socket.emit('chatMessage', { id_usuario: userId, mensaje: message, id_usuario_destinatario: destinatario, tipo: 'texto' });
  }

  // Función para enviar mensajes a un grupo
  async function sendGroupMessage(message, groupId) {
    const userId = currentUser.id;
    console.log(`Enviar mensaje al grupo ${groupId}`); // Log para depuración
    socket.emit('groupMessage', { id_usuario: userId, mensaje: message, id_grupo: groupId, tipo: 'texto' });
  }

  // Obtener el modal
  var modal = document.getElementById('imageModal');

  // Obtener la imagen y insertarla dentro del modal
  var modalImg = document.getElementById("img01");
  var captionText = document.getElementById("caption");
  document.querySelectorAll('.chat-image').forEach(img => {
    img.onclick = function(){
      modal.style.display = "block";
      modalImg.src = this.src;
      captionText.innerHTML = this.alt; // Puede ser útil si deseas mostrar un texto alternativo
    }
  });
  
  // Obtener el elemento <span> que cierra el modal
  var span = document.getElementsByClassName("close")[0];

  // Cuando el usuario hace clic en <span> (x), cierra el modal
  span.onclick = function() { 
    modal.style.display = "none";
  }

  // Escuchar mensajes del servidor
  socket.on('chatMessage', (message) => {
    displayChatMessage(message);
  });

  socket.on('groupMessage', (message) => {
    displayChatMessage(message);
  });

  // Eventos de conexión y desconexión de socket
  socket.on('connect', () => {
    console.log('Conectado al servidor');
  });

  socket.on('disconnect', () => {
    console.log('Desconectado del servidor');
  });

  // Evento para abrir el modal de selección de usuarios para iniciar chat privado
  const selectUsersBtn = document.getElementById('select-users-btn');
  if (selectUsersBtn) {
    selectUsersBtn.addEventListener('click', async () => {
      const selectUsersModal = document.getElementById('selectUsersModal');
      if (selectUsersModal) {
        selectUsersModal.style.display = 'block';
      }
      await loadUsersForSelection();
    });
  }

  // Función para cargar usuarios en el modal de selección
  async function loadUsersForSelection() {
    try {
      const response = await fetch('/get-users');
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios');
      }
      const users = await response.json();
      const userSelectionContainer = document.getElementById('user-selection');
      userSelectionContainer.innerHTML = ''; // Limpiar lista

      const selectedUsers = JSON.parse(localStorage.getItem(`selectedUsers_${currentUser.id}`)) || [];

      users.forEach(user => {
        if (user.id !== currentUser.id) { // No incluir el usuario actual
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `user-select-${user.id}`;
          checkbox.value = user.id;
          checkbox.checked = selectedUsers.includes(user.id); // Mantener seleccionados los usuarios previamente seleccionados

          const label = document.createElement('label');
          label.htmlFor = `user-select-${user.id}`;
          label.textContent = user.nombre;

          const div = document.createElement('div');
          div.appendChild(checkbox);
          div.appendChild(label);

          userSelectionContainer.appendChild(div);
        }
      });
    } catch (error) {
      console.error('Error al obtener la lista de usuarios:', error);
    }
  }

  // Evento para manejar la selección de usuarios y actualizar la lista de chats privados
  const selectUsersForm = document.getElementById('select-users-form');
  if (selectUsersForm) {
    selectUsersForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const selectedCheckboxes = document.querySelectorAll('#user-selection input[type="checkbox"]:checked');
      const selectedUserIds = Array.from(selectedCheckboxes).map(checkbox => parseInt(checkbox.value));

      // Guardar los usuarios seleccionados en localStorage
      localStorage.setItem(`selectedUsers_${currentUser.id}`, JSON.stringify(selectedUserIds));

      // Filtrar y mostrar los usuarios seleccionados
      const response = await fetch('/get-users');
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios');
      }
      const users = await response.json();
      const filteredUsers = users.filter(user => selectedUserIds.includes(user.id));
      displayUsers(filteredUsers, currentUser.id);

      const selectUsersModal = document.getElementById('selectUsersModal');
      if (selectUsersModal) {
        selectUsersModal.style.display = 'none';
      }
      window.location.reload();
    });
  }
});
