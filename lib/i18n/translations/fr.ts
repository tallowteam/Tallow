/**
 * French (Français) Translations
 */

import type { TranslationKeys } from '../types';

const translations: Partial<TranslationKeys> = {
  // Common
  'common.loading': 'Chargement...',
  'common.error': 'Erreur',
  'common.success': 'Succès',
  'common.cancel': 'Annuler',
  'common.confirm': 'Confirmer',
  'common.close': 'Fermer',
  'common.save': 'Enregistrer',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.search': 'Rechercher',
  'common.settings': 'Paramètres',
  'common.language': 'Langue',

  // Navigation
  'nav.home': 'Accueil',
  'nav.features': 'Fonctionnalités',
  'nav.security': 'Sécurité',
  'nav.pricing': 'Tarifs',
  'nav.docs': 'Documentation',
  'nav.openApp': 'Ouvrir l\'application',

  // Hero Section
  'hero.title': 'Transfert de fichiers sécurisé, résistant aux ordinateurs quantiques',
  'hero.subtitle': 'Partagez des fichiers en pair-à-pair avec un chiffrement de niveau militaire. Pas de serveurs, pas de suivi, juste la confidentialité pure.',
  'hero.cta.primary': 'Commencer le transfert',
  'hero.cta.secondary': 'En savoir plus',

  // Features
  'features.title': 'Pourquoi choisir Tallow ?',
  'features.subtitle': 'Une sécurité de pointe rencontre des performances ultra-rapides',
  'features.p2p.title': 'Véritable pair-à-pair',
  'features.p2p.description': 'Connexion directe entre appareils. Vos fichiers ne touchent jamais nos serveurs.',
  'features.encryption.title': 'Chiffrement post-quantique',
  'features.encryption.description': 'Sécurité à l\'épreuve du futur avec Kyber-1024 et ChaCha20-Poly1305.',
  'features.speed.title': 'Ultra-rapide',
  'features.speed.description': 'Transférez des fichiers à la vitesse complète du réseau avec le découpage parallèle.',

  // Transfer
  'transfer.selectFiles': 'Sélectionner des fichiers',
  'transfer.dropFiles': 'Déposer les fichiers ici',
  'transfer.connecting': 'Connexion...',
  'transfer.connected': 'Connecté',
  'transfer.transferring': 'Transfert en cours',
  'transfer.complete': 'Transfert terminé',
  'transfer.failed': 'Échec du transfert',

  // File Management
  'files.count': '{{count}} fichier',
  'files.count_plural': '{{count}} fichiers',
  'files.size': 'Taille : {{size}}',
  'files.uploaded': 'Téléchargé',
  'files.downloading': 'Téléchargement',

  // Security
  'security.encrypted': 'Chiffré',
  'security.verified': 'Vérifié',
  'security.quantum': 'Résistant au quantique',

  // Errors
  'error.network': 'Une erreur réseau s\'est produite',
  'error.fileSize': 'La taille du fichier dépasse la limite',
  'error.upload': 'Échec du téléchargement',
  'error.download': 'Échec du téléchargement',
  'error.connection': 'Connexion perdue',

  // Accessibility
  'a11y.skipToContent': 'Passer au contenu principal',
  'a11y.menu': 'Ouvrir le menu de navigation',
  'a11y.closeMenu': 'Fermer le menu de navigation',
  'a11y.darkMode': 'Passer en mode sombre',
  'a11y.lightMode': 'Passer en mode clair',

  // Footer
  'footer.copyright': '© {{year}} Tallow. Tous droits réservés.',
  'footer.privacy': 'Politique de confidentialité',
  'footer.terms': 'Conditions d\'utilisation',
  'footer.contact': 'Contact',
};

export default translations;
