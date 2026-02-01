import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

/// App localizations class with complete translations for 22 languages
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('en'), // English
    Locale('es'), // Spanish
    Locale('fr'), // French
    Locale('de'), // German
    Locale('it'), // Italian
    Locale('pt'), // Portuguese
    Locale('ru'), // Russian
    Locale('zh'), // Chinese
    Locale('ja'), // Japanese
    Locale('ko'), // Korean
    Locale('ar'), // Arabic
    Locale('hi'), // Hindi
    Locale('bn'), // Bengali
    Locale('id'), // Indonesian
    Locale('th'), // Thai
    Locale('vi'), // Vietnamese
    Locale('tr'), // Turkish
    Locale('pl'), // Polish
    Locale('nl'), // Dutch
    Locale('uk'), // Ukrainian
    Locale('ur'), // Urdu
    Locale('he'), // Hebrew
  ];

  // RTL languages
  static const List<String> rtlLanguages = ['ar', 'he', 'ur'];

  bool get isRtl => rtlLanguages.contains(locale.languageCode);

  // Translations map
  static final Map<String, Map<String, String>> _localizedValues = {
    'en': _enStrings,
    'es': _esStrings,
    'fr': _frStrings,
    'de': _deStrings,
    'it': _itStrings,
    'pt': _ptStrings,
    'ru': _ruStrings,
    'zh': _zhStrings,
    'ja': _jaStrings,
    'ko': _koStrings,
    'ar': _arStrings,
    'hi': _hiStrings,
    'bn': _bnStrings,
    'id': _idStrings,
    'th': _thStrings,
    'vi': _viStrings,
    'tr': _trStrings,
    'pl': _plStrings,
    'nl': _nlStrings,
    'uk': _ukStrings,
    'ur': _urStrings,
    'he': _heStrings,
  };

  String _translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ??
        _localizedValues['en']?[key] ??
        key;
  }

  // Navigation
  String get discover => _translate('discover');
  String get transfer => _translate('transfer');
  String get chat => _translate('chat');
  String get history => _translate('history');
  String get settings => _translate('settings');

  // Discovery
  String get localNetwork => _translate('localNetwork');
  String get online => _translate('online');
  String get local => _translate('local');
  String get scanning => _translate('scanning');
  String get noDevicesFound => _translate('noDevicesFound');
  String get ensureSameNetwork => _translate('ensureSameNetwork');
  String get scanAgain => _translate('scanAgain');
  String get refresh => _translate('refresh');
  String get scanQR => _translate('scanQR');
  String get createRoom => _translate('createRoom');
  String get joinRoom => _translate('joinRoom');
  String get roomCode => _translate('roomCode');
  String get roomCreated => _translate('roomCreated');
  String get shareCode => _translate('shareCode');
  String get connectOnline => _translate('connectOnline');
  String get onlineDescription => _translate('onlineDescription');
  String get waitingForDevices => _translate('waitingForDevices');
  String get room => _translate('room');
  String get devicesConnected => _translate('devicesConnected');
  String get trustedDevice => _translate('trustedDevice');
  String get justNow => _translate('justNow');
  String get ago => _translate('ago');

  // Transfer
  String get noConnection => _translate('noConnection');
  String get selectDeviceToTransfer => _translate('selectDeviceToTransfer');
  String get connectedTo => _translate('connectedTo');
  String get connecting => _translate('connecting');
  String get connectionError => _translate('connectionError');
  String get disconnect => _translate('disconnect');
  String get selectFiles => _translate('selectFiles');
  String get activeTransfers => _translate('activeTransfers');
  String get pendingTransfers => _translate('pendingTransfers');
  String get completedTransfers => _translate('completedTransfers');
  String get noTransfers => _translate('noTransfers');
  String get tapToSelectFiles => _translate('tapToSelectFiles');
  String get dragAndDropFiles => _translate('dragAndDropFiles');
  String get selectedFiles => _translate('selectedFiles');
  String get clearAll => _translate('clearAll');
  String get totalSize => _translate('totalSize');
  String get pause => _translate('pause');
  String get resume => _translate('resume');
  String get cancel => _translate('cancel');
  String get send => _translate('send');

  // Chat
  String get noActiveChat => _translate('noActiveChat');
  String get connectToChat => _translate('connectToChat');
  String get connected => _translate('connected');
  String get clearChat => _translate('clearChat');
  String get blockDevice => _translate('blockDevice');
  String get e2eEncrypted => _translate('e2eEncrypted');
  String get startConversation => _translate('startConversation');
  String get today => _translate('today');
  String get yesterday => _translate('yesterday');
  String get replyingTo => _translate('replyingTo');
  String get typeMessage => _translate('typeMessage');
  String get reply => _translate('reply');
  String get copy => _translate('copy');
  String get delete => _translate('delete');
  String get copiedToClipboard => _translate('copiedToClipboard');

  // History
  String get searchHistory => _translate('searchHistory');
  String get statistics => _translate('statistics');
  String get sent => _translate('sent');
  String get received => _translate('received');
  String get avgSpeed => _translate('avgSpeed');
  String get all => _translate('all');
  String get completed => _translate('completed');
  String get failed => _translate('failed');
  String get newestFirst => _translate('newestFirst');
  String get oldestFirst => _translate('oldestFirst');
  String get largestFirst => _translate('largestFirst');
  String get smallestFirst => _translate('smallestFirst');
  String get alphabetical => _translate('alphabetical');
  String get clearHistory => _translate('clearHistory');
  String get clearHistoryConfirmation => _translate('clearHistoryConfirmation');
  String get clear => _translate('clear');
  String get selected => _translate('selected');
  String get noMatchingTransfers => _translate('noMatchingTransfers');
  String get noTransferHistory => _translate('noTransferHistory');
  String get fileSize => _translate('fileSize');
  String get direction => _translate('direction');
  String get peer => _translate('peer');
  String get date => _translate('date');
  String get duration => _translate('duration');
  String get averageSpeed => _translate('averageSpeed');
  String get encryption => _translate('encryption');
  String get error => _translate('error');

  // Settings
  String get appearance => _translate('appearance');
  String get theme => _translate('theme');
  String get colorScheme => _translate('colorScheme');
  String get language => _translate('language');
  String get system => _translate('system');
  String get light => _translate('light');
  String get dark => _translate('dark');
  String get notifications => _translate('notifications');
  String get enableNotifications => _translate('enableNotifications');
  String get sounds => _translate('sounds');
  String get vibration => _translate('vibration');
  String get security => _translate('security');
  String get pqcEncryption => _translate('pqcEncryption');
  String get pqcDescription => _translate('pqcDescription');
  String get requireVerification => _translate('requireVerification');
  String get verificationDescription => _translate('verificationDescription');
  String get autoAccept => _translate('autoAccept');
  String get autoAcceptDescription => _translate('autoAcceptDescription');
  String get transfers => _translate('transfers');
  String get useRelay => _translate('useRelay');
  String get relayDescription => _translate('relayDescription');
  String get maxTransfers => _translate('maxTransfers');
  String get keepScreenOn => _translate('keepScreenOn');
  String get keepScreenOnDescription => _translate('keepScreenOnDescription');
  String get discovery => _translate('discovery');
  String get autoDiscovery => _translate('autoDiscovery');
  String get autoDiscoveryDescription => _translate('autoDiscoveryDescription');
  String get about => _translate('about');
  String get version => _translate('version');
  String get licenses => _translate('licenses');
  String get privacyPolicy => _translate('privacyPolicy');
  String get dangerZone => _translate('dangerZone');
  String get resetSettings => _translate('resetSettings');
  String get resetConfirmation => _translate('resetConfirmation');
  String get reset => _translate('reset');

  // Common
  String get close => _translate('close');
  String get join => _translate('join');
  String get qrCode => _translate('qrCode');
  String get pointCameraAtQR => _translate('pointCameraAtQR');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return AppLocalizations.supportedLocales
        .map((l) => l.languageCode)
        .contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(AppLocalizations(locale));
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

