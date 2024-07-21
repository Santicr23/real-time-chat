-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 21-07-2024 a las 09:32:50
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `usuarios`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chat`
--

CREATE TABLE `chat` (
  `id` int(11) NOT NULL,
  `id_usuario1` int(11) DEFAULT NULL,
  `id_usuario2` int(11) DEFAULT NULL,
  `id_usuario` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `tipo` varchar(50) NOT NULL DEFAULT 'texto',
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_grupo` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `chat`
--

INSERT INTO `chat` (`id`, `id_usuario1`, `id_usuario2`, `id_usuario`, `contenido`, `tipo`, `fecha`, `id_grupo`) VALUES
(123, 16, 15, 16, 'nicaaaaaaaaaa', 'texto', '2024-07-21 05:22:29', NULL),
(125, NULL, NULL, 15, 'grupo2solodiegosantallou', 'texto', '2024-07-21 06:14:54', 13);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupos`
--

CREATE TABLE `grupos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `foto_grupo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grupos`
--

INSERT INTO `grupos` (`id`, `nombre`, `foto_grupo`) VALUES
(8, 'checlomecos', '/uploads/1721541408004-logogrupo.jpeg'),
(9, 'waza', '/uploads/1721541887312-logogrupo.jpeg'),
(10, 'gruposolodiego', '/uploads/1721541930277-logogrupo.jpeg'),
(11, 'gruposolosantallou', '/uploads/1721542006981-logogrupo.jpeg'),
(12, 'grupo2solosantallou', '/uploads/1721542193751-logogrupo.jpeg'),
(13, 'grupo2solodiegosantallou', '/uploads/1721542219431-logogrupo.jpeg'),
(14, 'grupo3solodiego', '/uploads/1721542281965-logogrupo.jpeg'),
(15, 'grupo4solodiego', '/uploads/1721542407836-logogrupo.jpeg');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo_miembros`
--

CREATE TABLE `grupo_miembros` (
  `id_grupo` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grupo_miembros`
--

INSERT INTO `grupo_miembros` (`id_grupo`, `id_usuario`) VALUES
(8, 15),
(9, 16),
(9, 15),
(10, 16),
(11, 15),
(12, 15),
(13, 15),
(13, 16),
(14, 16),
(15, 16);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `contrasena`, `foto_perfil`) VALUES
(15, 'Santallou', 'santallou@123', 'das', '/uploads/1721539305979-pato.jpg'),
(16, 'diego', 'diego@123', 'das', '/uploads/1721539314866-perfil.png');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario1` (`id_usuario1`),
  ADD KEY `id_usuario2` (`id_usuario2`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_grupo` (`id_grupo`);

--
-- Indices de la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `grupo_miembros`
--
ALTER TABLE `grupo_miembros`
  ADD KEY `id_grupo` (`id_grupo`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `chat`
--
ALTER TABLE `chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=127;

--
-- AUTO_INCREMENT de la tabla `grupos`
--
ALTER TABLE `grupos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `chat`
--
ALTER TABLE `chat`
  ADD CONSTRAINT `chat_ibfk_1` FOREIGN KEY (`id_usuario1`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_ibfk_2` FOREIGN KEY (`id_usuario2`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_ibfk_4` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`);

--
-- Filtros para la tabla `grupo_miembros`
--
ALTER TABLE `grupo_miembros`
  ADD CONSTRAINT `grupo_miembros_ibfk_1` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`),
  ADD CONSTRAINT `grupo_miembros_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
