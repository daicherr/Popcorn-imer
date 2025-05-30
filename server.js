// Importa o framework Express para criar o servidor web.
const express = require('express');
// Importa o Mongoose para interagir com o MongoDB.
const mongoose = require('mongoose');
// Importa o bcryptjs para criptografar senhas.
const bcrypt = require('bcryptjs');
// Importa o jsonwebtoken para criar e verificar tokens JWT.
const jwt = require('jsonwebtoken');
// Importa o cors para habilitar o Cross-Origin Resource Sharing.
const cors = require('cors');
// Importa o axios para fazer requisições HTTP (usado para a API do TMDB).
const axios = require('axios');

// Carrega variáveis de ambiente do arquivo .env.
require('dotenv').config();

// Cria uma instância do aplicativo Express.
const app = express();
// Define a porta do servidor, priorizando a variável de ambiente PORT ou usando 5001 como padrão.
const PORT = process.env.PORT || 5001;

// Habilita o CORS para todas as rotas.
app.use(cors());
// Habilita o parsing de JSON no corpo das requisições.
app.use(express.json());

// Obtém a string de conexão do MongoDB Atlas das variáveis de ambiente.
const MONGO_URI = process.env.MONGO_ATLAS_URI;

// Verifica se a string de conexão do MongoDB foi definida.
if (!MONGO_URI) {
    console.error("ERRO: String de conexão do MongoDB Atlas (MONGO_ATLAS_URI) não definida no arquivo .env");
    // Encerra o processo se a string de conexão não estiver definida.
    process.exit(1);
}

// Conecta ao MongoDB Atlas usando a string de conexão.
mongoose.connect(MONGO_URI)
.then(() => console.log('Conectado com sucesso ao MongoDB Atlas!')) // Log de sucesso na conexão.
.catch(err => {
    console.error('Erro ao conectar ao MongoDB Atlas:', err); // Log de erro na conexão.
    process.exit(1); // Encerra o processo em caso de erro na conexão.
});

// --- DEFINIÇÃO DOS SCHEMAS DO MONGOOSE ---

// Define o schema para os usuários.
const userSchema = new mongoose.Schema({
    email: {
        type: String, // Tipo do campo.
        required: [true, "O email é obrigatório"], // Campo obrigatório com mensagem de erro.
        unique: true, // Garante que o email seja único no banco de dados.
        trim: true, // Remove espaços em branco do início e do fim.
        lowercase: true, // Converte o email para minúsculas.
        match: [/\S+@\S+\.\S+/, 'Por favor, use um email válido.'] // Validação de formato de email.
    },
    password: {
        type: String,
        required: [true, "A senha é obrigatória"],
        minlength: [6, "A senha deve ter pelo menos 6 caracteres"] // Validação de tamanho mínimo da senha.
    },
    createdAt: {
        type: Date,
        default: Date.now // Define a data de criação padrão como o momento atual.
    }
});

// Middleware (hook) que é executado antes de salvar um usuário.
userSchema.pre('save', async function(next) {
    // Se a senha não foi modificada, pula para o próximo middleware.
    if (!this.isModified('password')) return next();
    try {
        // Gera um "salt" para a criptografia da senha.
        const salt = await bcrypt.genSalt(10);
        // Criptografa a senha usando o salt gerado.
        this.password = await bcrypt.hash(this.password, salt);
        next(); // Continua o processo de salvar.
    } catch (error) {
        next(error); // Passa o erro para o próximo manipulador de erro.
    }
});

// Método para comparar a senha fornecida com a senha armazenada (criptografada).
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Cria o modelo 'User' a partir do userSchema.
const User = mongoose.model('User', userSchema);