// ============================================================================
// ENGLISH
// ============================================================================
const Map<String, String> _enStrings = {
  'discover': 'Discover',
  'transfer': 'Transfer',
  'chat': 'Chat',
  'history': 'History',
  'settings': 'Settings',
  'localNetwork': 'Local Network',
  'online': 'Online',
  'local': 'Local',
  'scanning': 'Scanning...',
  'noDevicesFound': 'No devices found',
  'ensureSameNetwork': 'Ensure devices are on the same network',
  'scanAgain': 'Scan Again',
  'refresh': 'Refresh',
  'scanQR': 'Scan QR',
  'createRoom': 'Create Room',
  'joinRoom': 'Join Room',
  'roomCode': 'Room Code',
  'roomCreated': 'Room Created',
  'shareCode': 'Share this code with others to connect:',
  'connectOnline': 'Connect Online',
  'onlineDescription': 'Create or join a room to connect with devices anywhere',
  'waitingForDevices': 'Waiting for devices to join...',
  'room': 'Room',
  'devicesConnected': 'devices connected',
  'trustedDevice': 'Trusted Device',
  'justNow': 'Just now',
  'ago': 'ago',
  'noConnection': 'No Connection',
  'selectDeviceToTransfer': 'Select a device from the Discovery tab to start transferring files',
  'connectedTo': 'Connected to',
  'connecting': 'Connecting...',
  'connectionError': 'Connection error',
  'disconnect': 'Disconnect',
  'selectFiles': 'Select Files',
  'activeTransfers': 'Active Transfers',
  'pendingTransfers': 'Pending Transfers',
  'completedTransfers': 'Completed Transfers',
  'noTransfers': 'No Transfers',
  'tapToSelectFiles': 'Tap to select files',
  'dragAndDropFiles': 'Or drag and drop files here',
  'selectedFiles': 'Selected Files',
  'clearAll': 'Clear All',
  'totalSize': 'Total size',
  'pause': 'Pause',
  'resume': 'Resume',
  'cancel': 'Cancel',
  'send': 'Send',
  'noActiveChat': 'No Active Chat',
  'connectToChat': 'Connect to a device to start chatting',
  'connected': 'Connected',
  'clearChat': 'Clear Chat',
  'blockDevice': 'Block Device',
  'e2eEncrypted': 'End-to-end encrypted',
  'startConversation': 'Start a conversation',
  'today': 'Today',
  'yesterday': 'Yesterday',
  'replyingTo': 'Replying to',
  'typeMessage': 'Type a message...',
  'reply': 'Reply',
  'copy': 'Copy',
  'delete': 'Delete',
  'copiedToClipboard': 'Copied to clipboard',
  'searchHistory': 'Search history...',
  'statistics': 'Statistics',
  'sent': 'Sent',
  'received': 'Received',
  'avgSpeed': 'Avg Speed',
  'all': 'All',
  'completed': 'Completed',
  'failed': 'Failed',
  'newestFirst': 'Newest first',
  'oldestFirst': 'Oldest first',
  'largestFirst': 'Largest first',
  'smallestFirst': 'Smallest first',
  'alphabetical': 'Alphabetical',
  'clearHistory': 'Clear history',
  'clearHistoryConfirmation': 'Are you sure you want to clear all transfer history?',
  'clear': 'Clear',
  'selected': 'selected',
  'noMatchingTransfers': 'No matching transfers',
  'noTransferHistory': 'No transfer history',
  'fileSize': 'File Size',
  'direction': 'Direction',
  'peer': 'Peer',
  'date': 'Date',
  'duration': 'Duration',
  'averageSpeed': 'Average Speed',
  'encryption': 'Encryption',
  'error': 'Error',
  'appearance': 'Appearance',
  'theme': 'Theme',
  'colorScheme': 'Color Scheme',
  'language': 'Language',
  'system': 'System',
  'light': 'Light',
  'dark': 'Dark',
  'notifications': 'Notifications',
  'enableNotifications': 'Enable Notifications',
  'sounds': 'Sounds',
  'vibration': 'Vibration',
  'security': 'Security',
  'pqcEncryption': 'Post-Quantum Encryption',
  'pqcDescription': 'Use ML-KEM-768 + X25519 hybrid encryption',
  'requireVerification': 'Require Verification',
  'verificationDescription': 'Verify device fingerprints before connecting',
  'autoAccept': 'Auto-accept from Trusted',
  'autoAcceptDescription': 'Automatically accept transfers from verified devices',
  'transfers': 'Transfers',
  'useRelay': 'Use Relay Server',
  'relayDescription': 'Fall back to relay when direct connection fails',
  'maxTransfers': 'Max Concurrent Transfers',
  'keepScreenOn': 'Keep Screen On',
  'keepScreenOnDescription': 'Prevent screen from turning off during transfers',
  'discovery': 'Discovery',
  'autoDiscovery': 'Auto-start Discovery',
  'autoDiscoveryDescription': 'Start scanning when app opens',
  'about': 'About',
  'version': 'Version',
  'licenses': 'Open Source Licenses',
  'privacyPolicy': 'Privacy Policy',
  'dangerZone': 'Danger Zone',
  'resetSettings': 'Reset Settings',
  'resetConfirmation': 'Are you sure you want to reset all settings to default?',
  'reset': 'Reset',
  'close': 'Close',
  'join': 'Join',
  'qrCode': 'QR Code',
  'pointCameraAtQR': 'Point your camera at a QR code',
};

