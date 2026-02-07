/**
 * Spanish (es-ES / Español) Translations for Tallow
 *
 * Translation Notes:
 * - Uses formal "usted" forms for UI elements
 * - Gendered nouns use masculine form as default (standard convention)
 * - Date format: DD/MM/YYYY (European standard)
 * - Number format: 1.000,00 (European notation)
 * - Professional terminology for technical features
 *
 * Structure matches English locale for consistency.
 */

export default {
  common: {
    appName: 'Tallow',
    tagline: 'Transferencia Segura de Archivos',
    loading: 'Cargando...',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    close: 'Cerrar',
    back: 'Atrás',
    next: 'Siguiente',
    prev: 'Anterior',
    search: 'Buscar...',
    noResults: 'No se encontraron resultados',
    retry: 'Reintentar',
    copy: 'Copiar',
    copied: 'Copiado',
    share: 'Compartir',
    download: 'Descargar',
    upload: 'Subir',
    create: 'Crear',
    edit: 'Editar',
    remove: 'Eliminar',
    clear: 'Limpiar',
    view: 'Ver',
    hide: 'Ocultar',
    show: 'Mostrar',
    more: 'Más',
    less: 'Menos',
    yes: 'Sí',
    no: 'No',
    ok: 'Aceptar',
    done: 'Hecho',
    submit: 'Enviar',
    continue: 'Continuar',
    learnMore: 'Más información',
    getStarted: 'Comenzar',
    viewAll: 'Ver todo',
    optional: 'Opcional',
    required: 'Requerido',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
  },

  nav: {
    home: 'Inicio',
    features: 'Características',
    security: 'Seguridad',
    pricing: 'Precios',
    docs: 'Documentación',
    about: 'Acerca de',
    transfer: 'Abrir Aplicación',
    settings: 'Configuración',
    profile: 'Perfil',
    account: 'Cuenta',
    signIn: 'Iniciar Sesión',
    signOut: 'Cerrar Sesión',
    help: 'Ayuda',
    contact: 'Contacto',
    faq: 'Preguntas Frecuentes',
    blog: 'Blog',
    status: 'Estado',
    github: 'GitHub',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
  },

  hero: {
    title: 'Transferencias de archivos.',
    titleGradient: 'Seguras contra computadoras cuánticas.',
    subtitle: 'Transfiera archivos directamente entre dispositivos con cifrado de grado militar. Sin servidores, sin seguimiento, sin límites. Sus datos son suyos.',
    cta: 'Comenzar Transferencias',
    secondaryCta: 'Documentación',
    badge: 'Ahora con cifrado resistente a computadoras cuánticas',
    stats: {
      encryption: {
        value: '256 bits',
        label: 'Cifrado',
      },
      servers: {
        value: 'Cero',
        label: 'Servidores',
      },
      private: {
        value: '100%',
        label: 'Privado',
      },
    },
  },

  features: {
    title: 'Diseñado para seguridad y velocidad',
    description: 'Todo lo que necesita para transferencias de archivos seguras, sin compromisos.',
    moreTitle: 'Y hay más',
    moreDescription: 'Cada detalle considerado para la mejor experiencia de transferencia de archivos.',
    comparisonTitle: 'Cómo se compara Tallow',
    comparisonDescription: 'Vea cómo nos comparamos con los servicios tradicionales de intercambio de archivos.',

    localSharing: 'Red Local',
    internetSharing: 'P2P por Internet',
    friendsSharing: 'Amigos',

    endToEndEncryption: {
      title: 'Cifrado de Extremo a Extremo',
      description: 'Sus archivos se cifran con AES-256-GCM antes de abandonar su dispositivo. Solo el destinatario previsto puede descifrarloss.',
      details: [
        'Cifrado AES-256-GCM de grado militar',
        'Claves generadas nuevamente para cada transferencia',
        'Arquitectura de conocimiento cero',
      ],
    },

    postQuantumCrypto: {
      title: 'Criptografía Resistente a Computadoras Cuánticas',
      description: 'Protección a prueba de futuro utilizando encapsulación de claves ML-KEM (Kyber). Seguro contra ataques de computadoras cuánticas.',
      details: [
        'ML-KEM-768 estandarizado por NIST',
        'Híbrido clásico + resistente a computadoras cuánticas',
        'Secreto futuro garantizado',
      ],
    },

    directP2P: {
      title: 'Transferencia P2P Directa',
      description: 'Los archivos viajan directamente entre dispositivos usando WebRTC. Ningún servidor en la nube almacena sus datos.',
      details: [
        'Canales de datos WebRTC',
        'Soporte para recorrido NAT',
        'Sin almacenamiento intermedio',
      ],
    },

    groupTransfers: {
      title: 'Transferencias en Grupo',
      description: 'Envíe archivos a hasta 10 destinatarios simultáneamente. Cada destinatario obtiene copias cifradas individualmente.',
      badge: 'Hasta 10',
    },

    metadataStripping: {
      title: 'Eliminación de Metadatos',
      description: 'Elimina automáticamente datos EXIF, coordenadas GPS y otros metadatos de imágenes y documentos.',
    },

    resumableTransfers: {
      title: 'Transferencias Reanudables',
      description: '¿Interrupciones de red? Las transferencias se reanudan automáticamente desde el byte exacto donde se detuvieron.',
    },

    nativeSpeed: {
      title: 'Velocidad Nativa',
      description: 'Fragmentación optimizada y canales paralelos maximizan la velocidad de su conexión para archivos grandes.',
    },

    localDiscovery: {
      title: 'Descubrimiento Local',
      description: 'El descubrimiento mDNS encuentra dispositivos en su red local automáticamente. Sin códigos necesarios.',
    },

    folderSupport: {
      title: 'Soporte de Carpetas',
      description: 'Transfiera estructuras de carpetas completas con jerarquía preservada. Arrastra y suelta directorios enteros.',
    },
  },

  security: {
    e2e: 'Cifrado de Extremo a Extremo',
    pqc: 'Seguro contra Computadoras Cuánticas',
    zeroKnowledge: 'Conocimiento Cero',
    openSource: 'Código Abierto',
    auditable: 'Auditable Independientemente',
    perfectForwardSecrecy: 'Secreto Futuro Perfecto',
    noDataRetention: 'Sin Retención de Datos',
    noTracking: 'Sin Seguimiento',
    noAnalytics: 'Sin Análisis',
    noLogs: 'Sin Registros',

    architecture: 'Arquitectura de Seguridad',
    encryption: 'Cifrado',
    keyExchange: 'Intercambio de Claves',
    transport: 'Transporte',
    performance: 'Rendimiento',

    algorithm: {
      aes: 'AES-256-GCM',
      mlkem: 'ML-KEM-768',
      webrtc: 'P2P WebRTC',
      native: 'Velocidad Nativa',
    },

    comparison: {
      feature: 'Característica',
      tallow: 'Tallow',
      others: 'Otros',
      endToEndEncryption: 'Cifrado de extremo a extremo',
      postQuantumSafe: 'Seguro contra computadoras cuánticas',
      noCloudStorage: 'Sin almacenamiento en la nube',
      noAccountRequired: 'No se requiere cuenta',
      openSource: 'Código abierto',
      metadataStripping: 'Eliminación de metadatos',
      resumableTransfers: 'Transferencias reanudables',
      groupTransfers: 'Transferencias en grupo',
      varies: 'Varía',
    },
  },

  pricing: {
    free: 'Gratuito',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Empresa',
    perMonth: '/mes',
    forever: 'siempre',
    custom: 'Personalizado',

    startFree: 'Comenzar Gratis',
    startTrial: 'Comience con Prueba Gratuita',
    contactSales: 'Contactar Ventas',

    free_description: 'Para uso personal y transferencias pequeñas',
    pro_description: 'Para usuarios avanzados y equipos',
    enterprise_description: 'Para organizaciones con necesidades personalizadas',

    free_features: [
      'Transferencias de archivos ilimitadas',
      'Cifrado de extremo a extremo',
      'Criptografía resistente a computadoras cuánticas',
      'Hasta 5 destinatarios',
      'Descubrimiento de dispositivos local',
      'Transferencias reanudables',
    ],

    pro_features: [
      'Todo en Gratuito',
      'Hasta 10 destinatarios',
      'Servidores TURN prioritarios',
      'Análisis de transferencias',
      'Códigos de sala personalizados',
      'Soporte prioritario',
    ],

    enterprise_features: [
      'Todo en Pro',
      'Destinatarios ilimitados',
      'Opción autohospedada',
      'Servidores TURN personalizados',
      'Integración SSO/SAML',
      'Soporte dedicado',
    ],

    popular: 'Popular',

    faqs: [
      {
        question: '¿Tallow realmente es gratuito?',
        answer: 'Sí! La funcionalidad principal de Tallow es completamente gratuita y siempre lo será. Creemos que la transferencia segura de archivos debe ser accesible para todos. Los planes Pro y Empresa ofrecen características adicionales para usuarios avanzados y organizaciones.',
      },
      {
        question: '¿Qué sucede con mis archivos?',
        answer: 'Sus archivos nunca tocan nuestros servidores. Se cifran en su dispositivo y se transfieren directamente al destinatario a través de conexiones P2P de WebRTC. No tenemos acceso a sus datos.',
      },
      {
        question: '¿Necesito una cuenta?',
        answer: 'No se requiere cuenta para el plan Gratuito. Puede comenzar a transferir archivos inmediatamente. Los planes Pro y Empresa requieren una cuenta para características adicionales y facturación.',
      },
      {
        question: '¿Hay un límite de tamaño de archivo?',
        answer: '¡No! Tallow no tiene límites de tamaño de archivo. Transfiera archivos de cualquier tamaño directamente entre dispositivos. Los archivos grandes se fragmentan y se pueden reanudar si la conexión se interrumpe.',
      },
      {
        question: '¿Qué es la criptografía resistente a computadoras cuánticas?',
        answer: 'La criptografía resistente a computadoras cuánticas utiliza algoritmos que son seguros contra ataques de computadoras clásicas y cuánticas. Tallow utiliza ML-KEM (Kyber), un algoritmo estandarizado por NIST, para proteger sus transferencias contra futuras amenazas cuánticas.',
      },
    ],
  },

  transfer: {
    title: 'Transferir Archivos',
    dropFiles: 'Suelte archivos aquí o haga clic para examinar',
    selectFiles: 'Seleccionar Archivos',
    browseFiles: 'Examinar Archivos',
    dragAndDrop: 'Arrastra y suelta archivos o carpetas aquí',

    scanning: 'Escaneando red...',
    noDevices: 'No se encontraron dispositivos',
    deviceDiscovered: 'Dispositivo descubierto',
    devicesFound: 'Se encontraron {{count}} dispositivos',

    selectDevice: 'Seleccione un dispositivo para transferir archivos',
    selectRecipient: 'Seleccionar destinatario',
    sendTo: 'Enviar a {{name}}',
    sendFiles: 'Enviar Archivos',

    receiving: 'Recibiendo...',
    sending: 'Enviando...',
    processing: 'Procesando...',

    complete: '¡Transferencia completada!',
    success: 'Archivos transferidos exitosamente',
    failed: 'Error en la transferencia',
    cancelled: 'Transferencia cancelada',
    paused: 'Transferencia pausada',
    resumed: 'Transferencia reanudada',

    speed: '{{speed}}/s',
    timeRemaining: '{{time}} restante',
    of: 'de',
    files: 'archivos',

    // Device Discovery
    nearbyDevices: 'Dispositivos Cercanos',
    internetMode: 'Modo Internet',
    friends: 'Amigos',
    onlineContacts: 'Contactos en Línea',

    // Room Code
    roomCode: 'Código de Sala',
    enterRoomCode: 'Ingrese el código de sala',
    createRoom: 'Crear Sala',
    joinRoom: 'Unirse a Sala',
    roomCodePlaceholder: 'XXXX-XXXX-XXXX',

    // File Status
    fileSelected: '1 archivo seleccionado',
    filesSelected: '{{count}} archivos seleccionados',
    folderSelected: '1 carpeta seleccionada',
    foldersSelected: '{{count}} carpetas seleccionadas',

    // Transfer Progress
    preparing: 'Preparando archivos...',
    encrypting: 'Cifrando...',
    uploading: 'Subiendo...',
    downloading: 'Descargando...',
    verifying: 'Verificando...',

    // File Details
    fileName: 'Nombre del Archivo',
    fileSize: 'Tamaño del Archivo',
    fileType: 'Tipo de Archivo',
    lastModified: 'Última Modificación',

    // Actions
    startTransfer: 'Iniciar Transferencia',
    stopTransfer: 'Detener Transferencia',
    pauseTransfer: 'Pausar Transferencia',
    resumeTransfer: 'Reanudar Transferencia',
    clearFiles: 'Limpiar Archivos',
    removeFile: 'Eliminar Archivo',
    cancel: 'Cancelar Transferencia',
    pause: 'Pausar',
    resume: 'Reanudar',
    retry: 'Reintentar Transferencia',

    // Containers
    queue: 'Cola de Transferencia',
    history: 'Historial de Transferencias',
    clearHistory: 'Limpiar Historial',

    // Privacy
    privacyMode: 'Modo Privacidad',
    metadataStripping: 'Eliminación de Metadatos',
    stripMetadata: 'Eliminar metadatos de archivos',

    // Settings
    allowMultipleTransfers: 'Permitir múltiples transferencias simultáneas',
    enableNotifications: 'Habilitar notificaciones de transferencia',
    autoAcceptFromTrusted: 'Aceptar automáticamente de dispositivos confiables',
  },

  settings: {
    title: 'Configuración',
    general: 'General',
    security: 'Seguridad',
    privacy: 'Privacidad',
    notifications: 'Notificaciones',
    appearance: 'Apariencia',
    about: 'Acerca de',

    theme: 'Tema',
    language: 'Idioma',
    deviceName: 'Nombre del Dispositivo',
    deviceNamePlaceholder: 'Mi Computadora',

    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    autoMode: 'Automático',
    highContrast: 'Contraste Alto',
    dark: 'Oscuro',
    light: 'Claro',
    colorblind: 'Modo Daltónico',

    // Security Settings
    passwordProtection: 'Protección por Contraseña',
    enablePasswordProtection: 'Habilitar protección por contraseña para transferencias',
    changePassword: 'Cambiar Contraseña',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Contraseña',

    // Privacy Settings
    privacyMode: 'Modo Privacidad',
    enablePrivacyMode: 'Habilitar modo privacidad',
    stripMetadata: 'Eliminar metadatos de archivos',
    temporaryVisibility: 'Visibilidad Temporal',
    enableTemporaryVisibility: 'Solo visible cuando la pestaña está activa',
    deleteTransferHistory: 'Eliminar Historial de Transferencias',
    clearCache: 'Limpiar Caché',

    // Notification Settings
    enableNotifications: 'Habilitar Notificaciones',
    transferStarted: 'Transferencia Iniciada',
    transferCompleted: 'Transferencia Completada',
    deviceDiscovered: 'Dispositivo Descubierto',
    transferFailed: 'Error en la Transferencia',
    sound: 'Sonido',
    enableSound: 'Reproducir sonido para notificaciones',

    // Storage Settings
    storage: 'Almacenamiento',
    downloadLocation: 'Ubicación de Descarga',
    autoDownload: 'Descargar archivos automáticamente',
    maxStorageSize: 'Tamaño Máximo de Almacenamiento',

    // Advanced
    advanced: 'Avanzado',
    enableOnionRouting: 'Habilitar Enrutamiento Onion',
    enableNATDetection: 'Habilitar Detección NAT',
    maxConcurrentTransfers: 'Máximo de Transferencias Concurrentes',
    chunkSize: 'Tamaño de Fragmento',
    connection: 'Conexión',

    // System Info
    version: 'Versión',
    buildDate: 'Fecha de Compilación',
    platform: 'Plataforma',
    browser: 'Navegador',
  },

  chat: {
    title: 'Chat',
    messages: 'Mensajes',
    newMessage: 'Nuevo mensaje',
    typingIndicator: '{{name}} está escribiendo...',
    typingMultiple: '{{count}} personas están escribiendo...',
    messagePlaceholder: 'Escriba un mensaje...',
    send: 'Enviar',
    attachment: 'Adjunto',
    emoji: 'Emoji',

    // Chat States
    noMessages: 'Sin mensajes aún',
    startConversation: 'Comience una conversación',
    encrypted: 'Cifrado de extremo a extremo',
    delivered: 'Entregado',
    read: 'Leído',

    // Message Actions
    edit: 'Editar',
    delete: 'Eliminar',
    react: 'Reaccionar',
    reply: 'Responder',
    forward: 'Reenviar',

    // Status
    online: 'En Línea',
    offline: 'Desconectado',
    away: 'Ausente',
    doNotDisturb: 'No Molestar',

    // Notifications
    newChatMessage: 'Nuevo mensaje de {{name}}',
    groupMessage: 'Nuevo mensaje en {{group}}',
  },

  friends: {
    title: 'Amigos',
    addFriend: 'Agregar Amigo',
    addContact: 'Agregar Contacto',
    pairingCode: 'Código de Emparejamiento',
    enterPairingCode: 'Ingrese el código de emparejamiento',
    yourCode: 'Su Código de Emparejamiento',
    copyCode: 'Copiar Código',
    scanCode: 'Escanear Código',

    online: 'En Línea',
    offline: 'Desconectado',
    lastSeen: 'Visto por última vez {{time}}',

    status: 'Estado',
    statusMessage: 'Mensaje de estado',
    setStatus: 'Establecer mensaje de estado',

    // Friend Actions
    sendFile: 'Enviar Archivo',
    chat: 'Chat',
    viewProfile: 'Ver Perfil',
    removeFriend: 'Eliminar Amigo',
    block: 'Bloquear',
    unblock: 'Desbloquear',

    // Friend List
    allFriends: 'Todos los Amigos',
    onlineFriends: 'Amigos en Línea',
    recentContacts: 'Contactos Recientes',
    blocked: 'Bloqueados',
    pending: 'Pendiente',

    // Notifications
    friendRequest: '{{name}} quiere conectarse',
    friendOnline: '{{name}} está ahora en línea',
    friendOffline: '{{name}} está ahora desconectado',
    friendAdded: 'Se agregó exitosamente a {{name}}',
  },

  notifications: {
    // Transfer Notifications
    transferComplete: 'Transferencia de {{name}} completada',
    transferStarted: 'Transferencia iniciada con {{name}}',
    transferFailed: 'Error en la transferencia: {{reason}}',
    transferCancelled: 'Transferencia cancelada',

    // Device Notifications
    newDevice: 'Nuevo dispositivo descubierto: {{name}}',
    newDevice_Connection: 'Nuevo dispositivo conectado',
    deviceOffline: '{{name}} se desconectó',
    deviceOnline: '{{name}} se conectó',

    // Friend Notifications
    friendRequest: '{{name}} quiere conectarse',
    friendRequestAccepted: '{{name}} aceptó su solicitud',

    // Chat Notifications
    newMessage: 'Nuevo mensaje de {{name}}',
    newGroupMessage: 'Nuevo mensaje en {{group}}',

    // System Notifications
    updateAvailable: 'Actualización disponible',
    downloadComplete: 'Descarga completada',
    uploadComplete: 'Carga completada',

    // Error Notifications
    connectionError: 'Conexión perdida',
    encryptionError: 'Error de cifrado',
    storageError: 'Error de almacenamiento',
    error: 'Se produjo un error',
    connectionLost: 'Conexión perdida',

    // Actions
    view: 'Ver',
    dismiss: 'Descartar',
    openApp: 'Abrir Aplicación',
  },

  errors: {
    // Connection Errors
    connectionFailed: 'Error de conexión',
    connectionTimeout: 'Tiempo de conexión agotado',
    timeout: 'Tiempo de solicitud agotado',
    connectionRefused: 'Conexión rechazada',
    noInternet: 'Sin conexión a internet',
    natError: 'Error en el recorrido NAT',

    // Transfer Errors
    transferFailed: 'Error en la transferencia',
    transferCancelled: 'La transferencia fue cancelada',
    fileNotFound: 'Archivo no encontrado',
    fileAccessDenied: 'Acceso denegado',
    fileTooLarge: 'El archivo es demasiado grande',
    fileTooBig: 'El archivo es demasiado grande',
    insufficientStorage: 'Espacio de almacenamiento insuficiente',

    // Crypto Errors
    cryptoError: 'Error de cifrado',
    decryptionError: 'Error de descifrado',
    keyGenerationError: 'Error al generar clave de cifrado',
    signatureVerificationError: 'Error de verificación de firma',

    // Device Errors
    deviceNotFound: 'Dispositivo no encontrado',
    deviceOffline: 'El dispositivo está desconectado',
    deviceNotSupported: 'Dispositivo no compatible',

    // Permission Errors
    cameraAccessDenied: 'Acceso a la cámara denegado',
    noCamera: 'Cámara no disponible',
    micAccessDenied: 'Acceso al micrófono denegado',
    storageAccessDenied: 'Acceso al almacenamiento denegado',
    noPermission: 'Permiso denegado',

    // Validation Errors
    invalidEmail: 'Dirección de correo electrónico no válida',
    invalidPassword: 'Contraseña no válida',
    passwordMismatch: 'Las contraseñas no coinciden',
    invalidRoomCode: 'Código de sala no válido',

    // Rate Limiting
    rateLimited: 'Demasiadas solicitudes. Intente más tarde.',

    // Unsupported
    unsupported: 'Función no compatible',

    // Generic Errors
    unknownError: 'Se produjo un error desconocido',
    tryAgain: 'Por favor, intente de nuevo',
    contactSupport: 'Póngase en contacto con soporte',

    // Error Messages with Details
    errorDetails: 'Detalles del Error',
    errorCode: 'Código de Error: {{code}}',
    errorMessage: 'Error: {{message}}',
  },

  a11y: {
    // Navigation
    skipToContent: 'Saltar al contenido principal',
    skipToNavigation: 'Saltar a la navegación',
    skipToFooter: 'Saltar al pie',
    mainNavigation: 'Navegación principal',
    mobileNavigation: 'Navegación móvil',

    // UI Elements
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    toggleTheme: 'Cambiar tema',
    toggleLanguage: 'Cambiar idioma',
    darkMode: 'Habilitar modo oscuro',
    lightMode: 'Habilitar modo claro',
    expandMenu: 'Expandir menú',
    collapseMenu: 'Contraer menú',

    // Dialogs and Modals
    closeDialog: 'Cerrar diálogo',
    dialogTitle: 'Diálogo',
    confirmAction: 'Confirmar acción',
    confirmDelete: 'Confirmar eliminación',

    // File Upload/Download
    dragFiles: 'Arrastra archivos aquí para cargar',
    fileInput: 'Entrada de archivo',
    selectFile: 'Seleccione el archivo para cargar',
    selectMultipleFiles: 'Seleccione uno o más archivos',
    selectedFiles: '{{count}} archivos seleccionados',

    // Forms
    formError: 'Error de formulario',
    requiredField: 'Campo requerido',
    invalidInput: 'Entrada no válida',
    passwordStrength: 'Indicador de fortaleza de contraseña',

    // Lists and Tables
    sortable: 'Ordenable',
    noResults: 'Sin resultados',
    loading: 'Cargando',

    // Status Indicators
    online: 'En Línea',
    offline: 'Desconectado',
    away: 'Ausente',
    busy: 'Ocupado',

    // Notifications
    notification: 'Notificación',
    alert: 'Alerta',
    warning: 'Advertencia',
    success: 'Éxito',
    error: 'Error',
    info: 'Información',

    // Loading States
    loadingContent: 'Cargando contenido',
    skeleton: 'Contenido de marcador de posición',
    progress: 'Progreso',

    // Animations
    reduceMotion: 'Reducir movimiento',
    pauseAnimation: 'Pausar animación',
    resumeAnimation: 'Reanudar animación',

    // Real-time Features
    liveRegion: 'Región en vivo',
    livePolite: 'Actualizaciones educadas',
    liveAssertive: 'Actualizaciones importantes',

    // Keyboard Shortcuts
    keyboardShortcuts: 'Atajos de teclado',
    showShortcuts: 'Mostrar atajos de teclado',
    hideShortcuts: 'Ocultar atajos de teclado',
    shortcut: 'Atajo de teclado',

    // Focus Management
    focusTrapped: 'El foco está atrapado en este elemento',
    focusRestored: 'El foco ha sido restaurado',

    // Screen Reader Announcements
    pageLoaded: 'Página cargada',
    navigationOpened: 'Navegación abierta',
    navigationClosed: 'Navegación cerrada',
    modalOpened: 'Modal abierto',
    modalClosed: 'Modal cerrado',
    menuOpened: 'Menú abierto',
    menuClosed: 'Menú cerrado',
  },

  // Time and Date Formatting
  // Spanish uses: hace X tiempo (ago)
  time: {
    now: 'ahora',
    minutesAgo: 'hace {{count}}m',
    hoursAgo: 'hace {{count}}h',
    daysAgo: 'hace {{count}}d',
    weeksAgo: 'hace {{count}}s',
    monthsAgo: 'hace {{count}}mes',
    yearsAgo: 'hace {{count}}a',
  },

  // File Size Formatting
  // Spanish file size labels (typically unchanged)
  fileSize: {
    bytes: 'B',
    kilobytes: 'KB',
    megabytes: 'MB',
    gigabytes: 'GB',
    terabytes: 'TB',
  },

  // Speed Formatting
  // Spanish speed labels (typically unchanged)
  speed: {
    bps: 'b/s',
    kbps: 'KB/s',
    mbps: 'MB/s',
    gbps: 'GB/s',
  },
} as const;
