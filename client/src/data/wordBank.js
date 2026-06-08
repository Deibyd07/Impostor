// Banco de palabras — 15 categorías x 30 palabras

export const categories = {
  animales:    { label: 'Animales',     icon: '🦁' },
  comida:      { label: 'Comida',       icon: '🍣' },
  lugares:     { label: 'Lugares',      icon: '🏖' },
  objetos:     { label: 'Objetos',      icon: '🧭' },
  peliculas:   { label: 'Películas',    icon: '🎬' },
  deportes:    { label: 'Deportes',     icon: '⚽' },
  profesiones: { label: 'Profesiones',  icon: '👔' },
  emociones:   { label: 'Emociones',    icon: '💔' },
  naturaleza:  { label: 'Naturaleza',   icon: '🌋' },
  tecnologia:  { label: 'Tecnología',   icon: '💾' },
  historia:    { label: 'Historia',     icon: '⚔️' },
  misterio:    { label: 'Misterio',     icon: '🕵️' },
  colombia:    { label: 'Colombia 🇨🇴',  icon: '🇨🇴' },
}

export const wordBank = {
  animales: ['Elefante','Delfín','Cóndor','Tarántula','Mantarraya','Guepardo','Pingüino','Orca','Camaleón','Pulpo','Murciélago','Koala','Tiburón','Jaguar','Búho','Erizo','Llama','Capibara','Ornitorrinco','Hipopótamo','Mariposa','Cocodrilo','Caballo','Ardilla','Lobo','Águila','Tortuga','Mapache','Foca','Avestruz'],
  comida: ['Sushi','Arepa','Ceviche','Fondue','Ramen','Empanada','Pizza','Lasaña','Tacos','Paella','Hamburguesa','Croissant','Bandeja Paisa','Sancocho','Hummus','Risotto','Falafel','Tamales','Curry','Cazuela','Tartar','Morcilla','Ajiaco','Kebab','Quesadilla','Crepe','Bagel','Pretzel','Ñoquis','Carbonara'],
  lugares: ['Playa','Volcán','Aeropuerto','Mercado','Catedral','Faro','Desierto','Selva','Cementerio','Castillo','Hospital','Universidad','Biblioteca','Estadio','Museo','Pirámide','Glaciar','Cascada','Pantano','Cueva','Manicomio','Subway','Penthouse','Cabaña','Iglú','Monasterio','Observatorio','Astillero','Pozo','Mausoleo'],
  objetos: ['Telescopio','Brújula','Candado','Reloj de Arena','Pergamino','Lupa','Daga','Linterna','Espejo','Bastón','Martillo','Antifaz','Trofeo','Sello','Ancla','Vela','Llave','Mochila','Gafas','Pulsera','Navaja','Yunque','Termómetro','Caleidoscopio','Ábaco','Caja Fuerte','Trípode','Bolígrafo','Caja Musical','Calabozo'],
  peliculas: ['Titanic','Matrix','Coco','El Padrino','Parasite','Avatar','Interestelar','Inception','Joker','Gladiador','Forrest Gump','Up','Frozen','Ratatouille','Toy Story','Shrek','Pulp Fiction','Star Wars','Harry Potter','Pirates del Caribe','El Rey León','Bambi','Bohemian Rhapsody','La La Land','Memento','Whiplash','Amélie','Cisne Negro','Dunkerque','Drive'],
  deportes: ['Surf','Esgrima','Polo','Escalada','Waterpolo','Lucha Libre','Béisbol','Tenis','Boxeo','Sumo','Karate','Patinaje','Esquí','Jiu-jitsu','Bádminton','Hípica','Rugby','Softbol','Pesca','Triatlón','Voleibol','Golf','Snowboard','Ciclismo','Atletismo','Buceo','Yoga','Parkour','Tiro con Arco','Tenis de Mesa'],
  profesiones: ['Forense','Sommelier','Arqueólogo','Locutor','Taxidermista','Cirujano','Astronauta','Bombero','Carpintero','Veterinario','Detective','Notario','Periodista','Tatuador','Bibliotecario','Mecánico','Joyero','Cartero','Diseñador','Soplador de Vidrio','Relojero','Pirotécnico','Bailarín','Geólogo','Marinero','Domador','Comediante','Cazatalentos','Ilusionista','Soldador'],
  emociones: ['Nostalgia','Euforia','Celos','Asombro','Melancolía','Rabia','Vergüenza','Orgullo','Ansiedad','Calma','Esperanza','Compasión','Envidia','Aburrimiento','Curiosidad','Pánico','Cariño','Decepción','Frustración','Ternura','Resentimiento','Alegría','Tristeza','Confianza','Inseguridad','Alivio','Asco','Gratitud','Desprecio','Fascinación'],
  naturaleza: ['Aurora Boreal','Tornado','Géiser','Manglar','Corriente Marina','Tsunami','Arcoíris','Selva','Iceberg','Coral','Tundra','Acantilado','Meteoro','Pantano','Constelación','Atolón','Sabana','Estepa','Eclipse','Helada','Niebla','Tormenta','Marea','Brisa','Volcán','Estalactita','Duna','Bahía','Quebrada','Fiordo'],
  tecnologia: ['Algoritmo','Firewall','Dron','Satélite','Aplicación','Servidor','Holograma','Robot','Microchip','Inteligencia Artificial','Pixel','Bluetooth','Criptomoneda','Realidad Virtual','Streaming','Antivirus','Router','Red Social','Código QR','Impresora 3D','Procesador','Cookie','Monitor','Pantalla Táctil','GPS','Nube','Memoria USB','Fibra Óptica','5G','Captcha'],
  historia: ['Gladiador','Faraón','Samurái','Vikingo','Alquimista','Conquistador','Cortesano','Caballero','Pirata','Cruzado','Mosquetero','Reina','Bárbaro','Romano','Inquisidor','Profeta','Cazador','Bufón','Espadachín','Guerrero','Centurión','Herrero','Senador','Druida','Cartógrafo','Astrónomo','Embajador','Inventor','Cardenal','Esclavo'],
  misterio: ['Fantasma','Conspiración','Espía','Código Morse','Tótem','Tarot','Tablero Ouija','Maldición','Profecía','Ritual','Reliquia','Ovni','Hechizo','Vampiro','Hombre Lobo','Sacrificio','Cripta','Catacumba','Médium','Exorcista','Bruja','Premonición','Telepatía','Levitación','Reencarnación','Talismán','Pacto','Triángulo de las Bermudas','Profanación','Conjuro'],
  colombia: ['Café','Vallenato','Esmeralda','Cumbia','Wayuu','Chiva','Sancocho','Arepa','Aguardiente','Bandeja Paisa','Tejo','Caldas','Cartagena','Medellín','Cocora','Tayrona','Macondo','Mochila','Bambuco','Lechona','Buñuelo','Sombrero Vueltiao','Mondongo','Chicha','Frailejón','Pacífico','Páramo','Río Magdalena','Boyacá','Arequipe'],
}