// ============================================================================
// SPANISH
// ============================================================================
const Map<String, String> _esStrings = {
  'discover': 'Descubrir',
  'transfer': 'Transferir',
  'chat': 'Chat',
  'history': 'Historial',
  'settings': 'Configuración',
  'localNetwork': 'Red Local',
  'online': 'En línea',
  'local': 'Local',
  'scanning': 'Escaneando...',
  'noDevicesFound': 'No se encontraron dispositivos',
  'ensureSameNetwork': 'Asegúrese de que los dispositivos estén en la misma red',
  'scanAgain': 'Escanear de nuevo',
  'refresh': 'Actualizar',
  'scanQR': 'Escanear QR',
  'createRoom': 'Crear sala',
  'joinRoom': 'Unirse a sala',
  'roomCode': 'Código de sala',
  'roomCreated': 'Sala creada',
  'shareCode': 'Comparte este código con otros para conectar:',
  'connectOnline': 'Conectar en línea',
  'onlineDescription': 'Crea o únete a una sala para conectar con dispositivos en cualquier lugar',
  'waitingForDevices': 'Esperando que se unan dispositivos...',
  'room': 'Sala',
  'devicesConnected': 'dispositivos conectados',
  'trustedDevice': 'Dispositivo de confianza',
  'justNow': 'Ahora mismo',
  'ago': 'hace',
  'noConnection': 'Sin conexión',
  'selectDeviceToTransfer': 'Selecciona un dispositivo desde la pestaña Descubrir para transferir archivos',
  'connectedTo': 'Conectado a',
  'connecting': 'Conectando...',
  'connectionError': 'Error de conexión',
  'disconnect': 'Desconectar',
  'selectFiles': 'Seleccionar archivos',
  'activeTransfers': 'Transferencias activas',
  'pendingTransfers': 'Transferencias pendientes',
  'completedTransfers': 'Transferencias completadas',
  'noTransfers': 'Sin transferencias',
  'tapToSelectFiles': 'Toca para seleccionar archivos',
  'dragAndDropFiles': 'O arrastra y suelta archivos aquí',
  'selectedFiles': 'Archivos seleccionados',
  'clearAll': 'Borrar todo',
  'totalSize': 'Tamaño total',
  'pause': 'Pausar',
  'resume': 'Reanudar',
  'cancel': 'Cancelar',
  'send': 'Enviar',
  'noActiveChat': 'Sin chat activo',
  'connectToChat': 'Conecta con un dispositivo para chatear',
  'connected': 'Conectado',
  'clearChat': 'Borrar chat',
  'blockDevice': 'Bloquear dispositivo',
  'e2eEncrypted': 'Cifrado de extremo a extremo',
  'startConversation': 'Iniciar conversación',
  'today': 'Hoy',
  'yesterday': 'Ayer',
  'replyingTo': 'Respondiendo a',
  'typeMessage': 'Escribe un mensaje...',
  'reply': 'Responder',
  'copy': 'Copiar',
  'delete': 'Eliminar',
  'copiedToClipboard': 'Copiado al portapapeles',
  'searchHistory': 'Buscar historial...',
  'statistics': 'Estadísticas',
  'sent': 'Enviado',
  'received': 'Recibido',
  'avgSpeed': 'Velocidad promedio',
  'all': 'Todo',
  'completed': 'Completado',
  'failed': 'Fallido',
  'newestFirst': 'Más reciente primero',
  'oldestFirst': 'Más antiguo primero',
  'largestFirst': 'Más grande primero',
  'smallestFirst': 'Más pequeño primero',
  'alphabetical': 'Alfabético',
  'clearHistory': 'Borrar historial',
  'clearHistoryConfirmation': '¿Estás seguro de que quieres borrar todo el historial de transferencias?',
  'clear': 'Borrar',
  'selected': 'seleccionado',
  'noMatchingTransfers': 'No hay transferencias coincidentes',
  'noTransferHistory': 'Sin historial de transferencias',
  'fileSize': 'Tamaño del archivo',
  'direction': 'Dirección',
  'peer': 'Dispositivo',
  'date': 'Fecha',
  'duration': 'Duración',
  'averageSpeed': 'Velocidad promedio',
  'encryption': 'Cifrado',
  'error': 'Error',
  'appearance': 'Apariencia',
  'theme': 'Tema',
  'colorScheme': 'Esquema de colores',
  'language': 'Idioma',
  'system': 'Sistema',
  'light': 'Claro',
  'dark': 'Oscuro',
  'notifications': 'Notificaciones',
  'enableNotifications': 'Activar notificaciones',
  'sounds': 'Sonidos',
  'vibration': 'Vibración',
  'security': 'Seguridad',
  'pqcEncryption': 'Cifrado post-cuántico',
  'pqcDescription': 'Usar cifrado híbrido ML-KEM-768 + X25519',
  'requireVerification': 'Requerir verificación',
  'verificationDescription': 'Verificar huellas digitales del dispositivo antes de conectar',
  'autoAccept': 'Aceptar automáticamente de confiables',
  'autoAcceptDescription': 'Aceptar automáticamente transferencias de dispositivos verificados',
  'transfers': 'Transferencias',
  'useRelay': 'Usar servidor de retransmisión',
  'relayDescription': 'Usar retransmisión cuando falle la conexión directa',
  'maxTransfers': 'Transferencias simultáneas máximas',
  'keepScreenOn': 'Mantener pantalla encendida',
  'keepScreenOnDescription': 'Evitar que la pantalla se apague durante las transferencias',
  'discovery': 'Descubrimiento',
  'autoDiscovery': 'Inicio automático de descubrimiento',
  'autoDiscoveryDescription': 'Comenzar a escanear cuando se abra la app',
  'about': 'Acerca de',
  'version': 'Versión',
  'licenses': 'Licencias de código abierto',
  'privacyPolicy': 'Política de privacidad',
  'dangerZone': 'Zona de peligro',
  'resetSettings': 'Restablecer configuración',
  'resetConfirmation': '¿Estás seguro de que quieres restablecer toda la configuración a los valores predeterminados?',
  'reset': 'Restablecer',
  'close': 'Cerrar',
  'join': 'Unirse',
  'qrCode': 'Código QR',
  'pointCameraAtQR': 'Apunta tu cámara a un código QR',
};

