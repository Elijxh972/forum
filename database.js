// Fonction pour hasher un mot de passe (hash simple mais efficace)
// Note: En production, utilisez bcrypt ou argon2 pour un hachage plus sécurisé
function hashPassword(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Ajouter un salt simple pour plus de sécurité
    return hash.toString(16) + str.length.toString(16);
}

// Fonction pour vérifier si Supabase est configuré
function isSupabaseConfigured() {
    return typeof supabase !== 'undefined' && 
           supabase !== null &&
           typeof SUPABASE_URL !== 'undefined' &&
           typeof SUPABASE_ANON_KEY !== 'undefined' &&
           SUPABASE_URL !== 'VOTRE_URL_SUPABASE' && 
           SUPABASE_ANON_KEY !== 'VOTRE_CLE_ANON_SUPABASE';
}

// Base de données simulée - Utilisateurs par défaut (mots de passe hashés)
const defaultUsers = [
    { id: 1, username: "admin", password: hashPassword("admin") },
    { id: 2, username: "user1", password: hashPassword("password1") },
    { id: 3, username: "user2", password: hashPassword("password2") }
];

// Données par défaut
const defaultQuestions = [
    {
        id: 1,
        content: "Comment utiliser AJAX avec JavaScript?",
        author: "user1",
        date: "2025-01-15T10:30:00",
        answers: [
            {
                id: 1,
                content: "AJAX permet de faire des requêtes HTTP asynchrones sans recharger la page.",
                author: "admin",
                date: "2025-01-15T11:00:00"
            }
        ]
    },
    {
        id: 2,
        content: "Quelle est la meilleure façon d'apprendre le développement web?",
        author: "user2",
        date: "2025-01-14T14:20:00",
        answers: [
            {
                id: 2,
                content: "Je recommande de commencer par HTML, CSS et JavaScript, puis d'explorer des frameworks.",
                author: "user1",
                date: "2025-01-14T15:45:00"
            },
            {
                id: 3,
                content: "Pratiquez en créant des projets personnels, c'est la meilleure méthode!",
                author: "admin",
                date: "2025-01-14T16:30:00"
            }
        ]
    }
];

// ========== FONCTIONS LOCALSTORAGE (FALLBACK) ==========
function loadQuestionsFromStorage() {
    const stored = localStorage.getItem('forumQuestions');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erreur lors du chargement des questions:', e);
            saveQuestionsToStorage(defaultQuestions);
            return defaultQuestions;
        }
    }
    saveQuestionsToStorage(defaultQuestions);
    return defaultQuestions;
}

function saveQuestionsToStorage(questionsData) {
    localStorage.setItem('forumQuestions', JSON.stringify(questionsData));
}

function loadUsersFromStorage() {
    const stored = localStorage.getItem('forumUsers');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erreur lors du chargement des utilisateurs:', e);
            saveUsersToStorage(defaultUsers);
            return defaultUsers;
        }
    }
    saveUsersToStorage(defaultUsers);
    return defaultUsers;
}

function saveUsersToStorage(usersData) {
    localStorage.setItem('forumUsers', JSON.stringify(usersData));
}

// ========== FONCTIONS SUPABASE ==========
async function loadUsersFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs depuis Supabase:', error);
        return [];
    }
}

async function loadQuestionsFromSupabase() {
    try {
        // Charger les questions
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .order('date', { ascending: false });
        
        if (questionsError) throw questionsError;
        
        // Charger les réponses pour chaque question
        if (questions && questions.length > 0) {
            const questionIds = questions.map(q => q.id);
            const { data: answers, error: answersError } = await supabase
                .from('answers')
                .select('*')
                .in('question_id', questionIds)
                .order('date', { ascending: false });
            
            if (answersError) throw answersError;
            
            // Associer les réponses aux questions
            questions.forEach(question => {
                question.answers = answers.filter(a => a.question_id === question.id) || [];
            });
        }
        
        return questions || [];
    } catch (error) {
        console.error('Erreur lors du chargement des questions depuis Supabase:', error);
        return [];
    }
}

// ========== CLASSE DATABASE ==========
class Database {
    // ========== UTILISATEURS ==========
    static async getUsers() {
        if (isSupabaseConfigured()) {
            return await loadUsersFromSupabase();
        }
        return loadUsersFromStorage();
    }

