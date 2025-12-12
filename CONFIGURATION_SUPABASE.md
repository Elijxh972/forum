# Configuration Supabase pour le Forum

Ce guide vous explique comment configurer Supabase pour que votre forum fonctionne avec une base de données partagée sur Netlify.

## Pourquoi Supabase ?

Le projet utilise actuellement `localStorage`, qui stocke les données dans le navigateur de chaque utilisateur. Sur Netlify, cela signifie que :
- Chaque utilisateur a sa propre base de données locale
- Les données ne sont pas partagées entre utilisateurs
- Les données sont perdues si l'utilisateur vide son cache

**Supabase** résout ce problème en fournissant une base de données PostgreSQL partagée accessible via une API REST.

## Étape 1 : Créer un compte Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"** ou **"Sign up"**
3. Créez un compte (gratuit) avec GitHub, Google ou email
4. Créez un nouveau projet :
   - Choisissez un nom pour votre projet
   - Choisissez un mot de passe pour la base de données
   - Sélectionnez une région proche de vous
   - Cliquez sur **"Create new project"**

## Étape 2 : Obtenir vos clés API

1. Une fois le projet créé, allez dans **Settings** (⚙️) > **API**
2. Vous verrez :
   - **Project URL** : C'est votre `SUPABASE_URL`
   - **anon public key** : C'est votre `SUPABASE_ANON_KEY`
3. Copiez ces deux valeurs

## Étape 3 : Configurer le fichier config.js

1. Ouvrez le fichier `config.js` dans votre projet
2. Remplacez `VOTRE_URL_SUPABASE` par votre Project URL
3. Remplacez `VOTRE_CLE_ANON_SUPABASE` par votre anon public key

Exemple :
```javascript
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

## Étape 4 : Créer les tables dans Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor** (dans le menu de gauche)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase-setup.sql` de votre projet
4. Copiez tout le contenu du fichier
5. Collez-le dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter)

Les tables suivantes seront créées :
- `users` : Stocke les utilisateurs
- `questions` : Stocke les questions
- `answers` : Stocke les réponses

## Étape 5 : Insérer les utilisateurs par défaut

Après avoir exécuté le script SQL, vous devez insérer les utilisateurs par défaut avec les bons hashs de mots de passe.

1. Ouvrez la console de votre navigateur sur votre site local
2. Exécutez cette commande pour générer les hashs :
```javascript
function hashPassword(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16) + str.length.toString(16);
}

console.log('admin:', hashPassword('admin'));
console.log('password1:', hashPassword('password1'));
console.log('password2:', hashPassword('password2'));
```

3. Copiez les hashs générés
4. Retournez dans Supabase > SQL Editor
5. Exécutez cette requête (remplacez les hashs) :
```sql
INSERT INTO users (username, password) VALUES 
    ('admin', 'VOTRE_HASH_ADMIN'),
    ('user1', 'VOTRE_HASH_PASSWORD1'),
    ('user2', 'VOTRE_HASH_PASSWORD2')
ON CONFLICT (username) DO NOTHING;
```

## Étape 6 : Tester localement

1. Ouvrez votre site localement
2. Ouvrez la console du navigateur (F12)
3. Vérifiez qu'il n'y a pas d'erreurs
4. Essayez de vous connecter avec un des comptes par défaut :
   - `admin` / `admin`
   - `user1` / `password1`
   - `user2` / `password2`

## Étape 7 : Déployer sur Netlify

1. Assurez-vous que `config.js` contient vos vraies clés Supabase
2. **⚠️ IMPORTANT** : Ne commitez PAS `config.js` avec vos clés dans un dépôt public
3. Pour Netlify, vous pouvez :
   - Soit utiliser les variables d'environnement Netlify (recommandé)
   - Soit modifier `config.js` directement avant le déploiement

### Option A : Variables d'environnement Netlify (Recommandé)

1. Dans Netlify, allez dans **Site settings** > **Environment variables**
2. Ajoutez :
   - `SUPABASE_URL` = votre URL Supabase
   - `SUPABASE_ANON_KEY` = votre clé anon
3. Modifiez `config.js` pour lire depuis les variables d'environnement :
```javascript
const SUPABASE_URL = window.SUPABASE_URL || 'VOTRE_URL_SUPABASE';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'VOTRE_CLE_ANON_SUPABASE';
```

### Option B : Modifier config.js directement

1. Modifiez `config.js` avec vos vraies clés
2. Déployez sur Netlify
3. **Note** : Vos clés seront visibles dans le code source du site (c'est normal pour la clé anon)

## Vérification

Une fois déployé, vérifiez que :
- ✅ Les utilisateurs peuvent se connecter
- ✅ Les questions sont partagées entre tous les utilisateurs
- ✅ Les réponses sont partagées entre tous les utilisateurs
- ✅ Les données persistent après rechargement de la page

## Fallback localStorage

Si Supabase n'est pas configuré (clés non remplies), l'application utilisera automatiquement `localStorage` comme avant. Cela permet de continuer à développer localement sans Supabase.

## Sécurité

- La clé `anon` est publique et peut être exposée dans le code client
- Les politiques RLS (Row Level Security) protègent votre base de données
- Pour plus de sécurité, vous pouvez restreindre les politiques RLS dans Supabase

## Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que les tables existent dans Supabase
3. Vérifiez que les politiques RLS sont correctement configurées
4. Vérifiez que vos clés API sont correctes dans `config.js`