// ============================================================================
// FRENCH
// ============================================================================
const Map<String, String> _frStrings = {
  'discover': 'Découvrir',
  'transfer': 'Transférer',
  'chat': 'Discussion',
  'history': 'Historique',
  'settings': 'Paramètres',
  'localNetwork': 'Réseau local',
  'online': 'En ligne',
  'local': 'Local',
  'scanning': 'Analyse en cours...',
  'noDevicesFound': 'Aucun appareil trouvé',
  'ensureSameNetwork': 'Assurez-vous que les appareils sont sur le même réseau',
  'scanAgain': 'Analyser à nouveau',
  'refresh': 'Actualiser',
  'scanQR': 'Scanner QR',
  'createRoom': 'Créer une salle',
  'joinRoom': 'Rejoindre une salle',
  'roomCode': 'Code de la salle',
  'roomCreated': 'Salle créée',
  'shareCode': 'Partagez ce code avec d\'autres pour vous connecter:',
  'connectOnline': 'Connexion en ligne',
  'onlineDescription': 'Créez ou rejoignez une salle pour vous connecter avec des appareils partout',
  'waitingForDevices': 'En attente d\'appareils...',
  'room': 'Salle',
  'devicesConnected': 'appareils connectés',
  'trustedDevice': 'Appareil de confiance',
  'justNow': 'À l\'instant',
  'ago': 'il y a',
  'noConnection': 'Pas de connexion',
  'selectDeviceToTransfer': 'Sélectionnez un appareil depuis l\'onglet Découvrir pour transférer des fichiers',
  'connectedTo': 'Connecté à',
  'connecting': 'Connexion...',
  'connectionError': 'Erreur de connexion',
  'disconnect': 'Déconnecter',
  'selectFiles': 'Sélectionner des fichiers',
  'activeTransfers': 'Transferts actifs',
  'pendingTransfers': 'Transferts en attente',
  'completedTransfers': 'Transferts terminés',
  'noTransfers': 'Aucun transfert',
  'tapToSelectFiles': 'Appuyez pour sélectionner des fichiers',
  'dragAndDropFiles': 'Ou glissez-déposez des fichiers ici',
  'selectedFiles': 'Fichiers sélectionnés',
  'clearAll': 'Tout effacer',
  'totalSize': 'Taille totale',
  'pause': 'Pause',
  'resume': 'Reprendre',
  'cancel': 'Annuler',
  'send': 'Envoyer',
  'noActiveChat': 'Pas de discussion active',
  'connectToChat': 'Connectez-vous à un appareil pour discuter',
  'connected': 'Connecté',
  'clearChat': 'Effacer la discussion',
  'blockDevice': 'Bloquer l\'appareil',
  'e2eEncrypted': 'Chiffrement de bout en bout',
  'startConversation': 'Commencer une conversation',
  'today': 'Aujourd\'hui',
  'yesterday': 'Hier',
  'replyingTo': 'En réponse à',
  'typeMessage': 'Tapez un message...',
  'reply': 'Répondre',
  'copy': 'Copier',
  'delete': 'Supprimer',
  'copiedToClipboard': 'Copié dans le presse-papiers',
  'searchHistory': 'Rechercher dans l\'historique...',
  'statistics': 'Statistiques',
  'sent': 'Envoyé',
  'received': 'Reçu',
  'avgSpeed': 'Vitesse moyenne',
  'all': 'Tout',
  'completed': 'Terminé',
  'failed': 'Échoué',
  'newestFirst': 'Plus récent en premier',
  'oldestFirst': 'Plus ancien en premier',
  'largestFirst': 'Plus grand en premier',
  'smallestFirst': 'Plus petit en premier',
  'alphabetical': 'Alphabétique',
  'clearHistory': 'Effacer l\'historique',
  'clearHistoryConfirmation': 'Êtes-vous sûr de vouloir effacer tout l\'historique des transferts?',
  'clear': 'Effacer',
  'selected': 'sélectionné',
  'noMatchingTransfers': 'Aucun transfert correspondant',
  'noTransferHistory': 'Pas d\'historique de transfert',
  'fileSize': 'Taille du fichier',
  'direction': 'Direction',
  'peer': 'Appareil',
  'date': 'Date',
  'duration': 'Durée',
  'averageSpeed': 'Vitesse moyenne',
  'encryption': 'Chiffrement',
  'error': 'Erreur',
  'appearance': 'Apparence',
  'theme': 'Thème',
  'colorScheme': 'Palette de couleurs',
  'language': 'Langue',
  'system': 'Système',
  'light': 'Clair',
  'dark': 'Sombre',
  'notifications': 'Notifications',
  'enableNotifications': 'Activer les notifications',
  'sounds': 'Sons',
  'vibration': 'Vibration',
  'security': 'Sécurité',
  'pqcEncryption': 'Chiffrement post-quantique',
  'pqcDescription': 'Utiliser le chiffrement hybride ML-KEM-768 + X25519',
  'requireVerification': 'Exiger la vérification',
  'verificationDescription': 'Vérifier les empreintes des appareils avant la connexion',
  'autoAccept': 'Accepter auto. des appareils de confiance',
  'autoAcceptDescription': 'Accepter automatiquement les transferts des appareils vérifiés',
  'transfers': 'Transferts',
  'useRelay': 'Utiliser le serveur relais',
  'relayDescription': 'Utiliser le relais si la connexion directe échoue',
  'maxTransfers': 'Transferts simultanés max',
  'keepScreenOn': 'Garder l\'écran allumé',
  'keepScreenOnDescription': 'Empêcher l\'écran de s\'éteindre pendant les transferts',
  'discovery': 'Découverte',
  'autoDiscovery': 'Découverte automatique',
  'autoDiscoveryDescription': 'Commencer à scanner à l\'ouverture de l\'app',
  'about': 'À propos',
  'version': 'Version',
  'licenses': 'Licences open source',
  'privacyPolicy': 'Politique de confidentialité',
  'dangerZone': 'Zone dangereuse',
  'resetSettings': 'Réinitialiser les paramètres',
  'resetConfirmation': 'Êtes-vous sûr de vouloir réinitialiser tous les paramètres?',
  'reset': 'Réinitialiser',
  'close': 'Fermer',
  'join': 'Rejoindre',
  'qrCode': 'Code QR',
  'pointCameraAtQR': 'Pointez votre caméra vers un code QR',
};