    static async getUserByUsername(username) {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .single();
                
                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    throw error;
                }
                return data || null;
            } catch (error) {
                console.error('Erreur lors de la recherche de l\'utilisateur:', error);
                return null;
            }
        }
        const users = loadUsersFromStorage();
        return users.find(u => u.username === username) || null;
    }

    static async addUser(username, password) {
        if (isSupabaseConfigured()) {
            try {
                // Vérifier si l'utilisateur existe déjà
                const existing = await this.getUserByUsername(username);
                if (existing) {
                    return null;
                }
                
                const hashedPassword = hashPassword(password);
                const { data, error } = await supabase
                    .from('users')
                    .insert([{ username, password: hashedPassword }])
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
                return null;
            }
        }
        
        // Fallback localStorage
        const users = loadUsersFromStorage();
        if (users.find(u => u.username === username)) {
            return null;
        }
        
        const hashedPassword = hashPassword(password);
        const nextUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = {
            id: nextUserId,
            username: username,
            password: hashedPassword
        };
        
        users.push(newUser);
        saveUsersToStorage(users);
        return newUser;
    }

    // ========== QUESTIONS ==========
    static async getQuestions() {
        if (isSupabaseConfigured()) {
            const questions = await loadQuestionsFromSupabase();
            // Les questions sont déjà triées par date décroissante
            // Trier les réponses de chaque question
            questions.forEach(question => {
                if (question.answers && question.answers.length > 0) {
                    question.answers.sort((a, b) => new Date(b.date) - new Date(a.date));
                }
            });
            return questions;
        }
        
        // Fallback localStorage
        let questions = loadQuestionsFromStorage();
        questions.sort((a, b) => new Date(b.date) - new Date(a.date));
        questions.forEach(question => {
            if (question.answers && question.answers.length > 0) {
                question.answers.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        });
        return questions;
    }

    static async addQuestion(question) {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('questions')
                    .insert([{
                        content: question.content,
                        author: question.author,
                        date: question.date
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                // Ajouter un tableau answers vide pour la compatibilité
                data.answers = [];
                return data;
            } catch (error) {
                console.error('Erreur lors de l\'ajout de la question:', error);
                return null;
            }
        }
        
        // Fallback localStorage
        let questions = loadQuestionsFromStorage();
        const maxId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) : 0;
        question.id = maxId + 1;
        questions.unshift(question);
        saveQuestionsToStorage(questions);
        return question;
    }

    static async addAnswer(questionId, answer) {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('answers')
                    .insert([{
                        question_id: questionId,
                        content: answer.content,
                        author: answer.author,
                        date: answer.date
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Erreur lors de l\'ajout de la réponse:', error);
                return null;
            }
        }
        
        // Fallback localStorage
        let questions = loadQuestionsFromStorage();
        const question = questions.find(q => q.id === questionId);
        if (question) {
            const maxAnswerId = question.answers && question.answers.length > 0 
                ? Math.max(...question.answers.map(a => a.id)) 
                : 0;
            answer.id = maxAnswerId + 1;
            if (!question.answers) question.answers = [];
            question.answers.unshift(answer);
            saveQuestionsToStorage(questions);
            return answer;
        }
        return null;
    }

    static async deleteQuestion(questionId) {
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('questions')
                    .delete()
                    .eq('id', questionId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Erreur lors de la suppression de la question:', error);
                return false;
            }
        }
        
        // Fallback localStorage
        let questions = loadQuestionsFromStorage();
        const index = questions.findIndex(q => q.id === questionId);
        if (index !== -1) {
            questions.splice(index, 1);
            saveQuestionsToStorage(questions);
            return true;
        }
        return false;
    }

    static async deleteAnswer(questionId, answerId) {
        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('answers')
                    .delete()
                    .eq('id', answerId)
                    .eq('question_id', questionId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Erreur lors de la suppression de la réponse:', error);
                return false;
            }
        }
        
        // Fallback localStorage
        let questions = loadQuestionsFromStorage();
        const question = questions.find(q => q.id === questionId);
        if (question) {
            const index = question.answers.findIndex(a => a.id === answerId);
            if (index !== -1) {
                question.answers.splice(index, 1);
                saveQuestionsToStorage(questions);
                return true;
            }
        }
        return false;
    }
}