// Pares para modo CIEGO — palabras relacionadas por proximidad
export const relatedWords = {
  // Lugares
  Playa: ['Costa', 'Lago', 'Río', 'Piscina', 'Delta', 'Bahía', 'Laguna', 'Estanque'],
  Volcán: ['Montaña', 'Cráter', 'Géiser', 'Caverna', 'Acantilado'],
  Desierto: ['Sabana', 'Estepa', 'Duna', 'Llanura'],
  Selva: ['Bosque', 'Jungla', 'Manglar', 'Pantano'],
  Castillo: ['Palacio', 'Fortaleza', 'Mansión', 'Torre'],
  // Animales
  Elefante: ['Rinoceronte', 'Hipopótamo', 'Búfalo', 'Mamut'],
  Delfín: ['Tiburón', 'Ballena', 'Orca', 'Foca'],
  Tigre: ['León', 'Leopardo', 'Jaguar', 'Pantera'],
  Águila: ['Halcón', 'Cóndor', 'Buitre', 'Búho'],
  // Comida
  Sushi: ['Sashimi', 'Ramen', 'Tempura', 'Maki'],
  Pizza: ['Lasaña', 'Calzone', 'Focaccia', 'Bruschetta'],
  Tacos: ['Burrito', 'Quesadilla', 'Enchilada', 'Tostada'],
  Hamburguesa: ['Sándwich', 'Hot Dog', 'Wrap', 'Bocadillo'],
  // Profesiones
  Forense: ['Detective', 'Médico', 'Patólogo', 'Cirujano'],
  Astronauta: ['Piloto', 'Aviador', 'Cosmonauta', 'Capitán'],
  Bombero: ['Paramédico', 'Policía', 'Socorrista', 'Rescatista'],
  // Tecnología
  Dron: ['Satélite', 'Helicóptero', 'Avión', 'Misil'],
  Robot: ['Androide', 'Cyborg', 'Autómata', 'Drone'],
  // Naturaleza
  Tornado: ['Huracán', 'Tifón', 'Ciclón', 'Tormenta'],
  Iceberg: ['Glaciar', 'Témpano', 'Polo', 'Banco de Hielo'],
  // Música
  // Default fallbacks — si la palabra no tiene par definido, se busca otra de la misma categoría
}
