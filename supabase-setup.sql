-- Script SQL pour créer les tables dans Supabase
-- Exécutez ce script dans l'éditeur SQL de Supabase (SQL Editor)

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des questions
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    author VARCHAR(50) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réponses
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author VARCHAR(50) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_questions_date ON questions(date DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_date ON answers(date DESC);

-- Activer Row Level Security (RLS) - optionnel mais recommandé
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour permettre la lecture publique
CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access on questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on answers" ON answers FOR SELECT USING (true);

-- Politiques RLS pour permettre l'insertion publique
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on answers" ON answers FOR INSERT WITH CHECK (true);

-- Politiques RLS pour permettre la mise à jour publique (pour les propriétaires)
CREATE POLICY "Allow public update on questions" ON questions FOR UPDATE USING (true);
CREATE POLICY "Allow public update on answers" ON answers FOR UPDATE USING (true);

-- Politiques RLS pour permettre la suppression publique (pour les propriétaires)
CREATE POLICY "Allow public delete on questions" ON questions FOR DELETE USING (true);
CREATE POLICY "Allow public delete on answers" ON answers FOR DELETE USING (true);

-- Insérer des utilisateurs par défaut (mots de passe hashés)
-- IMPORTANT: Utilisez le fichier generate-user-hashes.html pour générer les hashs corrects
-- Puis exécutez la requête INSERT générée dans l'éditeur SQL de Supabase