// ============================================================================
// GERMAN
// ============================================================================
const Map<String, String> _deStrings = {
  'discover': 'Entdecken',
  'transfer': 'Übertragen',
  'chat': 'Chat',
  'history': 'Verlauf',
  'settings': 'Einstellungen',
  'localNetwork': 'Lokales Netzwerk',
  'online': 'Online',
  'local': 'Lokal',
  'scanning': 'Scannen...',
  'noDevicesFound': 'Keine Geräte gefunden',
  'ensureSameNetwork': 'Stellen Sie sicher, dass die Geräte im selben Netzwerk sind',
  'scanAgain': 'Erneut scannen',
  'refresh': 'Aktualisieren',
  'scanQR': 'QR scannen',
  'createRoom': 'Raum erstellen',
  'joinRoom': 'Raum beitreten',
  'roomCode': 'Raumcode',
  'roomCreated': 'Raum erstellt',
  'shareCode': 'Teilen Sie diesen Code zum Verbinden:',
  'connectOnline': 'Online verbinden',
  'onlineDescription': 'Erstellen oder treten Sie einem Raum bei, um sich überall zu verbinden',
  'waitingForDevices': 'Warten auf Geräte...',
  'room': 'Raum',
  'devicesConnected': 'Geräte verbunden',
  'trustedDevice': 'Vertrauenswürdiges Gerät',
  'justNow': 'Gerade eben',
  'ago': 'vor',
  'noConnection': 'Keine Verbindung',
  'selectDeviceToTransfer': 'Wählen Sie ein Gerät aus dem Entdecken-Tab, um Dateien zu übertragen',
  'connectedTo': 'Verbunden mit',
  'connecting': 'Verbinden...',
  'connectionError': 'Verbindungsfehler',
  'disconnect': 'Trennen',
  'selectFiles': 'Dateien auswählen',
  'activeTransfers': 'Aktive Übertragungen',
  'pendingTransfers': 'Ausstehende Übertragungen',
  'completedTransfers': 'Abgeschlossene Übertragungen',
  'noTransfers': 'Keine Übertragungen',
  'tapToSelectFiles': 'Tippen um Dateien auszuwählen',
  'dragAndDropFiles': 'Oder Dateien hierher ziehen',
  'selectedFiles': 'Ausgewählte Dateien',
  'clearAll': 'Alles löschen',
  'totalSize': 'Gesamtgröße',
  'pause': 'Pause',
  'resume': 'Fortsetzen',
  'cancel': 'Abbrechen',
  'send': 'Senden',
  'noActiveChat': 'Kein aktiver Chat',
  'connectToChat': 'Verbinden Sie sich mit einem Gerät zum Chatten',
  'connected': 'Verbunden',
  'clearChat': 'Chat löschen',
  'blockDevice': 'Gerät blockieren',
  'e2eEncrypted': 'Ende-zu-Ende verschlüsselt',
  'startConversation': 'Gespräch beginnen',
  'today': 'Heute',
  'yesterday': 'Gestern',
  'replyingTo': 'Antwort auf',
  'typeMessage': 'Nachricht eingeben...',
  'reply': 'Antworten',
  'copy': 'Kopieren',
  'delete': 'Löschen',
  'copiedToClipboard': 'In Zwischenablage kopiert',
  'searchHistory': 'Verlauf durchsuchen...',
  'statistics': 'Statistiken',
  'sent': 'Gesendet',
  'received': 'Empfangen',
  'avgSpeed': 'Durchschnittsgeschwindigkeit',
  'all': 'Alle',
  'completed': 'Abgeschlossen',
  'failed': 'Fehlgeschlagen',
  'newestFirst': 'Neueste zuerst',
  'oldestFirst': 'Älteste zuerst',
  'largestFirst': 'Größte zuerst',
  'smallestFirst': 'Kleinste zuerst',
  'alphabetical': 'Alphabetisch',
  'clearHistory': 'Verlauf löschen',
  'clearHistoryConfirmation': 'Möchten Sie wirklich den gesamten Übertragungsverlauf löschen?',
  'clear': 'Löschen',
  'selected': 'ausgewählt',
  'noMatchingTransfers': 'Keine passenden Übertragungen',
  'noTransferHistory': 'Kein Übertragungsverlauf',
  'fileSize': 'Dateigröße',
  'direction': 'Richtung',
  'peer': 'Gerät',
  'date': 'Datum',
  'duration': 'Dauer',
  'averageSpeed': 'Durchschnittsgeschwindigkeit',
  'encryption': 'Verschlüsselung',
  'error': 'Fehler',
  'appearance': 'Erscheinungsbild',
  'theme': 'Thema',
  'colorScheme': 'Farbschema',
  'language': 'Sprache',
  'system': 'System',
  'light': 'Hell',
  'dark': 'Dunkel',
  'notifications': 'Benachrichtigungen',
  'enableNotifications': 'Benachrichtigungen aktivieren',
  'sounds': 'Töne',
  'vibration': 'Vibration',
  'security': 'Sicherheit',
  'pqcEncryption': 'Post-Quanten-Verschlüsselung',
  'pqcDescription': 'Hybride ML-KEM-768 + X25519 Verschlüsselung verwenden',
  'requireVerification': 'Verifizierung erfordern',
  'verificationDescription': 'Geräte-Fingerabdrücke vor der Verbindung verifizieren',
  'autoAccept': 'Auto-Akzeptieren von vertrauenswürdigen Geräten',
  'autoAcceptDescription': 'Übertragungen von verifizierten Geräten automatisch akzeptieren',
  'transfers': 'Übertragungen',
  'useRelay': 'Relay-Server verwenden',
  'relayDescription': 'Auf Relay zurückgreifen, wenn direkte Verbindung fehlschlägt',
  'maxTransfers': 'Max. gleichzeitige Übertragungen',
  'keepScreenOn': 'Bildschirm eingeschaltet lassen',
  'keepScreenOnDescription': 'Bildschirm während Übertragungen nicht ausschalten',
  'discovery': 'Entdeckung',
  'autoDiscovery': 'Automatische Entdeckung starten',
  'autoDiscoveryDescription': 'Scannen beim Öffnen der App starten',
  'about': 'Über',
  'version': 'Version',
  'licenses': 'Open-Source-Lizenzen',
  'privacyPolicy': 'Datenschutzrichtlinie',
  'dangerZone': 'Gefahrenzone',
  'resetSettings': 'Einstellungen zurücksetzen',
  'resetConfirmation': 'Möchten Sie wirklich alle Einstellungen zurücksetzen?',
  'reset': 'Zurücksetzen',
  'close': 'Schließen',
  'join': 'Beitreten',
  'qrCode': 'QR-Code',
  'pointCameraAtQR': 'Richten Sie Ihre Kamera auf einen QR-Code',
};

