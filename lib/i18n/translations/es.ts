/**
 * Spanish (Español) Translations
 */

import type { TranslationKeys } from '../types';

const translations: Partial<TranslationKeys> = {
  // Common
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.success': 'Éxito',
  'common.cancel': 'Cancelar',
  'common.confirm': 'Confirmar',
  'common.close': 'Cerrar',
  'common.save': 'Guardar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.search': 'Buscar',
  'common.settings': 'Configuración',
  'common.language': 'Idioma',

  // Navigation
  'nav.home': 'Inicio',
  'nav.features': 'Características',
  'nav.security': 'Seguridad',
  'nav.pricing': 'Precios',
  'nav.docs': 'Documentos',
  'nav.openApp': 'Abrir aplicación',

  // Hero Section
  'hero.title': 'Transferencia segura de archivos, a prueba de computación cuántica',
  'hero.subtitle': 'Comparte archivos entre pares con cifrado de grado militar. Sin servidores, sin rastreo, solo privacidad pura.',
  'hero.cta.primary': 'Empezar a transferir',
  'hero.cta.secondary': 'Más información',

  // Features
  'features.title': '¿Por qué elegir Tallow?',
  'features.subtitle': 'Seguridad líder en la industria se encuentra con un rendimiento increíblemente rápido',
  'features.p2p.title': 'Verdadero entre pares',
  'features.p2p.description': 'Conexión directa entre dispositivos. Tus archivos nunca tocan nuestros servidores.',
  'features.encryption.title': 'Cifrado post-cuántico',
  'features.encryption.description': 'Seguridad a prueba de futuro con Kyber-1024 y ChaCha20-Poly1305.',
  'features.speed.title': 'Increíblemente rápido',
  'features.speed.description': 'Transfiere archivos a velocidad de red completa con fragmentación paralela.',

  // Transfer
  'transfer.selectFiles': 'Seleccionar archivos',
  'transfer.dropFiles': 'Suelta archivos aquí',
  'transfer.connecting': 'Conectando...',
  'transfer.connected': 'Conectado',
  'transfer.transferring': 'Transfiriendo',
  'transfer.complete': 'Transferencia completa',
  'transfer.failed': 'Transferencia fallida',

  // File Management
  'files.count': '{{count}} archivo',
  'files.count_plural': '{{count}} archivos',
  'files.size': 'Tamaño: {{size}}',
  'files.uploaded': 'Subido',
  'files.downloading': 'Descargando',

  // Security
  'security.encrypted': 'Cifrado',
  'security.verified': 'Verificado',
  'security.quantum': 'A prueba de cuántica',

  // Errors
  'error.network': 'Se produjo un error de red',
  'error.fileSize': 'El tamaño del archivo excede el límite',
  'error.upload': 'Error al subir',
  'error.download': 'Error al descargar',
  'error.connection': 'Conexión perdida',

  // Accessibility
  'a11y.skipToContent': 'Saltar al contenido principal',
  'a11y.menu': 'Abrir menú de navegación',
  'a11y.closeMenu': 'Cerrar menú de navegación',
  'a11y.darkMode': 'Cambiar a modo oscuro',
  'a11y.lightMode': 'Cambiar a modo claro',

  // Footer
  'footer.copyright': '© {{year}} Tallow. Todos los derechos reservados.',
  'footer.privacy': 'Política de privacidad',
  'footer.terms': 'Términos de servicio',
  'footer.contact': 'Contacto',
};

export default translations;
