const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Conexión a la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'usuarios',
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar la conexión a la base de datos
pool.getConnection()
  .then(connection => {
    console.log('Conexión exitosa a la base de datos');
    connection.release();
  })
  .catch(err => {
    console.error('Error de conexión a la base de datos:', err);
  });

// Redirigir a login.html por defecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Endpoint para verificar si el correo electrónico ya está registrado
app.post('/verificar-email', async (req, res) => {
  const { email } = req.body;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    connection.release();

    res.json({ existe: results.length > 0 });
  } catch (error) {
    console.error('Error al verificar correo electrónico:', error);
    res.status(500).json({ error: 'Error al verificar correo electrónico' });
  }
});

// Endpoint para registrar un nuevo usuario
app.post('/registro', upload.single('fotoPerfil'), async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  const fotoPerfil = req.file;

  if (!fotoPerfil) {
    return res.status(400).send('No se subió ninguna foto de perfil.');
  }

  try {
    const connection = await pool.getConnection();
    const [existingUsers] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      res.status(400).send('El correo electrónico ya está registrado');
      return;
    }

    await connection.query('INSERT INTO usuarios (nombre, email, contrasena, foto_perfil) VALUES (?, ?, ?, ?)', 
      [nombre, email, contrasena, `/uploads/${fotoPerfil.filename}`]);
    
    connection.release();
    res.status(200).send('Registro exitoso');
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).send('Error al registrar usuario');
  }
});

// Endpoint para iniciar sesión
app.post('/login', async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM usuarios WHERE email = ? AND contrasena = ?', [email, contrasena]);
    connection.release();

    if (results.length > 0) {
      res.status(200).json({ success: true, usuario: results[0] });
    } else {
      res.status(401).json({ success: false, message: 'Correo electrónico o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error al verificar credenciales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener todos los usuarios
app.get('/get-users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, nombre, foto_perfil FROM usuarios');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener la lista de usuarios:', error);
    res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
});

// Endpoint para obtener los grupos en los que está un usuario
app.get('/get-user-groups', async (req, res) => {
  const { userId } = req.query;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT g.id, g.nombre, g.foto_grupo 
       FROM grupos g
       JOIN grupo_miembros gm ON g.id = gm.id_grupo
       WHERE gm.id_usuario = ?`,
      [userId]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener los grupos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener los grupos del usuario' });
  }
});



// Endpoint para obtener el historial de mensajes entre dos usuarios
app.get('/get-messages', async (req, res) => {
  const { id_usuario1, id_usuario2 } = req.query;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT c.*, u.nombre AS nombre_usuario 
       FROM chat c
       JOIN usuarios u ON c.id_usuario = u.id 
       WHERE (c.id_usuario1 = ? AND c.id_usuario2 = ?) 
          OR (c.id_usuario1 = ? AND c.id_usuario2 = ?) 
       ORDER BY c.fecha`,
      [id_usuario1, id_usuario2, id_usuario2, id_usuario1]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error while fetching messages:', error);
    res.status(500).json({ error: 'Error al obtener historial de mensajes', details: error.message });
  }
});

// Función para determinar el tipo de archivo basado en la extensión
function determineFileType(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'jfif':
      return 'imagen';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'video';
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'ppt':
    case 'pptx':
    case 'xls':
    case 'xlsx':
      return 'documento';
    default:
      return 'otro';
  }
}

// Endpoint para subir archivos
app.post('/upload', upload.single('file'), async (req, res) => {
  const { id_usuario, id_usuario_destinatario, id_grupo } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No se subió ningún archivo.');
  }

  try {
    const connection = await pool.getConnection();
    const fileType = determineFileType(file.originalname);
    let query, params;
    if (id_grupo) {
      query = 'INSERT INTO chat (id_usuario, contenido, tipo, id_grupo) VALUES (?, ?, ?, ?)';
      params = [id_usuario, `/uploads/${file.filename}`, fileType, id_grupo];
    } else {
      query = 'INSERT INTO chat (id_usuario1, id_usuario2, id_usuario, contenido, tipo) VALUES (?, ?, ?, ?, ?)';
      params = [id_usuario, id_usuario_destinatario, id_usuario, `/uploads/${file.filename}`, fileType];
    }
    const [result] = await connection.query(query, params);

    const [rows] = await connection.query(
      'SELECT c.*, u.nombre AS nombre_usuario FROM chat c JOIN usuarios u ON c.id_usuario = u.id WHERE c.id = ?',
      [result.insertId]
    );

    connection.release();
    if (id_grupo) {
      io.emit('groupMessage', rows[0]);
    } else {
      io.emit('chatMessage', rows[0]);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al manejar el archivo:', error);
    res.status(500).send('Error al manejar el archivo');
  }
});