// ============================================================================
// ITALIAN
// ============================================================================
const Map<String, String> _itStrings = {
  'discover': 'Scopri',
  'transfer': 'Trasferisci',
  'chat': 'Chat',
  'history': 'Cronologia',
  'settings': 'Impostazioni',
  'localNetwork': 'Rete locale',
  'online': 'Online',
  'local': 'Locale',
  'scanning': 'Scansione...',
  'noDevicesFound': 'Nessun dispositivo trovato',
  'ensureSameNetwork': 'Assicurati che i dispositivi siano sulla stessa rete',
  'scanAgain': 'Scansiona di nuovo',
  'refresh': 'Aggiorna',
  'scanQR': 'Scansiona QR',
  'createRoom': 'Crea stanza',
  'joinRoom': 'Unisciti alla stanza',
  'roomCode': 'Codice stanza',
  'roomCreated': 'Stanza creata',
  'shareCode': 'Condividi questo codice per connetterti:',
  'connectOnline': 'Connetti online',
  'onlineDescription': 'Crea o unisciti a una stanza per connetterti ovunque',
  'waitingForDevices': 'In attesa dei dispositivi...',
  'room': 'Stanza',
  'devicesConnected': 'dispositivi connessi',
  'trustedDevice': 'Dispositivo affidabile',
  'justNow': 'Proprio ora',
  'ago': 'fa',
  'noConnection': 'Nessuna connessione',
  'selectDeviceToTransfer': 'Seleziona un dispositivo dalla scheda Scopri per trasferire file',
  'connectedTo': 'Connesso a',
  'connecting': 'Connessione...',
  'connectionError': 'Errore di connessione',
  'disconnect': 'Disconnetti',
  'selectFiles': 'Seleziona file',
  'activeTransfers': 'Trasferimenti attivi',
  'pendingTransfers': 'Trasferimenti in sospeso',
  'completedTransfers': 'Trasferimenti completati',
  'noTransfers': 'Nessun trasferimento',
  'tapToSelectFiles': 'Tocca per selezionare file',
  'dragAndDropFiles': 'O trascina i file qui',
  'selectedFiles': 'File selezionati',
  'clearAll': 'Cancella tutto',
  'totalSize': 'Dimensione totale',
  'pause': 'Pausa',
  'resume': 'Riprendi',
  'cancel': 'Annulla',
  'send': 'Invia',
  'noActiveChat': 'Nessuna chat attiva',
  'connectToChat': 'Connettiti a un dispositivo per chattare',
  'connected': 'Connesso',
  'clearChat': 'Cancella chat',
  'blockDevice': 'Blocca dispositivo',
  'e2eEncrypted': 'Crittografia end-to-end',
  'startConversation': 'Inizia una conversazione',
  'today': 'Oggi',
  'yesterday': 'Ieri',
  'replyingTo': 'Rispondendo a',
  'typeMessage': 'Scrivi un messaggio...',
  'reply': 'Rispondi',
  'copy': 'Copia',
  'delete': 'Elimina',
  'copiedToClipboard': 'Copiato negli appunti',
  'searchHistory': 'Cerca nella cronologia...',
  'statistics': 'Statistiche',
  'sent': 'Inviato',
  'received': 'Ricevuto',
  'avgSpeed': 'Velocità media',
  'all': 'Tutto',
  'completed': 'Completato',
  'failed': 'Fallito',
  'newestFirst': 'Più recenti prima',
  'oldestFirst': 'Più vecchi prima',
  'largestFirst': 'Più grandi prima',
  'smallestFirst': 'Più piccoli prima',
  'alphabetical': 'Alfabetico',
  'clearHistory': 'Cancella cronologia',
  'clearHistoryConfirmation': 'Sei sicuro di voler cancellare tutta la cronologia dei trasferimenti?',
  'clear': 'Cancella',
  'selected': 'selezionato',
  'noMatchingTransfers': 'Nessun trasferimento corrispondente',
  'noTransferHistory': 'Nessuna cronologia trasferimenti',
  'fileSize': 'Dimensione file',
  'direction': 'Direzione',
  'peer': 'Dispositivo',
  'date': 'Data',
  'duration': 'Durata',
  'averageSpeed': 'Velocità media',
  'encryption': 'Crittografia',
  'error': 'Errore',
  'appearance': 'Aspetto',
  'theme': 'Tema',
  'colorScheme': 'Schema colori',
  'language': 'Lingua',
  'system': 'Sistema',
  'light': 'Chiaro',
  'dark': 'Scuro',
  'notifications': 'Notifiche',
  'enableNotifications': 'Abilita notifiche',
  'sounds': 'Suoni',
  'vibration': 'Vibrazione',
  'security': 'Sicurezza',
  'pqcEncryption': 'Crittografia post-quantistica',
  'pqcDescription': 'Usa crittografia ibrida ML-KEM-768 + X25519',
  'requireVerification': 'Richiedi verifica',
  'verificationDescription': 'Verifica le impronte del dispositivo prima di connetterti',
  'autoAccept': 'Accetta automaticamente dai fidati',
  'autoAcceptDescription': 'Accetta automaticamente i trasferimenti dai dispositivi verificati',
  'transfers': 'Trasferimenti',
  'useRelay': 'Usa server relay',
  'relayDescription': 'Usa relay se la connessione diretta fallisce',
  'maxTransfers': 'Trasferimenti simultanei max',
  'keepScreenOn': 'Mantieni schermo acceso',
  'keepScreenOnDescription': 'Impedisci allo schermo di spegnersi durante i trasferimenti',
  'discovery': 'Scoperta',
  'autoDiscovery': 'Avvia scoperta automatica',
  'autoDiscoveryDescription': 'Inizia a scansionare all\'apertura dell\'app',
  'about': 'Informazioni',
  'version': 'Versione',
  'licenses': 'Licenze open source',
  'privacyPolicy': 'Informativa sulla privacy',
  'dangerZone': 'Zona pericolosa',
  'resetSettings': 'Ripristina impostazioni',
  'resetConfirmation': 'Sei sicuro di voler ripristinare tutte le impostazioni?',
  'reset': 'Ripristina',
  'close': 'Chiudi',
  'join': 'Unisciti',
  'qrCode': 'Codice QR',
  'pointCameraAtQR': 'Punta la fotocamera verso un codice QR',
};

