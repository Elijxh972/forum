// État de l'application
let currentUser = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Vérifier si nous sommes sur la page de login, d'inscription ou la page principale
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const questionForm = document.getElementById('question-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Vérifier si un utilisateur est déjà connecté
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            // Si le localStorage est corrompu, le nettoyer
            localStorage.removeItem('currentUser');
            currentUser = null;
        }
        
        // Si nous sommes sur la page de login ou d'inscription, rediriger vers la page principale
        if ((loginForm && window.location.pathname.includes('login.html')) ||
            (signupForm && window.location.pathname.includes('signup.html'))) {
            window.location.href = 'Index.html';
            return;
        }
        
        // Si nous sommes sur la page principale, afficher le contenu
        if (questionForm) {
            showMainPage();
        }
    } else {
        // Si aucun utilisateur n'est connecté et nous sommes sur la page principale, rediriger vers le login
        if (questionForm && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Événements pour la page de login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Événements pour la page d'inscription
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Événements pour la page principale
    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Fonction pour hasher un mot de passe (même algorithme que dans database.js)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Ajouter un salt simple pour plus de sécurité
    return hash.toString(16) + password.length.toString(16);
}

// Gestion de la connexion
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Hasher le mot de passe saisi pour le comparer avec celui stocké
    const hashedPassword = hashPassword(password);
    
    // Vérification d'authentification
    const user = Database.getUserByUsername(username);
    
    if (user && user.password === hashedPassword) {
        currentUser = { id: user.id, username: user.username };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'Index.html';
    } else {
        showLoginMessage("Nom d'utilisateur ou mot de passe incorrect", true);
    }
}

// Gestion de l'inscription
function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    
    // Validation
    if (username.length < 3) {
        showSignupMessage("Le nom d'utilisateur doit contenir au moins 3 caractères", true);
        return;
    }
    
    if (password.length < 4) {
        showSignupMessage("Le mot de passe doit contenir au moins 4 caractères", true);
        return;
    }
    
    if (password !== passwordConfirm) {
        showSignupMessage("Les mots de passe ne correspondent pas", true);
        return;
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = Database.getUserByUsername(username);
    if (existingUser) {
        showSignupMessage("Ce nom d'utilisateur est déjà pris", true);
        return;
    }
    
    // Créer le nouvel utilisateur
    const newUser = Database.addUser(username, password);
    
    if (newUser) {
        // Connecter automatiquement l'utilisateur
        currentUser = { id: newUser.id, username: newUser.username };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showSignupMessage("Inscription réussie ! Redirection...", false);
        
        // Rediriger vers la page principale après un court délai
        setTimeout(() => {
            window.location.href = 'Index.html';
        }, 1000);
    } else {
        showSignupMessage("Erreur lors de l'inscription. Veuillez réessayer.", true);
    }
}

// Gestion de la déconnexion
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Gestion de l'ajout d'une question
function handleQuestionSubmit(e) {
    e.preventDefault();
    
    // Vérifier que l'utilisateur est connecté
    if (!currentUser || !currentUser.username) {
        window.location.href = 'login.html';
        return;
    }
    
    const questionContent = document.getElementById('question-content').value;
    
    if (questionContent.trim() === '') {
        return;
    }
    
    // Créer un nouvel objet question
    const newQuestion = {
        content: questionContent,
        author: currentUser.username,
        date: new Date().toISOString(),
        answers: []
    };
    
    // Simuler l'ajout via AJAX
    addQuestion(newQuestion);
    
    // Réinitialiser le formulaire
    document.getElementById('question-content').value = '';
}

// Gestion de l'ajout d'une réponse
function handleAnswerSubmit(questionId) {
    const answerTextarea = document.getElementById(`answer-${questionId}`);
    const answerContent = answerTextarea ? answerTextarea.value : '';
    
    if (answerContent.trim() === '') {
        return;
    }
    
    addAnswer(questionId, answerContent);
}

// Gestion de la suppression d'une question
function handleDeleteQuestion(questionId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette question?")) {
        // Simuler la suppression via AJAX
        deleteQuestion(questionId);
    }
}

// Gestion de la suppression d'une réponse
function handleDeleteAnswer(questionId, answerId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette réponse?")) {
        // Simuler la suppression via AJAX
        deleteAnswer(questionId, answerId);
    }
}

// Fonctions AJAX simulées
function loadQuestions() {
    // Simuler un délai de chargement
    setTimeout(() => {
        const questions = Database.getQuestions();
        displayQuestions(questions);
    }, 500);
}

function addQuestion(question) {
    // Simuler un délai d'ajout
    setTimeout(() => {
        Database.addQuestion(question);
        displayQuestions(Database.getQuestions());
        showSuccessMessage("Question ajoutée avec succès!");
    }, 300);
}