// Endpoint para crear un grupo
app.post('/create-group', upload.single('fotoPerfilGrupo'), async (req, res) => {
  const { nombre, miembros } = req.body;
  const fotoPerfilGrupo = req.file ? `/uploads/${req.file.filename}` : null;
  const parsedMiembros = JSON.parse(miembros);

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO grupos (nombre, foto_grupo) VALUES (?, ?)', [nombre, fotoPerfilGrupo]);
    const groupId = result.insertId;
    
    for (const miembro of parsedMiembros) {
      await connection.query('INSERT INTO grupo_miembros (id_grupo, id_usuario) VALUES (?, ?)', [groupId, miembro]);
    }
    
    connection.release();
    res.status(200).json({ success: true, groupId });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear grupo', details: error.message });
  }
});

// Endpoint para obtener todos los grupos en los que el usuario es miembro
app.get('/get-groups', async (req, res) => {
  const userId = req.query.userId;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT g.id, g.nombre, g.foto_grupo 
       FROM grupos g
       JOIN grupo_miembros gm ON g.id = gm.id_grupo
       WHERE gm.id_usuario = ?`,
      [userId]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener los grupos:', error);
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
});

// Endpoint para obtener mensajes de grupo
app.get('/get-group-messages', async (req, res) => {
  const { id_grupo } = req.query;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT c.*, u.nombre AS nombre_usuario 
       FROM chat c
       JOIN usuarios u ON c.id_usuario = u.id 
       WHERE c.id_grupo = ? 
       ORDER BY c.fecha`,
      [id_grupo]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener mensajes del grupo:', error);
    res.status(500).json({ error: 'Error al obtener mensajes del grupo', details: error.message });
  }
});

// Endpoint para enviar mensaje a un grupo
// Endpoint para enviar mensaje a un grupo
app.post('/send-group-message', async (req, res) => {
  const { id_usuario, id_grupo, mensaje } = req.body;
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO chat (id_usuario1, id_usuario2, id_usuario, contenido, tipo, id_grupo) VALUES (?, ?, ?, ?, ?, ?)',
      [null, null, id_usuario, mensaje, 'texto', id_grupo]
    );
    const [rows] = await connection.query(
      'SELECT c.*, u.nombre AS nombre_usuario FROM chat c JOIN usuarios u ON c.id_usuario = u.id WHERE c.id = ?',
      [result.insertId]
    );
    connection.release();
    io.emit('groupMessage', rows[0]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al enviar mensaje al grupo:', error);
    res.status(500).json({ error: 'Error al enviar mensaje al grupo', details: error.message });
  }
});

// Manejar conexiones de socket.io
io.on('connection', (socket) => {
  console.log('Nuevo usuario conectado');

  socket.on('chatMessage', async (data) => {
    console.log('Mensaje recibido del cliente:', data);

    const { id_usuario, id_usuario_destinatario, mensaje, tipo } = data;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO chat (id_usuario1, id_usuario2, id_usuario, contenido, tipo) VALUES (?, ?, ?, ?, ?)',
        [id_usuario, id_usuario_destinatario, id_usuario, mensaje, tipo]
      );
      const [rows] = await connection.query(
        'SELECT c.*, u.nombre AS nombre_usuario FROM chat c JOIN usuarios u ON c.id_usuario = u.id WHERE c.id = ?',
        [result.insertId]
      );
      connection.release();
      io.emit('chatMessage', rows[0]);
    } catch (error) {
      console.error('Error al manejar mensaje de chat:', error);
    }
  });

  socket.on('groupMessage', async (data) => {
    console.log('Mensaje de grupo recibido del cliente:', data);

    const { id_usuario, id_grupo, mensaje, tipo } = data;

    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query(
        'INSERT INTO chat (id_usuario, contenido, tipo, id_grupo) VALUES (?, ?, ?, ?)',
        [id_usuario, mensaje, tipo, id_grupo]
      );
      const [rows] = await connection.query(
        'SELECT c.*, u.nombre AS nombre_usuario FROM chat c JOIN usuarios u ON c.id_usuario = u.id WHERE c.id = ?',
        [result.insertId]
      );
      connection.release();
      io.emit('groupMessage', rows[0]);
    } catch (error) {
      console.error('Error al manejar mensaje de grupo:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});
