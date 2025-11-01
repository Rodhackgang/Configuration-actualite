import express from 'express';
import path from 'path';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 8035;

// Obtention du répertoire du fichier en utilisant import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

const redirectWithPreview = (targetUrl, getTitle, getDescription, getImage) => {
  return (req, res) => {
    const code = req.query.code;
    const title = getTitle(code);
    const description = getDescription(code);
    const image = getImage(code);
    
    // Construire le deep link de l'app
    let deepLinkUrl;
    if (targetUrl.includes('multijoueur')) {
      deepLinkUrl = `cursusactualite://multijoueur`;
      if (code) {
        deepLinkUrl += `?code=${encodeURIComponent(code)}`;
      }
    } else if (targetUrl.includes('Register')) {
      deepLinkUrl = `cursusactualite://Register`;
      if (code) {
        deepLinkUrl += `?code=${encodeURIComponent(code)}`;
      }
    } else {
      deepLinkUrl = targetUrl;
    }
    
    // URL Play Store
    const playStoreUrl = `https://play.google.com/store/apps/details?id=com.cursus.actualite`;
    
    // URL de fallback web
    const webUrl = new URL(targetUrl);
    if (code) {
      webUrl.searchParams.append('code', code);
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta name="google-play-app" content="app-id=com.cursus.actualite">
  
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      text-align: center;
    }
    .app-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
      border-radius: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    h1 { color: #333; margin: 0 0 10px; font-size: 24px; }
    p { color: #666; margin: 0 0 30px; line-height: 1.6; }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      margin: 5px;
      transition: transform 0.2s;
    }
    .button:hover { transform: scale(1.05); }
    .button-secondary { background: #f0f0f0; color: #333; }
    .loading { margin-top: 20px; color: #999; font-size: 14px; }
    #fallbackButtons { display: none; margin-top: 20px; }
  </style>
  
  <script>
    const appUrl = '${deepLinkUrl}';
    const playStoreUrl = '${playStoreUrl}';
    const webUrl = '${webUrl.toString()}';
    let appOpened = false;
    
    function isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    function isAndroid() {
      return /Android/i.test(navigator.userAgent);
    }
    
    function showFallbackOptions() {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('fallbackButtons').style.display = 'block';
    }
    
    function tryOpenApp() {
      if (isMobile()) {
        // Afficher le message de chargement
        document.getElementById('loading').style.display = 'block';
        
        // Détecter si l'app s'est ouverte
        const startTime = Date.now();
        
        // Tenter d'ouvrir l'application
        window.location.href = appUrl;
        
        // Vérifier si l'utilisateur est revenu (l'app ne s'est pas ouverte)
        const checkAppOpened = setTimeout(() => {
          const timeElapsed = Date.now() - startTime;
          
          // Si moins de 2 secondes se sont écoulées et le document est toujours visible,
          // l'app n'est probablement pas installée
          if (timeElapsed < 2500 && !document.hidden) {
            if (isAndroid()) {
              // Rediriger vers le Play Store
              window.location.href = playStoreUrl;
            } else {
              // Pour iOS ou autres, afficher les options
              showFallbackOptions();
            }
          }
        }, 1500);
        
        // Détecter si l'app s'est effectivement ouverte
        window.addEventListener('blur', () => {
          clearTimeout(checkAppOpened);
          appOpened = true;
        });
        
        // Détecter le retour sur la page (pagehide/visibilitychange)
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            clearTimeout(checkAppOpened);
            appOpened = true;
          }
        });
        
        // Alternative : utiliser Intent pour Android
        if (isAndroid() && !appOpened) {
          setTimeout(() => {
            if (!appOpened && !document.hidden) {
              // Utiliser un Intent Android comme alternative
              const intentUrl = 'intent://' + appUrl.replace('cursusactualite://', '') + 
                '#Intent;scheme=cursus;package=com.cursus.actualite;' +
                'S.browser_fallback_url=' + encodeURIComponent(playStoreUrl) + ';end';
              window.location.href = intentUrl;
            }
          }, 1000);
        }
      } else {
        // Sur desktop, rediriger vers le site web
        window.location.href = webUrl;
      }
    }
    
    // Lancer la tentative d'ouverture au chargement
    window.addEventListener('load', tryOpenApp);
  </script>
</head>
<body>
  <div class="container">
    <div class="app-icon">🎮</div>
    <h1>${title}</h1>
    <p>${description}</p>
    
    <div id="loading" class="loading" style="display: none;">
      Ouverture de l'application...
    </div>
    
    <div id="fallbackButtons">
      <a href="${playStoreUrl}" class="button">
        📱 Installer l'application
      </a>
      <a href="${webUrl.toString()}" class="button button-secondary">
        🌐 Continuer sur le web
      </a>
      <div style="margin-top: 15px; color: #999; font-size: 13px;">
        Installez l'app pour une meilleure expérience
      </div>
    </div>
  </div>
</body>
</html>`;
    res.send(html);
  };
};

// Route de redirection vers la page de connexion
app.get('/', (req, res) => {
  res.redirect('https://www.cursusbf.me/connexion.html');
});

// Routes avec redirection dynamique et code promo
app.get('/multijoueur', redirectWithPreview(
  'https://www.cursusbf.me/multijoueur',
  (code) => code ? `Mode Multijoueur - ${code}` : 'Mode Multijoueur',
  (code) => code ? `Défiez vos amis avec le code: ${code}` : 'Défiez vos amis et proches dans des défis de révision',
  (code) => 'https://www.cursusbf.me/assets/img/logo.jpg'
));

app.get('/Register', redirectWithPreview(
  'https://www.cursusbf.me/Register',
  (code) => code ? `Inscription avec PROMO: ${code}` : 'Inscription Cursus',
  (code) => code ? `Créez votre compte avec le code ${code} pour des avantages exclusifs` : 'Créez votre compte pour accéder à toutes les fonctionnalités',
  (code) => 'https://www.cursusbf.me/assets/img/logo.jpg'
));

// Serveur d'écoute
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