// Define o schema para as críticas de filmes.
const reviewSchema = new mongoose.Schema({
    movieId: { // ID do filme (geralmente do TMDB).
        type: String,
        required: true, // Campo obrigatório.
        index: true // Cria um índice para otimizar buscas por movieId.
    },
    userId: { // ID do usuário que fez a crítica.
        type: mongoose.Schema.Types.ObjectId, // Tipo ObjectId do Mongoose.
        required: true,
        ref: 'User', // Referência ao modelo 'User'.
        index: true // Cria um índice para otimizar buscas por userId.
    },
    userEmail: { // Email do usuário (para exibição ou referência rápida).
        type: String,
        required: true,
    },
    rating: { // Nota da crítica.
        type: Number,
        required: [true, "A nota é obrigatória."],
        min: 0.5, // Nota mínima.
        max: 5 // Nota máxima.
    },
    reviewText: { // Texto da crítica.
        type: String,
        trim: true,
        maxlength: [5000, "A crítica não pode exceder 5000 caracteres."] // Tamanho máximo do texto.
    },
    tags: { // Tags associadas à crítica.
        type: [String], // Array de strings.
        default: [] // Valor padrão é um array vazio.
    },
    isSpoiler: { // Indica se a crítica contém spoilers.
        type: Boolean,
        default: false // Valor padrão é falso.
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: { // Data da última atualização da crítica.
        type: Date,
        default: Date.now
    }
});

// Middleware (hook) que é executado antes de salvar uma crítica.
reviewSchema.pre('save', function(next) {
    // Atualiza o campo updatedAt para o momento atual.
    this.updatedAt = Date.now();
    next();
});

// Cria um índice composto para garantir que um usuário só possa fazer uma crítica por filme.
reviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

// Cria o modelo 'Review' a partir do reviewSchema.
const Review = mongoose.model('Review', reviewSchema);

// Define o schema para itens de filme dentro de uma lista de usuário.
const movieItemSchema = new mongoose.Schema({
    tmdbId: { type: String, required: true }, // ID do filme no TMDB.
    title: { type: String, required: true }, // Título do filme.
    posterPath: { type: String }, // Caminho para o pôster do filme.
    addedAt: { type: Date, default: Date.now } // Data em que o filme foi adicionado à lista.
}, { _id: false }); // {_id: false} impede a criação de um _id para cada movieItem.

// Define o schema para listas de filmes dos usuários.
const userListSchema = new mongoose.Schema({
    name: { // Nome da lista.
        type: String,
        required: [true, "O nome da lista é obrigatório."],
        trim: true,
        maxlength: [100, "O nome da lista não pode exceder 100 caracteres."]
    },
    userId: { // ID do usuário proprietário da lista.
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true // Cria um índice para otimizar buscas por userId.
    },
    movies: [movieItemSchema], // Array de filmes na lista, usando o movieItemSchema.
    isPublic: { type: Boolean, default: false }, // Indica se a lista é pública.
    description: { // Descrição da lista.
        type: String,
        trim: true,
        maxlength: [500, "A descrição não pode exceder 500 caracteres."]
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now } // Data da última atualização da lista.
});

// Middleware (hook) que é executado antes de salvar uma lista.
userListSchema.pre('save', function(next) {
    // Atualiza o campo updatedAt para o momento atual.
    this.updatedAt = Date.now();
    next();
});

// Cria um índice composto para garantir que um usuário não tenha listas com o mesmo nome.
userListSchema.index({ userId: 1, name: 1 }, { unique: true });

// Cria o modelo 'UserList' a partir do userListSchema.
const UserList = mongoose.model('UserList', userListSchema);

// --- MIDDLEWARE DE PROTEÇÃO DE ROTAS ---
// Middleware para verificar o token JWT e proteger rotas.
const protect = async (req, res, next) => {
    let token;
    // Verifica se o token está presente no header de autorização e se começa com 'Bearer'.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrai o token do header.
            token = req.headers.authorization.split(' ')[1];
            // Obtém o segredo JWT das variáveis de ambiente.
            const JWT_SECRET = process.env.JWT_SECRET;
            // Verifica se o segredo JWT está configurado.
            if (!JWT_SECRET) {
                throw new Error('Configuração de autenticação inválida no servidor.');
            }
            // Verifica e decodifica o token.
            const decoded = jwt.verify(token, JWT_SECRET);
            // Busca o usuário no banco de dados pelo ID contido no token, excluindo a senha.
            req.user = await User.findById(decoded.userId).select('-password');
            // Verifica se o usuário ainda existe.
            if (!req.user) {
                return res.status(401).json({ message: 'Usuário não encontrado para este token.' });
            }
            next(); // Permite o acesso à rota protegida.
        } catch (error) {
            // Trata erros específicos de JWT.
            if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Token inválido.' });
            if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expirado.' });
            // Trata outros erros de autorização.
            return res.status(401).json({ message: 'Não autorizado, falha no token.' });
        }
    }
    // Se nenhum token for fornecido.
    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota para registrar um novo usuário.
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body; // Extrai email e senha do corpo da requisição.
    // Validação básica dos campos.
    if (!email || !password) return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
    if (password.length < 6) return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    try {
        // Verifica se o email já está em uso.
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ message: 'Este email já está em uso.' });
        // Cria um novo usuário.
        const newUser = new User({ email, password });
        // Salva o novo usuário no banco de dados (a senha será criptografada pelo hook pre-save).
        await newUser.save();
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: newUser._id });
    } catch (error) {
        // Trata erro de chave duplicada (email já existe).
        if (error.code === 11000) return res.status(400).json({ message: 'Este email já está em uso (erro de duplicidade).' });
        // Trata erros de validação do Mongoose.
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        // Trata outros erros internos do servidor.
        res.status(500).json({ message: 'Erro interno do servidor ao tentar cadastrar o usuário.' });
    }
});

