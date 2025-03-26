import express from 'express';
import path from 'path';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Obtention du répertoire du fichier en utilisant import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname); // Remplace __dirname

// Middleware pour servir les fichiers statiques à partir du répertoire public
app.use(express.static(path.join(__dirname, 'public'))); // Si vous avez des fichiers dans le répertoire public

// Middleware pour servir les fichiers dans .well-known
// Assurez-vous que le répertoire .well-known existe à la racine du projet
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// Middleware avec redirection dynamique et code promo
const redirectWithPreview = (targetUrl, getTitle, getDescription, getImage, isRegister = false) => {
  return (req, res) => {
    const code = req.query.code;
    const title = getTitle(code);
    const description = getDescription(code);
    const image = getImage(code);

    const url = new URL(targetUrl);

    // Si un code est présent, l'ajouter à l'URL de redirection
    if (code) {
      url.searchParams.append('code', code);
    }

    // Si c'est la route d'inscription, rediriger vers le Playstore si l'application n'est pas installée
    if (isRegister) {
      const isMobile = req.headers['user-agent'].includes('Mobile');
      if (isMobile) {
        res.redirect('https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://play.google.com/store/apps/details%3Fid%3Dcom.devweb012.prepaconcour%26hl%3Dfr_CH%26referrer%3Dutm_source%253Dgoogle%2526utm_medium%253Dorganic%2526utm_term%253Dcursus%2Bapplication%2Bweb%26pcampaignid%3DAPPU_1_AzrIZ77PDqmOxc8PlvbM8Q0&ved=2ahUKEwj-3M-57_KLAxUpR_EDHRY7M94Q5YQBegQIEBAC&usg=AOvVaw33gnJlRGxWJj6JuAGDwR6I');
        return;
      }
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
          <meta http-equiv="refresh" content="0;url=${url.toString()}">
        </head>
        <body>
          <p>Redirection automatique vers <a href="${url.toString()}">${title}</a>...</p>
        </body>
      </html>
    `;

    res.send(html);
  };
};

// Route de redirection vers la page de connexion
app.get('/', (req, res) => {
  res.redirect('https://www.cursusbf.com/connexion.html');
});

// Routes avec redirection dynamique et code promo
app.get('/multijoueur', redirectWithPreview(
  'https://www.cursusbf.com/multijoueur',
  (code) => code ? `Mode Multijoueur - ${code}` : 'Mode Multijoueur',
  (code) => code ? `Défiez vos amis avec le code: ${code}` : 'Défiez vos amis et proches dans des défis de révision',
  (code) => code ? `https://www.cursusbf.com/assets/img/logo.jpg` : 'https://www.cursusbf.com/assets/img/logo.jpg'
));

app.get('/Register', redirectWithPreview(
  'https://www.cursusbf.com/Register',
  (code) => code ? `Inscription avec PROMO: ${code}` : 'Inscription Cursus',
  (code) => code ? `Créez votre compte avec le code ${code} pour des avantages exclusifs` : 'Créez votre compte pour accéder à toutes les fonctionnalités',
  (code) => code ? `https://www.cursusbf.com/assets/img/logo.jpg` : 'https://www.cursusbf.com/assets/img/logo.jpg',
  true // Cette route nécessite la gestion de la redirection Playstore
));

// Serveur d'écoute sur le port 3000
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
