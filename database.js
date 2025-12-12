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

// Base de données simulée - Utilisateurs par défaut (mots de passe hashés)
// Note: En production, ces hashs devraient être générés au moment de la création
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

// Fonctions pour gérer le localStorage
function loadQuestionsFromStorage() {
    const stored = localStorage.getItem('forumQuestions');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            // Si les données sont corrompues, réinitialiser avec les données par défaut
            console.error('Erreur lors du chargement des questions:', e);
            saveQuestionsToStorage(defaultQuestions);
            return defaultQuestions;
        }
    }
    // Si aucune donnée n'existe, initialiser avec les données par défaut
    saveQuestionsToStorage(defaultQuestions);
    return defaultQuestions;
}

function saveQuestionsToStorage(questionsData) {
    localStorage.setItem('forumQuestions', JSON.stringify(questionsData));
}

function loadNextIdsFromStorage() {
    const stored = localStorage.getItem('forumNextIds');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            // Si les données sont corrompues, réinitialiser avec les valeurs par défaut
            console.error('Erreur lors du chargement des IDs:', e);
            const defaultIds = { nextQuestionId: 3, nextAnswerId: 4 };
            saveNextIdsToStorage(defaultIds);
            return defaultIds;
        }
    }
    // Valeurs par défaut
    const defaultIds = { nextQuestionId: 3, nextAnswerId: 4 };
    saveNextIdsToStorage(defaultIds);
    return defaultIds;
}

function saveNextIdsToStorage(ids) {
    localStorage.setItem('forumNextIds', JSON.stringify(ids));
}

// Fonctions pour gérer les utilisateurs dans localStorage
function loadUsersFromStorage() {
    const stored = localStorage.getItem('forumUsers');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            // Si les données sont corrompues, réinitialiser avec les utilisateurs par défaut
            console.error('Erreur lors du chargement des utilisateurs:', e);
            saveUsersToStorage(defaultUsers);
            return defaultUsers;
        }
    }
    // Si aucune donnée n'existe, initialiser avec les utilisateurs par défaut
    saveUsersToStorage(defaultUsers);
    return defaultUsers;
}

function saveUsersToStorage(usersData) {
    localStorage.setItem('forumUsers', JSON.stringify(usersData));
}

function loadNextUserIdFromStorage() {
    const stored = localStorage.getItem('forumNextUserId');
    if (stored) {
        const parsed = parseInt(stored);
        if (!isNaN(parsed)) {
            return parsed;
        }
    }
    // Valeur par défaut (4 car on a déjà 3 utilisateurs par défaut)
    const defaultNextId = 4;
    saveNextUserIdToStorage(defaultNextId);
    return defaultNextId;
}

function saveNextUserIdToStorage(nextId) {
    localStorage.setItem('forumNextUserId', nextId.toString());
}

// Initialiser les données depuis localStorage
let questions = loadQuestionsFromStorage();
let { nextQuestionId, nextAnswerId } = loadNextIdsFromStorage();

// Fonctions pour interagir avec la base de données
class Database {
    static getUsers() {
        // Recharger depuis localStorage pour être sûr d'avoir les dernières données
        return loadUsersFromStorage();
    }

    static getUserByUsername(username) {
        const users = loadUsersFromStorage();
        return users.find(u => u.username === username);
    }

    static addUser(username, password) {
        // Recharger les utilisateurs depuis localStorage
        const users = loadUsersFromStorage();
        let nextUserId = loadNextUserIdFromStorage();
        
        // Vérifier si l'utilisateur existe déjà
        if (users.find(u => u.username === username)) {
            return null; // Utilisateur déjà existant
        }
        
        // Hasher le mot de passe avant de le stocker
        const hashedPassword = hashPassword(password);
        
        // Créer le nouvel utilisateur
        const newUser = {
            id: nextUserId++,
            username: username,
            password: hashedPassword
        };
        
        users.push(newUser);
        
        // Sauvegarder les utilisateurs et le prochain ID
        saveUsersToStorage(users);
        saveNextUserIdToStorage(nextUserId);
        
        return newUser;
    }

    static getQuestions() {
        // Recharger depuis localStorage pour être sûr d'avoir les dernières données
        questions = loadQuestionsFromStorage();
        
        // Trier les questions par date décroissante (ordre anti-chronologique)
        questions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Trier les réponses de chaque question par date décroissante (ordre anti-chronologique)
        questions.forEach(question => {
            if (question.answers && question.answers.length > 0) {
                question.answers.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        });
        
        return questions;
    }

    static addQuestion(question) {
        // Recharger les questions et IDs depuis localStorage
        questions = loadQuestionsFromStorage();
        const ids = loadNextIdsFromStorage();
        nextQuestionId = ids.nextQuestionId;
        nextAnswerId = ids.nextAnswerId;
        
        question.id = nextQuestionId++;
        questions.unshift(question);
        
        // Sauvegarder les questions et les IDs
        saveQuestionsToStorage(questions);
        saveNextIdsToStorage({ nextQuestionId, nextAnswerId });
        
        return question;
    }

    static addAnswer(questionId, answer) {
        // Recharger les questions et IDs depuis localStorage
        questions = loadQuestionsFromStorage();
        const ids = loadNextIdsFromStorage();
        nextQuestionId = ids.nextQuestionId;
        nextAnswerId = ids.nextAnswerId;
        
        const question = questions.find(q => q.id === questionId);
        if (question) {
            answer.id = nextAnswerId++;
            question.answers.unshift(answer);
            
            // Sauvegarder les questions et les IDs
            saveQuestionsToStorage(questions);
            saveNextIdsToStorage({ nextQuestionId, nextAnswerId });
            
            return answer;
        }
        return null;
    }

    static deleteQuestion(questionId) {
        // Recharger les questions depuis localStorage
        questions = loadQuestionsFromStorage();
        
        const index = questions.findIndex(q => q.id === questionId);
        if (index !== -1) {
            questions.splice(index, 1);
            
            // Sauvegarder les questions
            saveQuestionsToStorage(questions);
            
            return true;
        }
        return false;
    }

    static deleteAnswer(questionId, answerId) {
        // Recharger les questions depuis localStorage
        questions = loadQuestionsFromStorage();
        
        const question = questions.find(q => q.id === questionId);
        if (question) {
            const index = question.answers.findIndex(a => a.id === answerId);
            if (index !== -1) {
                question.answers.splice(index, 1);
                
                // Sauvegarder les questions
                saveQuestionsToStorage(questions);
                
                return true;
            }
        }
        return false;
    }
}