// Rota para login de usuário.
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    // Validação básica dos campos.
    if (!email || !password) return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
    try {
        // Procura o usuário pelo email (convertido para minúsculas).
        const user = await User.findOne({ email: email.toLowerCase() });
        // Se o usuário não for encontrado, retorna erro de credenciais inválidas.
        if (!user) return res.status(401).json({ message: 'Email ou senha inválidos.' });
        // Compara a senha fornecida com a senha armazenada (usando o método do schema).
        const isMatch = await user.comparePassword(password);
        // Se as senhas não baterem, retorna erro de credenciais inválidas.
        if (!isMatch) return res.status(401).json({ message: 'Email ou senha inválidos.' });
        // Obtém o segredo JWT das variáveis de ambiente.
        const JWT_SECRET = process.env.JWT_SECRET;
        // Verifica se o segredo JWT está configurado.
        if (!JWT_SECRET) return res.status(500).json({ message: "Erro de configuração do servidor (segredo JWT)." });
        // Define o payload do token JWT.
        const tokenPayload = { userId: user._id, email: user.email };
        // Gera o token JWT.
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
        // Retorna mensagem de sucesso, o token e informações básicas do usuário.
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token,
            user: { id: user._id, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
    }
});

// --- ROTAS PARA INTERAÇÃO COM A API DO TMDB ---
// Chave da API do TMDB e URL base, obtidas das variáveis de ambiente.
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Rota para buscar filmes populares no TMDB.
app.get('/api/tmdb/popular', async (req, res) => {
    // Verifica se a chave da API do TMDB está configurada.
    if (!TMDB_API_KEY) return res.status(500).json({ message: 'Chave da API do TMDB não configurada no servidor.' });
    try {
        // Faz a requisição GET para a API do TMDB.
        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, { params: { api_key: TMDB_API_KEY, language: 'pt-BR', page: 1 } });
        // Retorna os resultados da API.
        res.json(response.data.results);
    } catch (error) {
        // Trata erros da requisição à API do TMDB.
        res.status(error.response ? error.response.status : 500).json({ message: 'Erro ao buscar filmes populares.' });
    }
});

// Rota para buscar filmes que serão lançados em breve no TMDB.
app.get('/api/tmdb/upcoming', async (req, res) => {
    if (!TMDB_API_KEY) return res.status(500).json({ message: 'Chave da API do TMDB não configurada no servidor.' });
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, { params: { api_key: TMDB_API_KEY, language: 'pt-BR', page: 1 } });
        res.json(response.data.results);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json({ message: 'Erro ao buscar filmes em breve.' });
    }
});