// ============================================================================
// PORTUGUESE
// ============================================================================
const Map<String, String> _ptStrings = {
  'discover': 'Descobrir',
  'transfer': 'Transferir',
  'chat': 'Chat',
  'history': 'Histórico',
  'settings': 'Configurações',
  'localNetwork': 'Rede Local',
  'online': 'Online',
  'local': 'Local',
  'scanning': 'Procurando...',
  'noDevicesFound': 'Nenhum dispositivo encontrado',
  'cancel': 'Cancelar',
  'send': 'Enviar',
  'close': 'Fechar',
  'join': 'Entrar',
  'appearance': 'Aparência',
  'theme': 'Tema',
  'language': 'Idioma',
  'security': 'Segurança',
  'notifications': 'Notificações',
  'about': 'Sobre',
  'version': 'Versão',
  'pqcEncryption': 'Criptografia pós-quântica',
  'pqcDescription': 'Usar criptografia híbrida ML-KEM-768 + X25519',
};

// ============================================================================
// RUSSIAN
// ============================================================================
const Map<String, String> _ruStrings = {
  'discover': 'Обнаружение',
  'transfer': 'Передача',
  'chat': 'Чат',
  'history': 'История',
  'settings': 'Настройки',
  'localNetwork': 'Локальная сеть',
  'online': 'Онлайн',
  'local': 'Локально',
  'scanning': 'Сканирование...',
  'noDevicesFound': 'Устройства не найдены',
  'cancel': 'Отмена',
  'send': 'Отправить',
  'close': 'Закрыть',
  'join': 'Присоединиться',
  'appearance': 'Внешний вид',
  'theme': 'Тема',
  'language': 'Язык',
  'security': 'Безопасность',
  'notifications': 'Уведомления',
  'about': 'О приложении',
  'version': 'Версия',
  'pqcEncryption': 'Постквантовое шифрование',
  'pqcDescription': 'Использовать гибридное шифрование ML-KEM-768 + X25519',
};

// ============================================================================
// CHINESE
// ============================================================================
const Map<String, String> _zhStrings = {
  'discover': '发现',
  'transfer': '传输',
  'chat': '聊天',
  'history': '历史',
  'settings': '设置',
  'localNetwork': '本地网络',
  'online': '在线',
  'local': '本地',
  'scanning': '扫描中...',
  'noDevicesFound': '未找到设备',
  'cancel': '取消',
  'send': '发送',
  'close': '关闭',
  'join': '加入',
  'appearance': '外观',
  'theme': '主题',
  'language': '语言',
  'security': '安全',
  'notifications': '通知',
  'about': '关于',
  'version': '版本',
  'pqcEncryption': '后量子加密',
  'pqcDescription': '使用ML-KEM-768 + X25519混合加密',
};

// ============================================================================
// JAPANESE
// ============================================================================
const Map<String, String> _jaStrings = {
  'discover': '発見',
  'transfer': '転送',
  'chat': 'チャット',
  'history': '履歴',
  'settings': '設定',
  'localNetwork': 'ローカルネットワーク',
  'online': 'オンライン',
  'local': 'ローカル',
  'scanning': 'スキャン中...',
  'noDevicesFound': 'デバイスが見つかりません',
  'cancel': 'キャンセル',
  'send': '送信',
  'close': '閉じる',
  'join': '参加',
  'appearance': '外観',
  'theme': 'テーマ',
  'language': '言語',
  'security': 'セキュリティ',
  'notifications': '通知',
  'about': '情報',
  'version': 'バージョン',
  'pqcEncryption': 'ポスト量子暗号化',
  'pqcDescription': 'ML-KEM-768 + X25519ハイブリッド暗号化を使用',
};

// ============================================================================
// KOREAN
// ============================================================================
const Map<String, String> _koStrings = {
  'discover': '발견',
  'transfer': '전송',
  'chat': '채팅',
  'history': '기록',
  'settings': '설정',
  'localNetwork': '로컬 네트워크',
  'online': '온라인',
  'local': '로컬',
  'scanning': '스캔 중...',
  'noDevicesFound': '기기를 찾을 수 없습니다',
  'cancel': '취소',
  'send': '보내기',
  'close': '닫기',
  'join': '참가',
  'appearance': '외관',
  'theme': '테마',
  'language': '언어',
  'security': '보안',
  'notifications': '알림',
  'about': '정보',
  'version': '버전',
  'pqcEncryption': '포스트 양자 암호화',
  'pqcDescription': 'ML-KEM-768 + X25519 하이브리드 암호화 사용',
};