function addAnswer(questionId, answerContent) {
    // Vérifier que l'utilisateur est connecté
    if (!currentUser || !currentUser.username) {
        window.location.href = 'login.html';
        return;
    }
    
    // Créer un nouvel objet réponse
    const newAnswer = {
        content: answerContent,
        author: currentUser.username,
        date: new Date().toISOString()
    };
    
    // Simuler un délai d'ajout
    setTimeout(() => {
        Database.addAnswer(questionId, newAnswer);
        displayQuestions(Database.getQuestions());
        showSuccessMessage("Réponse ajoutée avec succès!");
        
        // Vider le champ de réponse après ajout
        const answerTextarea = document.getElementById(`answer-${questionId}`);
        if (answerTextarea) {
            answerTextarea.value = '';
        }
    }, 300);
}

function deleteQuestion(questionId) {
    // Simuler un délai de suppression
    setTimeout(() => {
        Database.deleteQuestion(questionId);
        displayQuestions(Database.getQuestions());
        showSuccessMessage("Question supprimée avec succès!");
    }, 300);
}

function deleteAnswer(questionId, answerId) {
    // Simuler un délai de suppression
    setTimeout(() => {
        Database.deleteAnswer(questionId, answerId);
        displayQuestions(Database.getQuestions());
        showSuccessMessage("Réponse supprimée avec succès!");
    }, 300);
}

// Fonction pour échapper le HTML et prévenir les attaques XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Affichage des questions
function displayQuestions(questionsList) {
    const questionsContainer = document.getElementById('questions-container');
    
    if (questionsList.length === 0) {
        questionsContainer.innerHTML = '<div class="card">Aucune question pour le moment. Soyez le premier à en poser une!</div>';
        return;
    }
    
    let html = '';
    
    questionsList.forEach(question => {
        const questionDate = new Date(question.date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let answersHtml = '';
        
        if (question.answers.length > 0) {
            question.answers.forEach(answer => {
                const answerDate = new Date(answer.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const canDeleteAnswer = currentUser && (currentUser.username === answer.author || currentUser.username === 'admin');
                
                // Échapper les contenus utilisateur pour prévenir XSS
                const safeAnswerAuthor = escapeHtml(answer.author);
                const safeAnswerContent = escapeHtml(answer.content);
                
                answersHtml += `
                    <div class="answer">
                        <div class="answer-header">
                            <span class="answer-author">${safeAnswerAuthor}</span>
                            <div>
                                <span class="answer-date">${answerDate}</span>
                                ${canDeleteAnswer ? `<button class="delete-btn" onclick="handleDeleteAnswer(${question.id}, ${answer.id})">Supprimer</button>` : ''}
                            </div>
                        </div>
                        <div class="answer-content">${safeAnswerContent}</div>
                    </div>
                `;
            });
        } else {
            answersHtml = '<p class="no-answers">Aucune réponse pour le moment.</p>';
        }
        
        const canDeleteQuestion = currentUser && (currentUser.username === question.author || currentUser.username === 'admin');
        
        // Échapper les contenus utilisateur pour prévenir XSS
        const safeQuestionAuthor = escapeHtml(question.author);
        const safeQuestionContent = escapeHtml(question.content);
        
        html += `
            <div class="card question">
                <div class="question-header">
                    <span class="question-author">${safeQuestionAuthor}</span>
                    <div>
                        <span class="question-date">${questionDate}</span>
                        ${canDeleteQuestion ? `<button class="delete-btn" onclick="handleDeleteQuestion(${question.id})">Supprimer</button>` : ''}
                    </div>
                </div>
                <div class="question-content">${safeQuestionContent}</div>
                <div class="answers">
                    <h3>Réponses (${question.answers.length})</h3>
                    ${answersHtml}
                    <div class="answer-form">
                        <textarea id="answer-${question.id}" placeholder="Votre réponse..." rows="3"></textarea>
                        <button class="btn btn-primary" onclick="handleAnswerSubmit(${question.id})">Répondre</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    questionsContainer.innerHTML = html;
}

// Affichage des pages
function showMainPage() {
    const mainPage = document.getElementById('main-page');
    const currentUserSpan = document.getElementById('current-user');
    const logoutBtn = document.getElementById('logout-btn');
    
    mainPage.classList.remove('hidden');
    currentUserSpan.textContent = `Connecté en tant que ${currentUser.username}`;
    logoutBtn.classList.remove('hidden');
    
    // Charger les questions
    loadQuestions();
}

// Messages
function showLoginMessage(message, isError = true) {
    const loginMessage = document.getElementById('login-message');
    loginMessage.textContent = message;
    loginMessage.className = isError ? 'error-message' : 'success-message';
}

function showSignupMessage(message, isError = true) {
    const signupMessage = document.getElementById('signup-message');
    signupMessage.textContent = message;
    signupMessage.className = isError ? 'error-message' : 'success-message';
}

function showSuccessMessage(message) {
    // Supprimer les anciens messages de succès
    const oldMessages = document.querySelectorAll('.success-message-temp');
    oldMessages.forEach(msg => msg.remove());
    
    // Créer un nouvel élément de message
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message success-message-temp';
    messageEl.textContent = message;
    
    // Ajouter le message en haut de la page principale
    const mainPage = document.getElementById('main-page');
    const firstChild = mainPage.firstElementChild;
    mainPage.insertBefore(messageEl, firstChild);
    
    // Supprimer le message après 3 secondes
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}