// Rota para buscar um filme em destaque (atualmente, o primeiro da lista de "now_playing").
app.get('/api/tmdb/featured', async (req, res) => {
    if (!TMDB_API_KEY) return res.status(500).json({ message: 'Chave da API do TMDB não configurada no servidor.' });
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, { params: { api_key: TMDB_API_KEY, language: 'pt-BR', page: 1 } });
        // Verifica se há resultados e retorna o primeiro.
        if (response.data.results && response.data.results.length > 0) res.json(response.data.results[0]);
        else res.status(404).json({ message: 'Nenhum filme em destaque encontrado.' });
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json({ message: 'Erro ao buscar filme em destaque.' });
    }
});

// Rota para buscar detalhes de um filme específico no TMDB pelo ID.
app.get('/api/tmdb/movie/:movieId', async (req, res) => {
    const { movieId } = req.params; // Extrai o ID do filme dos parâmetros da rota.
    if (!TMDB_API_KEY) return res.status(500).json({ message: 'Chave da API do TMDB não configurada no servidor.' });
    if (!movieId) return res.status(400).json({ message: 'O ID do filme é obrigatório.' }); // Validação do ID do filme.
    try {
        // Faz a requisição à API do TMDB, incluindo informações adicionais (créditos, vídeos, etc.).
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, { params: { api_key: TMDB_API_KEY, language: 'pt-BR', append_to_response: 'credits,videos,images,release_dates,watch/providers' } });
        res.json(response.data); // Retorna os dados do filme.
    } catch (error) {
        // Trata erros da requisição, incluindo mensagens de erro específicas do TMDB.
        if (error.response) res.status(error.response.status).json({ message: `Erro ao buscar detalhes do filme no TMDB: ${error.response.data.status_message || error.message}`, tmdb_status_code: error.response.data.status_code });
        else res.status(500).json({ message: `Erro interno do servidor ao buscar detalhes do filme: ${error.message}` });
    }
});


// --- ROTAS DE REVIEWS (CRÍTICAS DE FILMES) ---

// Rota para criar ou atualizar uma crítica para um filme. Requer autenticação.
app.post('/api/reviews/:movieId', protect, async (req, res) => {
    const { movieId } = req.params; // ID do filme.
    const { rating, reviewText, tags, isSpoiler } = req.body; // Dados da crítica do corpo da requisição.
    const userId = req.user._id; // ID do usuário autenticado.
    const userEmail = req.user.email; // Email do usuário autenticado.

    // Validação dos dados da crítica.
    if (rating == null || typeof rating !== 'number' || rating < 0.5 || rating > 5) return res.status(400).json({ message: "A nota (rating) é obrigatória e deve ser um número entre 0.5 e 5." });
    if (reviewText && typeof reviewText !== 'string') return res.status(400).json({ message: "O texto da crítica, se fornecido, deve ser uma string."});
    if (tags && !Array.isArray(tags)) return res.status(400).json({ message: "Tags devem ser um array de strings."});
    if (isSpoiler != null && typeof isSpoiler !== 'boolean') return res.status(400).json({ message: "isSpoiler deve ser um valor booleano."});

    try {
        // Prepara os dados da crítica, definindo valores padrão se não fornecidos.
        const reviewData = { rating, reviewText: reviewText || '', tags: tags || [], isSpoiler: isSpoiler || false, updatedAt: Date.now() };
        // Tenta encontrar e atualizar uma crítica existente (upsert) ou criar uma nova.
        const existingReview = await Review.findOneAndUpdate(
            { movieId, userId }, // Critério de busca (mesmo filme, mesmo usuário).
            { ...reviewData, userEmail }, // Dados para atualizar/inserir, incluindo email do usuário.
            // Opções: new=true (retorna o documento atualizado), upsert=true (cria se não existir), runValidators=true (executa validações do schema).
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        // Determina se a crítica foi criada (201) ou atualizada (200) comparando createdAt e updatedAt.
        res.status(existingReview.createdAt.getTime() === existingReview.updatedAt.getTime() ? 201 : 200).json({
            message: existingReview.createdAt.getTime() === existingReview.updatedAt.getTime() ? "Crítica adicionada com sucesso!" : "Crítica atualizada com sucesso!",
            review: existingReview
        });
    } catch (error) {
        // Trata erros de validação do Mongoose.
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ message: messages.join(', ') }); }
        res.status(500).json({ message: "Erro interno do servidor ao salvar a crítica." });
    }
});