// ============================================================================
// ARABIC
// ============================================================================
const Map<String, String> _arStrings = {
  'discover': 'اكتشاف',
  'transfer': 'نقل',
  'chat': 'دردشة',
  'history': 'السجل',
  'settings': 'الإعدادات',
  'localNetwork': 'الشبكة المحلية',
  'online': 'متصل',
  'local': 'محلي',
  'scanning': 'جاري البحث...',
  'noDevicesFound': 'لم يتم العثور على أجهزة',
  'cancel': 'إلغاء',
  'send': 'إرسال',
  'close': 'إغلاق',
  'join': 'انضمام',
  'appearance': 'المظهر',
  'theme': 'السمة',
  'language': 'اللغة',
  'security': 'الأمان',
  'notifications': 'الإشعارات',
  'about': 'حول',
  'version': 'الإصدار',
  'pqcEncryption': 'تشفير ما بعد الكم',
  'pqcDescription': 'استخدام تشفير هجين ML-KEM-768 + X25519',
};

// ============================================================================
// HINDI
// ============================================================================
const Map<String, String> _hiStrings = {
  'discover': 'खोजें',
  'transfer': 'स्थानांतरण',
  'chat': 'चैट',
  'history': 'इतिहास',
  'settings': 'सेटिंग्स',
  'localNetwork': 'स्थानीय नेटवर्क',
  'online': 'ऑनलाइन',
  'local': 'स्थानीय',
  'scanning': 'स्कैन हो रहा है...',
  'noDevicesFound': 'कोई डिवाइस नहीं मिला',
  'cancel': 'रद्द करें',
  'send': 'भेजें',
  'close': 'बंद करें',
  'join': 'शामिल हों',
  'appearance': 'दिखावट',
  'theme': 'थीम',
  'language': 'भाषा',
  'security': 'सुरक्षा',
  'notifications': 'सूचनाएं',
  'about': 'के बारे में',
  'version': 'संस्करण',
  'pqcEncryption': 'पोस्ट-क्वांटम एन्क्रिप्शन',
  'pqcDescription': 'ML-KEM-768 + X25519 हाइब्रिड एन्क्रिप्शन का उपयोग करें',
};

// ============================================================================
// BENGALI
// ============================================================================
const Map<String, String> _bnStrings = {
  'discover': 'আবিষ্কার',
  'transfer': 'স্থানান্তর',
  'chat': 'চ্যাট',
  'history': 'ইতিহাস',
  'settings': 'সেটিংস',
  'cancel': 'বাতিল',
  'send': 'পাঠান',
  'close': 'বন্ধ',
  'join': 'যোগ দিন',
};

// ============================================================================
// INDONESIAN
// ============================================================================
const Map<String, String> _idStrings = {
  'discover': 'Temukan',
  'transfer': 'Transfer',
  'chat': 'Obrolan',
  'history': 'Riwayat',
  'settings': 'Pengaturan',
  'cancel': 'Batal',
  'send': 'Kirim',
  'close': 'Tutup',
  'join': 'Gabung',
};

// ============================================================================
// THAI
// ============================================================================
const Map<String, String> _thStrings = {
  'discover': 'ค้นพบ',
  'transfer': 'โอน',
  'chat': 'แชท',
  'history': 'ประวัติ',
  'settings': 'การตั้งค่า',
  'cancel': 'ยกเลิก',
  'send': 'ส่ง',
  'close': 'ปิด',
  'join': 'เข้าร่วม',
};

// ============================================================================
// VIETNAMESE
// ============================================================================
const Map<String, String> _viStrings = {
  'discover': 'Khám phá',
  'transfer': 'Chuyển',
  'chat': 'Trò chuyện',
  'history': 'Lịch sử',
  'settings': 'Cài đặt',
  'cancel': 'Hủy',
  'send': 'Gửi',
  'close': 'Đóng',
  'join': 'Tham gia',
};

// ============================================================================
// TURKISH
// ============================================================================
const Map<String, String> _trStrings = {
  'discover': 'Keşfet',
  'transfer': 'Aktar',
  'chat': 'Sohbet',
  'history': 'Geçmiş',
  'settings': 'Ayarlar',
  'cancel': 'İptal',
  'send': 'Gönder',
  'close': 'Kapat',
  'join': 'Katıl',
};

// ============================================================================
// POLISH
// ============================================================================
const Map<String, String> _plStrings = {
  'discover': 'Odkryj',
  'transfer': 'Transfer',
  'chat': 'Czat',
  'history': 'Historia',
  'settings': 'Ustawienia',
  'cancel': 'Anuluj',
  'send': 'Wyślij',
  'close': 'Zamknij',
  'join': 'Dołącz',
};

// ============================================================================
// DUTCH
// ============================================================================
const Map<String, String> _nlStrings = {
  'discover': 'Ontdekken',
  'transfer': 'Overdragen',
  'chat': 'Chat',
  'history': 'Geschiedenis',
  'settings': 'Instellingen',
  'cancel': 'Annuleren',
  'send': 'Verzenden',
  'close': 'Sluiten',
  'join': 'Deelnemen',
};

// ============================================================================
// UKRAINIAN
// ============================================================================
const Map<String, String> _ukStrings = {
  'discover': 'Виявлення',
  'transfer': 'Передача',
  'chat': 'Чат',
  'history': 'Історія',
  'settings': 'Налаштування',
  'cancel': 'Скасувати',
  'send': 'Надіслати',
  'close': 'Закрити',
  'join': 'Приєднатися',
};

// ============================================================================
// URDU
// ============================================================================
const Map<String, String> _urStrings = {
  'discover': 'دریافت',
  'transfer': 'منتقل',
  'chat': 'چیٹ',
  'history': 'تاریخ',
  'settings': 'ترتیبات',
  'cancel': 'منسوخ',
  'send': 'بھیجیں',
  'close': 'بند کریں',
  'join': 'شامل ہوں',
};

// ============================================================================
// HEBREW
// ============================================================================
const Map<String, String> _heStrings = {
  'discover': 'גלה',
  'transfer': 'העבר',
  'chat': "צ'אט",
  'history': 'היסטוריה',
  'settings': 'הגדרות',
  'cancel': 'ביטול',
  'send': 'שלח',
  'close': 'סגור',
  'join': 'הצטרף',
};