// Rota para buscar todas as críticas de um filme específico.
app.get('/api/reviews/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        // Busca todas as críticas para o movieId, ordenadas pela data de criação (mais recentes primeiro).
        const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (error) { res.status(500).json({ message: "Erro interno do servidor ao buscar as críticas." }); }
});

// Rota para calcular estatísticas de um filme (nota média e número de críticas).
app.get('/api/movies/:movieId/stats', async (req, res) => {
    const { movieId } = req.params;
    try {
        const reviews = await Review.find({ movieId });
        // Se não houver críticas, retorna 0 para a nota média e contagem.
        if (reviews.length === 0) return res.status(200).json({ averageRating: 0, reviewCount: 0 });
        // Calcula a soma total das notas.
        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
        // Calcula a nota média.
        const averageRating = totalRating / reviews.length;
        // Retorna a nota média (formatada com uma casa decimal) e a contagem de críticas.
        res.status(200).json({ averageRating: parseFloat(averageRating.toFixed(1)), reviewCount: reviews.length });
    } catch (error) { res.status(500).json({ message: "Erro ao calcular a nota média." }); }
});

// Rota para contar o número de avaliações feitas por um usuário específico. Requer autenticação.
app.get('/api/reviews/user/:userId/count', protect, async (req, res) => {
    const { userId } = req.params; // ID do usuário dos parâmetros da rota.
    // Verifica se o usuário autenticado está tentando acessar suas próprias estatísticas.
    if (req.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Não autorizado a acessar estatísticas deste usuário." });
    }
    try {
        // Conta o número de documentos (críticas) que correspondem ao userId.
        const count = await Review.countDocuments({ userId: userId });
        res.status(200).json({ count });
    } catch (error) {
        console.error('Erro ao contar avaliações do usuário:', error);
        res.status(500).json({ message: "Erro interno do servidor ao contar as avaliações." });
    }
});


// --- ROTAS DE LISTAS DE USUÁRIOS (UserList) ---

// Rota para criar uma nova lista de filmes para o usuário autenticado. Requer autenticação.
app.post('/api/lists', protect, async (req, res) => {
    const { name, description, isPublic } = req.body; // Dados da lista do corpo da requisição.
    const userId = req.user._id; // ID do usuário autenticado.
    // Validação do nome da lista.
    if (!name || typeof name !== 'string' || name.trim() === '') return res.status(400).json({ message: "O nome da lista é obrigatório." });
    try {
        // Cria uma nova instância de UserList.
        const newList = new UserList({ name: name.trim(), userId, description: description || '', isPublic: isPublic || false, movies: [] });
        // Salva a nova lista no banco de dados.
        const savedList = await newList.save();
        res.status(201).json(savedList); // Retorna a lista criada.
    } catch (error) {
        // Trata erro de chave duplicada (usuário já tem uma lista com o mesmo nome).
        if (error.code === 11000) { return res.status(400).json({ message: `Você já possui uma lista com o nome "${name.trim()}".` });}
        // Trata erros de validação do Mongoose.
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ message: messages.join(', ') });}
        res.status(500).json({ message: "Erro ao criar a lista." });
    }
});

// Rota para buscar todas as listas do usuário autenticado. Requer autenticação.
app.get('/api/lists', protect, async (req, res) => {
    try {
        // Busca todas as listas que pertencem ao userId do usuário autenticado, ordenadas pela data de atualização.
        const lists = await UserList.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.status(200).json(lists);
    } catch (error) { res.status(500).json({ message: "Erro ao buscar as listas." }); }
});

// Rota para buscar os detalhes de uma lista específica do usuário autenticado. Requer autenticação.
app.get('/api/lists/:listId', protect, async (req, res) => {
    try {
        // Busca uma lista pelo seu ID e pelo ID do usuário autenticado.
        const list = await UserList.findOne({ _id: req.params.listId, userId: req.user._id });
        // Se a lista não for encontrada ou não pertencer ao usuário, retorna 404.
        if (!list) return res.status(404).json({ message: 'Lista não encontrada ou não pertence a este usuário.' });
        res.status(200).json(list);
    } catch (error) {
        // Trata erro de formato inválido do ObjectId.
        if (error.kind === 'ObjectId') return res.status(400).json({ message: 'ID da lista inválido.' });
        res.status(500).json({ message: 'Erro ao buscar detalhes da lista.' });
    }
});

// Rota para atualizar uma lista existente do usuário autenticado. Requer autenticação.
app.put('/api/lists/:listId', protect, async (req, res) => {
    const { name, description, isPublic } = req.body; // Novos dados da lista.
    const { listId } = req.params; // ID da lista a ser atualizada.
    const userId = req.user._id; // ID do usuário autenticado.

    // Validação do nome da lista.
    if (!name || typeof name !== 'string' || name.trim() === '') return res.status(400).json({ message: "O nome da lista é obrigatório." });
    try {
        // Busca a lista para garantir que ela existe e pertence ao usuário.
        const list = await UserList.findOne({ _id: listId, userId });
        if (!list) return res.status(404).json({ message: 'Lista não encontrada ou não pertence a este usuário.' });

        // Verifica se o novo nome da lista já está em uso por outra lista do mesmo usuário.
        if (name.trim().toLowerCase() !== list.name.toLowerCase()) {
            const existingListWithNewName = await UserList.findOne({ userId, name: name.trim(), _id: { $ne: listId } }); // $ne: listId exclui a lista atual da verificação.
            if (existingListWithNewName) {
                return res.status(400).json({ message: `Você já possui outra lista com o nome "${name.trim()}".` });
            }
        }
        
        // Atualiza os campos da lista.
        list.name = name.trim();
        list.description = description != null ? description.trim() : ''; // Garante que a descrição seja string.
        list.isPublic = isPublic != null ? isPublic : false; // Garante que isPublic seja booleano.
        list.updatedAt = Date.now(); // Atualiza a data de modificação.
        const updatedList = await list.save(); // Salva as alterações.
        res.status(200).json(updatedList); // Retorna a lista atualizada.
    } catch (error) {
        if (error.kind === 'ObjectId') return res.status(400).json({ message: 'ID da lista inválido.' });
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ message: messages.join(', ') });}
        res.status(500).json({ message: 'Erro ao atualizar a lista.' });
    }
});

// Rota para deletar uma lista do usuário autenticado. Requer autenticação.
app.delete('/api/lists/:listId', protect, async (req, res) => {
    try {
        // Encontra e deleta a lista se ela pertencer ao usuário autenticado.
        const list = await UserList.findOneAndDelete({ _id: req.params.listId, userId: req.user._id });
        if (!list) return res.status(404).json({ message: 'Lista não encontrada ou não pertence a este usuário.' });
        res.status(200).json({ message: 'Lista deletada com sucesso.' });
    } catch (error) {
        if (error.kind === 'ObjectId') return res.status(400).json({ message: 'ID da lista inválido.' });
        res.status(500).json({ message: 'Erro ao deletar a lista.' });
    }
});

// Rota para adicionar um filme a uma lista específica do usuário autenticado. Requer autenticação.
app.post('/api/lists/:listId/movies', protect, async (req, res) => {
    const { tmdbId, title, posterPath } = req.body; // Dados do filme a ser adicionado.
    // Validação dos dados do filme.
    if (!tmdbId || !title) return res.status(400).json({ message: 'ID do filme (tmdbId) e título são obrigatórios.' });
    try {
        const list = await UserList.findOne({ _id: req.params.listId, userId: req.user._id });
        if (!list) return res.status(404).json({ message: 'Lista não encontrada.' });
        // Verifica se o filme já está na lista.
        if (list.movies.find(movie => movie.tmdbId === tmdbId.toString())) {
            return res.status(400).json({ message: 'Este filme já está na lista.' });
        }
        // Adiciona o filme ao array 'movies' da lista.
        list.movies.push({ tmdbId: tmdbId.toString(), title, posterPath: posterPath || '' }); // Garante que posterPath tenha um valor.
        list.updatedAt = Date.now(); // Atualiza a data de modificação da lista.
        await list.save(); // Salva a lista com o novo filme.
        res.status(200).json(list); // Retorna a lista atualizada.
    } catch (error) {
        if (error.kind === 'ObjectId') return res.status(400).json({ message: 'ID da lista inválido.' });
        res.status(500).json({ message: 'Erro ao adicionar filme à lista.' });
    }
});

// Rota para remover um filme de uma lista específica do usuário autenticado. Requer autenticação.
app.delete('/api/lists/:listId/movies/:tmdbMovieId', protect, async (req, res) => {
    try {
        const list = await UserList.findOne({ _id: req.params.listId, userId: req.user._id });
        if (!list) return res.status(404).json({ message: 'Lista não encontrada.' });
        // Encontra o índice do filme no array 'movies'.
        const movieIndex = list.movies.findIndex(movie => movie.tmdbId === req.params.tmdbMovieId.toString());
        // Se o filme não for encontrado na lista, retorna 404.
        if (movieIndex === -1) return res.status(404).json({ message: 'Filme não encontrado nesta lista.' });
        // Remove o filme do array.
        list.movies.splice(movieIndex, 1);
        list.updatedAt = Date.now(); // Atualiza a data de modificação da lista.
        await list.save(); // Salva a lista sem o filme removido.
        res.status(200).json(list); // Retorna a lista atualizada.
    } catch (error) {
        if (error.kind === 'ObjectId') return res.status(400).json({ message: 'ID da lista ou do filme inválido.' });
        res.status(500).json({ message: 'Erro ao remover filme da lista.' });
    }
});

// Rota para buscar filmes no TMDB com base em um termo de pesquisa (query).
app.get('/api/tmdb/search/movie', async (req, res) => {
    const { query } = req.query; // Obtém o termo de busca dos parâmetros da query string.

    // Verifica se a chave da API do TMDB está configurada.
    if (!TMDB_API_KEY) {
        return res.status(500).json({ message: 'Chave da API do TMDB não configurada no servidor.' });
    }
    // Valida se o termo de busca foi fornecido.
    if (!query || query.trim() === '') {
        return res.status(400).json({ message: 'O termo de busca (query) é obrigatório.' });
    }

    try {
        // Faz a requisição para a API de busca do TMDB.
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'pt-BR', // Define o idioma dos resultados.
                query: query, // Termo de busca.
                page: 1, // Paginação (pode ser estendida no futuro).
                include_adult: false // Opcional: para não incluir conteúdo adulto.
            }
        });
        res.json(response.data.results); // Retorna a lista de filmes encontrados.
    } catch (error) {
        console.error("Erro ao buscar filmes no TMDB:", error.message);
        // Trata erros da requisição, incluindo mensagens de erro específicas do TMDB.
        if (error.response) {
            res.status(error.response.status).json({ 
                message: `Erro ao buscar filmes no TMDB: ${error.response.data.status_message || error.message}`,
                tmdb_status_code: error.response.data.status_code 
            });
        } else {
            res.status(500).json({ message: `Erro interno do servidor ao buscar filmes: ${error.message}` });
        }
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
// Inicia o servidor Express na porta definida.
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
    console.log(`Acesse em http://localhost:${PORT}.`);
});